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


class UserProfile(models.Model):
    """
    The permission level for a logged-in user. Four tiers:
      - member       Ordinary church member / registered participant. Can only
                      see their own profile & attendance record (ProfilePage).
      - registration Registration Unit: registers participants and staffs the
                      check-in desk.
      - usher        Takes the whole-congregation headcount per session.
      - admin        Full access (also granted automatically to any Django
                      is_staff/is_superuser account, so existing admins keep
                      working without a data migration).
    """
    ROLE_CHOICES = [
        ('member',       'Church Member'),
        ('registration', 'Registration Unit'),
        ('usher',        'Usher'),
        ('admin',        'Admin'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


class AttendanceHeadcount(models.Model):
    """
    A tally of everyone physically present for a session, taken by an usher
    at the door -- by age category and gender, not by looking up individual
    registered participants. This is deliberately separate from Attendance
    (which tracks registered participants checking in with their own code):
    the headcount is meant to capture the whole room, visitors included.
    """
    session     = models.ForeignKey(DaySession, on_delete=models.CASCADE, related_name='headcounts')
    category    = models.CharField(max_length=20, choices=Participant.CATEGORY_CHOICES)
    sex         = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female')])
    count       = models.PositiveIntegerField(default=0)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='headcounts_recorded')
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [['session', 'category', 'sex']]
        ordering = ['category', 'sex']

    @property
    def label(self):
        return f"{self.category} {self.get_sex_display()}"

    def __str__(self):
        return f"{self.session} - {self.label}: {self.count}"


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


# ── Auto-provision a profile (default role: Church Member) for every new user ──
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)