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
        """A program is active from start_date until 2 days after end_date."""
        today = datetime.date.today()
        return self.start_date <= today <= (self.end_date + datetime.timedelta(days=2))

    @property
    def status(self):
        today = datetime.date.today()
        grace_end = self.end_date + datetime.timedelta(days=2)
        if today < self.start_date:    return 'upcoming'
        if today <= self.end_date:     return 'ongoing'
        if today <= grace_end:         return 'grace'   # completed but code still active
        return 'closed'

    def __str__(self):
        return self.name


class RetreatDay(models.Model):
    """One calendar day within a Program (Day 1, Day 2 …)."""
    program    = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='days')
    date       = models.DateField()
    day_number = models.PositiveSmallIntegerField()   # 1, 2, 3 …
    label      = models.CharField(max_length=100, blank=True)   # e.g. "Day 1 – Arrival"

    class Meta:
        ordering = ['day_number']
        unique_together = [['program', 'date']]

    def __str__(self):
        return f"{self.program.name} – Day {self.day_number} ({self.date})"


class DaySession(models.Model):
    """A single message / programme item within one RetreatDay."""
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
    phone_number = models.CharField(max_length=15)
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
    """Links a Participant to a specific Program (and records the day they registered)."""
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
        # Auto-resolve which RetreatDay today falls on for this program
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
    """Whether a participant was present at a specific DaySession."""
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