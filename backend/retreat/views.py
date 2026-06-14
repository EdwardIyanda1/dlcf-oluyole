import re
import datetime

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import Participant, Program, RetreatDay, DaySession, Registration, Attendance
from .serializers import (
    ParticipantSerializer, ProgramSerializer, RetreatDaySerializer,
    DaySessionSerializer, RegistrationSerializer, AttendanceSerializer,
    AttendanceRosterSerializer, DayReportSerializer, SignupSerializer,
)
from .serializers_auth import EmailLoginSerializer


# ── Participants ──────────────────────────────────────────────────────────────

class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all().order_by('full_name')
    serializer_class = ParticipantSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminUser()]


# ── Programs ──────────────────────────────────────────────────────────────────

class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all().order_by('-start_date')
    serializer_class = ProgramSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminUser()]

    @action(detail=True, methods=['get'], url_path='report')
    def full_report(self, request, pk=None):
        """Overall retreat report: all days + per-day breakdown."""
        program = self.get_object()
        days    = RetreatDay.objects.filter(program=program).prefetch_related('sessions__attendances')
        data    = DayReportSerializer(days, many=True).data

        total_registrations = Registration.objects.filter(program=program).count()
        unique_attendees    = Attendance.objects.filter(
            session__retreat_day__program=program, present=True
        ).values('participant').distinct().count()

        return Response({
            'program':            ProgramSerializer(program).data,
            'total_registrations': total_registrations,
            'unique_attendees':   unique_attendees,
            'days':               data,
        })


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
        """Single-day report."""
        day  = self.get_object()
        data = DayReportSerializer(day).data
        return Response(data)


# ── Day Sessions (messages / programmes) ─────────────────────────────────────

class DaySessionViewSet(viewsets.ModelViewSet):
    serializer_class = DaySessionSerializer

    def get_queryset(self):
        day_pk = self.kwargs.get('day_pk')
        if day_pk:
            return DaySession.objects.filter(retreat_day_id=day_pk)
        return DaySession.objects.all()

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]

    @action(detail=True, methods=['get'], url_path='attendance')
    def attendance(self, request, **kwargs):
        """Returns all participants with their present/absent status for this session."""
        session      = self.get_object()
        participants = Participant.objects.all().order_by('full_name')
        roster       = []
        for p in participants:
            record, _ = Attendance.objects.get_or_create(participant=p, session=session)
            roster.append({
                'id':           record.id,
                'participant_id': p.id,
                'full_name':    p.full_name,
                'school':       p.school,
                'sex':          p.sex,
                'category':     p.category,
                'present':      record.present,
            })
        return Response(roster)

    @action(detail=True, methods=['post'], url_path='mark')
    def mark(self, request, **kwargs):
        """Toggle a single participant's presence. Body: {participant: id, present: bool}"""
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


# ── Registrations ─────────────────────────────────────────────────────────────

class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.select_related('participant', 'program', 'registration_day').all()
    serializer_class = RegistrationSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminUser()]


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