import re
from datetime import date

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

from .models import Participant, Program, RetreatSession, Attendance
from .serializers import (
    ParticipantSerializer,
    ProgramSerializer,
    RetreatSessionSerializer,
    AttendanceSerializer,
)


# ── Custom throttle: tighten check-in lookups to prevent enumeration ──────────
class CheckInThrottle(AnonRateThrottle):
    """
    Limits unauthenticated callers to 30 check-in lookups per minute.
    Adjust 'rate' in settings.py under REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']
    or override here.
    """
    rate = '30/min'


# ── Participants ──────────────────────────────────────────────────────────────
class ParticipantViewSet(viewsets.ModelViewSet):
    """
    Only authenticated admin/staff users may list or modify participants.
    Regular users can POST (self-register) but cannot list or edit others.
    """
    queryset = Participant.objects.all().order_by('full_name')
    serializer_class = ParticipantSerializer

    def get_permissions(self):
        if self.action == 'create':
            # Anyone (authenticated or not) may register themselves
            return [AllowAny()]
        # All other actions (list, retrieve, update, destroy) require admin
        return [IsAuthenticated(), IsAdminUser()]


# ── Programs ──────────────────────────────────────────────────────────────────
class ProgramViewSet(viewsets.ModelViewSet):
    """
    Read access is public (so the registration page can list retreats).
    Write access is restricted to admin/staff.
    """
    queryset = Program.objects.all().order_by('-start_date')
    serializer_class = ProgramSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminUser()]

    def perform_create(self, serializer):
        serializer.save()


# ── Sessions ──────────────────────────────────────────────────────────────────
class RetreatSessionViewSet(viewsets.ModelViewSet):
    """
    Authenticated users can view sessions; only admins can create/edit/delete.
    """
    # Class-level queryset is required by DRF's router for basename auto-detection.
    # The actual filtering happens in get_queryset() below.
    queryset = RetreatSession.objects.all()
    serializer_class = RetreatSessionSerializer

    def get_queryset(self):
        program_id = self.kwargs.get('program_pk')
        if program_id:
            return RetreatSession.objects.filter(program_id=program_id).order_by('day', 'start_time')
        # Default: today's sessions only
        return RetreatSession.objects.filter(day=date.today()).order_by('start_time')

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]


# ── Attendance ────────────────────────────────────────────────────────────────
class AttendanceViewSet(viewsets.ModelViewSet):
    """
    Only authenticated staff can record or view attendance.
    """
    queryset = Attendance.objects.all().select_related('participant', 'session')
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


# ── Public check-in endpoint ──────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
@throttle_classes([CheckInThrottle])
def check_in_by_code(request, code):
    """
    Public endpoint — no auth token required.
    Accepts a participant code or program code and returns basic info.
    Rate-limited to prevent participant enumeration.
    """
    # Sanitise: only allow alphanumeric + dash
    if not re.match(r'^[A-Za-z0-9\-]{1,30}$', code):
        return Response(
            {'error': 'Invalid code format.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 1. Try participant
    try:
        participant = Participant.objects.get(code=code)
        return Response({
            'type':      'participant',
            'full_name': participant.full_name,
            'school':    participant.school,
            'category':  participant.category,
            'sex':       participant.sex,
            'code':      participant.code,
        })
    except Participant.DoesNotExist:
        pass

    # 2. Try program
    try:
        program = Program.objects.get(code=code)
        return Response({
            'type':  'program',
            'name':  program.name,
            'theme': program.theme,
            'code':  program.code,
        })
    except Program.DoesNotExist:
        pass

    return Response({'error': 'Code not found.'}, status=status.HTTP_404_NOT_FOUND)


# ── Auth ──────────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Placeholder — swap in your token/session auth logic here.
    Using djangorestframework-simplejwt is recommended:
        pip install djangorestframework-simplejwt
    Then replace this view with TokenObtainPairView from simplejwt.
    """
    # TODO: validate credentials, return JWT or session token
    return Response({'message': 'Login successful'}, status=status.HTTP_200_OK)