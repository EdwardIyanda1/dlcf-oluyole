from django.db import models
import datetime
from django.contrib.auth.models import User
from django.utils import timezone


class Program(models.Model):
    name       = models.CharField(max_length=200)
    theme      = models.CharField(max_length=200)
    code       = models.CharField(max_length=30, unique=True, blank=True)
    start_date = models.DateField()
    end_date   = models.DateField()

    def save(self, *args, **kwargs):
        if not self.code:
            year   = datetime.date.today().year
            prefix = self.name[:3].upper()
            base   = f"DLCF-{prefix}-{year}"
            code, n = base, 1
            while Program.objects.filter(code=code).exists():
                code = f"{base}-{n}"; n += 1
            self.code = code
        super().save(*args, **kwargs)

    @property
    def is_active(self):
        today = datetime.date.today()
        return self.start_date <= today <= (self.end_date + datetime.timedelta(days=2))

    @property
    def status(self):
        today = datetime.date.today()
        grace_end = self.end_date + datetime.timedelta(days=2)
        if today < self.start_date:    return 'upcoming'
        if today <= self.end_date:     return 'ongoing'
        if today <= grace_end:         return 'grace'
        return 'closed'

    def __str__(self):
        return self.name


class RetreatDay(models.Model):
    program    = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='days')
    date       = models.DateField()
    day_number = models.PositiveSmallIntegerField()
    label      = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['day_number']
        unique_together = [['program', 'date']]

    def __str__(self):
        return f"{self.program.name} – Day {self.day_number} ({self.date})"


class DaySession(models.Model):
    retreat_day = models.ForeignKey(RetreatDay, on_delete=models.CASCADE, related_name='sessions')
    title       = models.CharField(max_length=200)
    speaker     = models.CharField(max_length=200, blank=True)
    start_time  = models.TimeField()
    end_time    = models.TimeField(null=True, blank=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return f"{self.title} – {self.retreat_day}"


class Participant(models.Model):
    CATEGORY_CHOICES = [
        ('Adult', 'Adult'), ('Campus', 'Campus'),
        ('Youth', 'Youth'), ('Children', 'Children'),
    ]
    user         = models.OneToOneField(User, on_delete=models.CASCADE,
                                        related_name='participant', null=True, blank=True)
    full_name    = models.CharField(max_length=200)
    school       = models.CharField(max_length=200, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    address      = models.TextField(blank=True)
    sex          = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female')])
    category     = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    code         = models.CharField(max_length=30, unique=True, blank=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.code:
            self.code = f"DLCF-{self.full_name[:3].upper()}{self.id}"
            Participant.objects.filter(pk=self.pk).update(code=self.code)

    def __str__(self):
        return self.full_name


class Registration(models.Model):
    participant      = models.ForeignKey(Participant, on_delete=models.CASCADE,
                                         related_name='registrations')
    program          = models.ForeignKey(Program, on_delete=models.CASCADE,
                                         related_name='registrations')
    registered_on    = models.DateField(default=datetime.date.today)
    registration_day = models.ForeignKey(RetreatDay, on_delete=models.SET_NULL,
                                          null=True, blank=True,
                                          related_name='registrations')

    class Meta:
        unique_together = [['participant', 'program']]

    def save(self, *args, **kwargs):
        if not self.registration_day:
            try:
                self.registration_day = RetreatDay.objects.get(
                    program=self.program, date=self.registered_on
                )
            except RetreatDay.DoesNotExist:
                pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.participant} @ {self.program}"


class Attendance(models.Model):
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE,
                                    related_name='attendances')
    session     = models.ForeignKey(DaySession, on_delete=models.CASCADE,
                                    related_name='attendances')
    present     = models.BooleanField(default=True)
    timestamp   = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [['participant', 'session']]

    def __str__(self):
        status = "✓" if self.present else "✗"
        return f"{status} {self.participant} – {self.session.title}"


class BulkMessage(models.Model):
    """Audit log of every bulk SMS/email blast sent from the admin panel."""
    CHANNEL_CHOICES = [('sms', 'SMS'), ('email', 'Email'), ('both', 'Both')]

    sent_by         = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    channel         = models.CharField(max_length=10, choices=CHANNEL_CHOICES)
    subject         = models.CharField(max_length=200, blank=True)
    body            = models.TextField()
    recipient_count = models.PositiveIntegerField(default=0)
    filter_desc     = models.CharField(max_length=255, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_channel_display()} to {self.recipient_count} on {self.created_at:%Y-%m-%d %H:%M}"