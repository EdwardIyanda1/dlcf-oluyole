from rest_framework import serializers
from .models import Participant, Program, RetreatSession, Attendance

class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'

class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = '__all__'
        read_only_fields = ['code']


class RetreatSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RetreatSession
        fields = '__all__'

