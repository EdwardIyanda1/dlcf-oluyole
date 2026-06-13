from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from datetime import date

# Import models and serializers
from .models import Participant, Program, RetreatSession, Attendance
from .serializers import (
    ParticipantSerializer, 
    ProgramSerializer, 
    RetreatSessionSerializer, 
    AttendanceSerializer
)

class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer

class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer

    def perform_create(self, serializer):
        # This ensures the model's save() method is triggered for code generation
        serializer.save()

class RetreatSessionViewSet(viewsets.ModelViewSet):
    # Filter to only show today's sessions
    queryset = RetreatSession.objects.filter(day=date.today())
    serializer_class = RetreatSessionSerializer

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

# views_4.py (Updated)
@api_view(['GET'])
def check_in_by_code(request, code):
    # Try searching as a Participant first
    try:
        participant = Participant.objects.get(code=code)
        return Response({
            "type": "participant",
            "full_name": participant.full_name,
            "school": participant.school,
            "category": participant.category,
            "code": participant.code
        })
    except Participant.DoesNotExist:
        # Try searching as a Program
        try:
            program = Program.objects.get(code=code)
            return Response({
                "type": "program",
                "name": program.name,
                "theme": program.theme,
                "code": program.code
            })
        except Program.DoesNotExist:
            return Response({"error": "Code not found"}, status=status.HTTP_404_NOT_FOUND)
        
@api_view(['POST'])
def login_view(request):
    return Response({"message": "Login successful"}, status=status.HTTP_200_OK)