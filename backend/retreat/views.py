import re
import datetime
from django.db.models import Q, Count
from django.utils import timezone
from django.http import HttpResponse

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import Participant, Program, RetreatDay, DaySession, Registration, Attendance, BulkMessage
from .serializers import (
    ParticipantSerializer, ProgramSerializer, RetreatDaySerializer,
    DaySessionSerializer, RegistrationSerializer, AttendanceSerializer,
    AttendanceRosterSerializer, DayReportSerializer, SignupSerializer,
)
from .serializers_auth import EmailLoginSerializer, GoogleLoginSerializer
from .pagination import StandardPagination
from .messaging import send_sms, send_bulk_email
from .exports import (
    build_participants_excel, build_participants_pdf,
    build_attendance_excel, build_attendance_pdf,
    build_program_report_excel, build_program_report_pdf,
)


# ── Participants ──────────────────────────────────────────────────────────────

class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all().order_by('full_name')
    serializer_class = ParticipantSerializer
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminUser()]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(full_name__icontains=search) | Q(school__icontains=search))
        return qs

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        total = Participant.objects.count()
        categories = ['Adult', 'Campus', 'Youth', 'Children']
        breakdown = {cat: {'M': 0, 'F': 0} for cat in categories}
        rows = Participant.objects.values('category', 'sex').annotate(n=Count('id'))
        for row in rows:
            cat = row['category']
            if cat in breakdown and row['sex'] in ('M', 'F'):
                breakdown[cat][row['sex']] = row['n']
        return Response({'total': total, 'by_category': breakdown})

    @action(detail=False, methods=['get'], url_path='export/excel',
            permission_classes=[IsAuthenticated, IsAdminUser])
    def export_excel(self, request):
        """Full styled Excel registry (respects ?search= like the list endpoint)."""
        participants = list(self.get_queryset())
        buf = build_participants_excel(participants)
        resp = HttpResponse(
            buf.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        resp['Content-Disposition'] = 'attachment; filename="participant_registry.xlsx"'
        return resp

    @action(detail=False, methods=['get'], url_path='export/pdf',
            permission_classes=[IsAuthenticated, IsAdminUser])
    def export_pdf(self, request):
        participants = list(self.get_queryset())
        buf = build_participants_pdf(participants)
        resp = HttpResponse(buf.read(), content_type='application/pdf')
        resp['Content-Disposition'] = 'attachment; filename="participant_registry.pdf"'
        return resp


# ── Programs ──────────────────────────────────────────────────────────────────

class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all().order_by('-start_date')
    serializer_class = ProgramSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminUser()]

    def _report_data(self, program):
        days = RetreatDay.objects.filter(program=program).prefetch_related('sessions__attendances')
        data = DayReportSerializer(days, many=True).data
        total_registrations = Registration.objects.filter(program=program).count()
        unique_attendees = Attendance.objects.filter(
            session__retreat_day__program=program, present=True
        ).values('participant').distinct().count()
        return data, total_registrations, unique_attendees

    @action(detail=True, methods=['get'], url_path='report')
    def full_report(self, request, pk=None):
        """Overall retreat report: all days + per-day breakdown."""
        program = self.get_object()
        data, total_registrations, unique_attendees = self._report_data(program)
        return Response({
            'program':             ProgramSerializer(program).data,
            'total_registrations': total_registrations,
            'unique_attendees':    unique_attendees,
            'days':                data,
        })

    @action(detail=True, methods=['get'], url_path='report/export/excel')
    def report_export_excel(self, request, pk=None):
        program = self.get_object()
        data, total_registrations, unique_attendees = self._report_data(program)
        buf = build_program_report_excel(program, data, total_registrations, unique_attendees)
        resp = HttpResponse(
            buf.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        resp['Content-Disposition'] = f'attachment; filename="{program.code}_report.xlsx"'
        return resp

    @action(detail=True, methods=['get'], url_path='report/export/pdf')
    def report_export_pdf(self, request, pk=None):
        program = self.get_object()
        data, total_registrations, unique_attendees = self._report_data(program)
        buf = build_program_report_pdf(program, data, total_registrations, unique_attendees)
        resp = HttpResponse(buf.read(), content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="{program.code}_report.pdf"'
        return resp


# ── Retreat Days ──────────────────────────────────────────────────────────────

class RetreatDayViewSet(viewsets.ModelViewSet):
    serializer_class = RetreatDaySerializer

    def get_queryset(self):
        program_pk = self.kwargs.get('program_pk')
        if program_pk:
            return RetreatDay.objects.filter(program_id=program_pk).prefetch_related('sessions')
        return RetreatDay.objects.all()

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]

    @action(detail=True, methods=['get'], url_path='report')
    def day_report(self, request, program_pk=None, pk=None):
        day  = self.get_object()
        data = DayReportSerializer(day).data
        return Response(data)


# ── Day Sessions (messages / programmes) ─────────────────────────────────────

class DaySessionViewSet(viewsets.ModelViewSet):
    serializer_class = DaySessionSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        day_pk = self.kwargs.get('day_pk')
        if day_pk:
            return DaySession.objects.filter(retreat_day_id=day_pk)
        return DaySession.objects.all()

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]

    def _roster_queryset(self, session, request):
        participants_qs = Participant.objects.all()
        search = request.query_params.get('search')
        if search:
            participants_qs = participants_qs.filter(
                Q(full_name__icontains=search) | Q(school__icontains=search)
            )
        existing_ids = set(
            Attendance.objects.filter(session=session).values_list('participant_id', flat=True)
        )
        missing_ids = Participant.objects.exclude(id__in=existing_ids).values_list('id', flat=True)
        if missing_ids:
            Attendance.objects.bulk_create(
                [Attendance(participant_id=pid, session=session) for pid in missing_ids],
                ignore_conflicts=True,
            )
        return (
            Attendance.objects
            .filter(session=session, participant__in=participants_qs)
            .select_related('participant')
            .order_by('participant__full_name')
        )

    @action(detail=True, methods=['get'], url_path='attendance')
    def attendance(self, request, **kwargs):
        """Paginated roster of participants + present/absent status for this session."""
        session = self.get_object()
        records = self._roster_queryset(session, request)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(records, request, view=self)
        data = AttendanceRosterSerializer(page, many=True).data
        response = paginator.get_paginated_response(data)

        response.data['summary'] = {
            'present': Attendance.objects.filter(session=session, present=True).count(),
            'absent':  Attendance.objects.filter(session=session, present=False).count(),
            'total':   Attendance.objects.filter(session=session).count(),
        }
        return response

    @action(detail=True, methods=['post'], url_path='mark')
    def mark(self, request, **kwargs):
        session        = self.get_object()
        participant_id = request.data.get('participant')
        present        = request.data.get('present', True)
        try:
            participant = Participant.objects.get(pk=participant_id)
        except Participant.DoesNotExist:
            return Response({'error': 'Participant not found.'}, status=404)
        record, _ = Attendance.objects.update_or_create(
            participant=participant, session=session,
            defaults={'present': present},
        )
        return Response({'id': record.id, 'present': record.present})

    @action(detail=True, methods=['post'], url_path='mark-all')
    def mark_all(self, request, **kwargs):
        session = self.get_object()
        present = bool(request.data.get('present', True))
        search  = request.data.get('search')

        participants_qs = Participant.objects.all()
        if search:
            participants_qs = participants_qs.filter(
                Q(full_name__icontains=search) | Q(school__icontains=search)
            )
        participant_ids = list(participants_qs.values_list('id', flat=True))

        existing = {
            a.participant_id: a
            for a in Attendance.objects.filter(session=session, participant_id__in=participant_ids)
        }
        to_create, to_update = [], []
        for pid in participant_ids:
            record = existing.get(pid)
            if record is None:
                to_create.append(Attendance(participant_id=pid, session=session, present=present))
            elif record.present != present:
                record.present = present
                to_update.append(record)

        if to_create:
            Attendance.objects.bulk_create(to_create, ignore_conflicts=True)
        if to_update:
            Attendance.objects.bulk_update(to_update, ['present'])

        return Response({'updated': len(to_create) + len(to_update), 'present': present})

    @action(detail=True, methods=['get'], url_path='export/excel')
    def export_excel(self, request, **kwargs):
        session = self.get_object()
        records = list(self._roster_queryset(session, request))
        buf = build_attendance_excel(session, records)
        resp = HttpResponse(
            buf.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        resp['Content-Disposition'] = f'attachment; filename="attendance_{session.id}.xlsx"'
        return resp

    @action(detail=True, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request, **kwargs):
        session = self.get_object()
        records = list(self._roster_queryset(session, request))
        buf = build_attendance_pdf(session, records)
        resp = HttpResponse(buf.read(), content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="attendance_{session.id}.pdf"'
        return resp


# ── Registrations ─────────────────────────────────────────────────────────────

class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.select_related('participant', 'program', 'registration_day').all()
    serializer_class = RegistrationSerializer
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminUser()]

    def get_queryset(self):
        qs = super().get_queryset()
        program_id = self.request.query_params.get('program')
        if program_id:
            qs = qs.filter(program_id=program_id)
        return qs


# ── Check-in ──────────────────────────────────────────────────────────────────

class CheckInThrottle(AnonRateThrottle):
    rate = '30/min'

@api_view(['GET'])
@permission_classes([AllowAny])
def check_in_by_code(request, code):
    if not re.match(r'^[A-Za-z0-9\-]{1,30}$', code):
        return Response({'error': 'Invalid code format.'}, status=400)

    try:
        p = Participant.objects.get(code=code)
        return Response({
            'type':      'participant',
            'full_name': p.full_name,
            'school':    p.school,
            'category':  p.category,
            'sex':       p.sex,
            'code':      p.code,
        })
    except Participant.DoesNotExist:
        pass

    try:
        prog = Program.objects.get(code=code)
        if not prog.is_active:
            return Response({'error': 'This retreat has ended and the code is no longer active.'}, status=410)
        return Response({'type': 'program', 'name': prog.name, 'theme': prog.theme, 'code': prog.code})
    except Program.DoesNotExist:
        pass

    return Response({'error': 'Code not found.'}, status=404)


# ── Auth ──────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    s = SignupSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)
    return Response(s.save(), status=201)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    s = EmailLoginSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)
    return Response(s.validated_data, status=200)

@api_view(['POST'])
@permission_classes([AllowAny])
def google_login_view(request):
    """Sign in (or silently create) an account from a Google Identity Services credential."""
    s = GoogleLoginSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)
    return Response(s.validated_data, status=200)

@api_view(['GET'])
@permission_classes([AllowAny])
def today_sessions(request):
    today = timezone.localdate()

    program = (
        Program.objects
        .filter(start_date__lte=today, end_date__gte=today)
        .order_by('-start_date')
        .first()
    )
    if not program:
        return Response([])

    day = RetreatDay.objects.filter(program=program, date=today).first()
    if not day:
        return Response([])

    sessions = DaySession.objects.filter(retreat_day=day).order_by('start_time')
    return Response(DaySessionSerializer(sessions, many=True).data)


# ── Bulk messaging (SMS + email) ──────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def bulk_message_view(request):
    """
    Body: {
      channel: 'sms' | 'email' | 'both',
      subject: str            (email only),
      body: str,
      category: str            (optional filter),
      program: int              (optional — only people registered for this program),
      search: str               (optional — name/school),
      participant_ids: [int]    (optional — explicit list, overrides the filters above),
    }
    """
    channel         = request.data.get('channel', 'email')
    subject         = request.data.get('subject', '')
    body            = request.data.get('body', '')
    participant_ids = request.data.get('participant_ids')
    category        = request.data.get('category')
    program_id      = request.data.get('program')
    search          = request.data.get('search')

    if not body or not body.strip():
        return Response({'error': 'Message body is required.'}, status=400)
    if channel not in ('sms', 'email', 'both'):
        return Response({'error': 'channel must be one of: sms, email, both.'}, status=400)

    qs = Participant.objects.all()
    if participant_ids:
        qs = qs.filter(id__in=participant_ids)
    else:
        if category:
            qs = qs.filter(category=category)
        if program_id:
            qs = qs.filter(registrations__program_id=program_id)
        if search:
            qs = qs.filter(Q(full_name__icontains=search) | Q(school__icontains=search))
    qs = qs.select_related('user').distinct()

    sms_sent = email_sent = 0

    if channel in ('sms', 'both'):
        numbers = [p.phone_number for p in qs if p.phone_number]
        results = send_sms(numbers, body)
        sms_sent = sum(1 for r in results if r['ok'])

    if channel in ('email', 'both'):
        recipients = [p.user.email for p in qs if p.user and p.user.email]
        email_sent = send_bulk_email(recipients, subject or 'Message from DLCF Retreat', body)

    BulkMessage.objects.create(
        sent_by=request.user, channel=channel, subject=subject, body=body,
        recipient_count=qs.count(),
        filter_desc=f"category={category or 'all'}, program={program_id or 'all'}, search={search or ''}",
    )

    return Response({
        'total_recipients': qs.count(),
        'sms_sent':   sms_sent,
        'email_sent': email_sent,
    })