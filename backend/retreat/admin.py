from django.contrib import admin
from .models import (
    Participant, Program, RetreatDay, DaySession, Registration, Attendance,
    UserProfile, AttendanceHeadcount,
)

@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'start_date', 'end_date', 'status']
    readonly_fields = ['code']

@admin.register(RetreatDay)
class RetreatDayAdmin(admin.ModelAdmin):
    list_display = ['program', 'day_number', 'date', 'label']
    list_filter  = ['program']

@admin.register(DaySession)
class DaySessionAdmin(admin.ModelAdmin):
    list_display = ['title', 'retreat_day', 'speaker', 'start_time']
    list_filter  = ['retreat_day__program']

@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'category', 'sex', 'school', 'code']
    readonly_fields = ['code']

@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ['participant', 'program', 'registered_on', 'registration_day']

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['participant', 'session', 'present', 'timestamp']
    list_filter  = ['present', 'session__retreat_day__program']

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role']
    list_filter  = ['role']
    search_fields = ['user__username', 'user__email']

@admin.register(AttendanceHeadcount)
class AttendanceHeadcountAdmin(admin.ModelAdmin):
    list_display = ['session', 'category', 'sex', 'count', 'recorded_by', 'updated_at']
    list_filter  = ['category', 'sex', 'session__retreat_day__program']