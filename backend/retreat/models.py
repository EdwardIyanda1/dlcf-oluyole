from django.db import models
import datetime
class Participant(models.Model):
    CATEGORY_CHOICES = [('Adult', 'Adult'), ('Campus', 'Campus'), ('Youth', 'Youth'), ('Children', 'Children')]
    full_name = models.CharField(max_length=200)
    school = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=15)
    address = models.TextField()
    sex = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female')])
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    code = models.CharField(max_length=20, unique=True, blank=True) # For QR check-in

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = f"DLCF-{self.full_name[:3].upper()}{self.id or '000'}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_name
    


class Program(models.Model):
    name = models.CharField(max_length=200)
    theme = models.CharField(max_length=200)
    # Remove 'default' and allow blank because we generate it in save()
    code = models.CharField(max_length=20, unique=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()

    def save(self, *args, **kwargs):
        if not self.code:
            # Generate a code like: DLCF-NAME-2026
            year = datetime.date.today().year
            # Extract first 3 chars of name, uppercase, and append year
            prefix = self.name[:3].upper()
            self.code = f"DLCF-{prefix}-{year}"
            
            # Ensure uniqueness if multiple programs have same name/year
            count = 1
            original_code = self.code
            while Program.objects.filter(code=self.code).exists():
                self.code = f"{original_code}-{count}"
                count += 1
                
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
    
class RetreatSession(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='sessions')
    title = models.CharField(max_length=200) # e.g., "Morning Message"
    start_time = models.TimeField()
    end_time = models.TimeField()
    day = models.DateField() # Specific day of the retreat

    def __str__(self):
        return f"{self.title} ({self.start_time} - {self.end_time})"

class Attendance(models.Model):
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE)
    session = models.ForeignKey(RetreatSession, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)