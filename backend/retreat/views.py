from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Participant, Program, Attendance 
from .serializers import AttendanceSerializer, RetreatSession
from datetime import date
from .serializers import ParticipantSerializer, ProgramSerializer, RetreatSessionSerializer, AttendanceSerializer

class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all()
class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer

class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer

class RetreatSessionViewSet(viewsets.ModelViewSet):
    queryset = RetreatSession.objects.all()
    serializer_class = RetreatSessionSerializer    
    queryset = RetreatSession.objects.filter(day=date.today())
    serializer_class = RetreatSessionSerializer
class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

@api_view(['GET'])
def check_in_by_code(request, code):
    try:
        participant = Participant.objects.get(code=code)
        return Response({
            "full_name": participant.full_name,
            "school": participant.school,
            "category": participant.category,
            "sex": participant.sex,
            "code": participant.code
        })
    except Participant.DoesNotExist:
        return Response({"error": "Participant not found"}, status=status.HTTP_404_NOT_FOUND)
    
@api_view(['POST'])
def login_view(request):
    # Implement your authentication logic here
    # e.g., validating credentials against your user model
    return Response({"message": "Login successful"}, status=status.HTTP_200_OK)