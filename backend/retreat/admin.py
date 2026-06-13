from django.contrib import admin
from .models import Participant, RetreatSession, Attendance, Program
admin.site.register([Participant, RetreatSession, Attendance, Program])