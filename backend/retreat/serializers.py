from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Participant, Program, RetreatDay, DaySession, Registration, Attendance


# ── Core serializers ──────────────────────────────────────────────────────────

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'


class DaySessionSerializer(serializers.ModelSerializer):
    attendance_count = serializers.SerializerMethodField()

    class Meta:
        model  = DaySession
        fields = ['id', 'retreat_day', 'title', 'speaker', 'start_time', 'end_time', 'attendance_count']

    def get_attendance_count(self, obj):
        return obj.attendances.filter(present=True).count()


class RetreatDaySerializer(serializers.ModelSerializer):
    sessions = DaySessionSerializer(many=True, read_only=True)

    class Meta:
        model  = RetreatDay
        fields = ['id', 'program', 'date', 'day_number', 'label', 'sessions']


class ProgramSerializer(serializers.ModelSerializer):
    days   = RetreatDaySerializer(many=True, read_only=True)
    status = serializers.ReadOnlyField()

    class Meta:
        model        = Program
        fields       = ['id', 'name', 'theme', 'code', 'start_date', 'end_date', 'status', 'days']
        read_only_fields = ['code', 'status']


class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Participant
        fields = ['id', 'full_name', 'school', 'phone_number', 'address', 'sex', 'category', 'code']


class RegistrationSerializer(serializers.ModelSerializer):
    participant_detail   = ParticipantSerializer(source='participant', read_only=True)
    program_name         = serializers.CharField(source='program.name', read_only=True)
    registration_day_label = serializers.SerializerMethodField()

    class Meta:
        model  = Registration
        fields = [
            'id', 'participant', 'program', 'registered_on',
            'registration_day', 'participant_detail',
            'program_name', 'registration_day_label',
        ]

    def get_registration_day_label(self, obj):
        if obj.registration_day:
            d = obj.registration_day
            return f"Day {d.day_number} – {d.date}"
        return None


# ── Session attendance roster ─────────────────────────────────────────────────

class AttendanceRosterSerializer(serializers.ModelSerializer):
    """Participant + their present/absent status for one session."""
    full_name    = serializers.CharField(source='participant.full_name')
    school       = serializers.CharField(source='participant.school')
    sex          = serializers.CharField(source='participant.sex')
    category     = serializers.CharField(source='participant.category')
    participant_id = serializers.IntegerField(source='participant.id')

    class Meta:
        model  = Attendance
        fields = ['id', 'participant_id', 'full_name', 'school', 'sex', 'category', 'present']


# ── Reports ───────────────────────────────────────────────────────────────────

class DayReportSerializer(serializers.ModelSerializer):
    sessions      = serializers.SerializerMethodField()
    total_present = serializers.SerializerMethodField()
    by_category   = serializers.SerializerMethodField()
    by_sex        = serializers.SerializerMethodField()
    registrations_today = serializers.SerializerMethodField()

    class Meta:
        model  = RetreatDay
        fields = ['id', 'date', 'day_number', 'label',
                  'registrations_today', 'total_present', 'by_category', 'by_sex', 'sessions']

    def get_sessions(self, obj):
        return [
            {
                'id':       s.id,
                'title':    s.title,
                'speaker':  s.speaker,
                'start_time': str(s.start_time),
                'present':  s.attendances.filter(present=True).count(),
                'absent':   s.attendances.filter(present=False).count(),
                'total':    s.attendances.count(),
            }
            for s in obj.sessions.all()
        ]

    def get_total_present(self, obj):
        return Attendance.objects.filter(session__retreat_day=obj, present=True).values('participant').distinct().count()

    def get_by_category(self, obj):
        result = {}
        for cat in ['Adult', 'Campus', 'Youth', 'Children']:
            result[cat] = {
                'M': Attendance.objects.filter(
                    session__retreat_day=obj, present=True, participant__category=cat, participant__sex='M'
                ).values('participant').distinct().count(),
                'F': Attendance.objects.filter(
                    session__retreat_day=obj, present=True, participant__category=cat, participant__sex='F'
                ).values('participant').distinct().count(),
            }
        return result

    def get_by_sex(self, obj):
        return {
            'M': Attendance.objects.filter(session__retreat_day=obj, present=True, participant__sex='M').values('participant').distinct().count(),
            'F': Attendance.objects.filter(session__retreat_day=obj, present=True, participant__sex='F').values('participant').distinct().count(),
        }

    def get_registrations_today(self, obj):
        return Registration.objects.filter(registration_day=obj).count()


# ── Auth serializers ──────────────────────────────────────────────────────────

class SignupSerializer(serializers.Serializer):
    email        = serializers.EmailField()
    password     = serializers.CharField(write_only=True, min_length=8)
    full_name    = serializers.CharField(max_length=200)
    school       = serializers.CharField(max_length=200, required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=15)
    address      = serializers.CharField(required=False, allow_blank=True)
    sex          = serializers.ChoiceField(choices=[('M', 'Male'), ('F', 'Female')])
    category     = serializers.ChoiceField(choices=['Adult', 'Campus', 'Youth', 'Children'])

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def create(self, validated_data):
        from django.db import transaction
        from rest_framework_simplejwt.tokens import RefreshToken
        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data['email'],
                email=validated_data['email'],
                password=validated_data['password'],
            )
            participant = Participant.objects.create(
                user=user,
                full_name=validated_data['full_name'],
                school=validated_data.get('school', ''),
                phone_number=validated_data['phone_number'],
                address=validated_data.get('address', ''),
                sex=validated_data['sex'],
                category=validated_data['category'],
            )
        refresh = RefreshToken.for_user(user)
        return {
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'email':     user.email,
                'full_name': participant.full_name,
                'code':      participant.code,
                'is_admin':  False,
            },
        }