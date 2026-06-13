from django.contrib import admin
from .models import Participant, RetreatSession, Attendance, Program
admin.site.register([Participant, RetreatSession, Attendance, Program])

@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):

    exclude = ('code',)