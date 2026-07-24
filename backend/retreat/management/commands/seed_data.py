"""
Management command: seed_data

Fills the database with a LARGE, realistic dataset for load-testing and
demoing the Deeper Life Campus Fellowship (Oluyole Region) retreat system.

USAGE
-----
1. Copy this file to:  backend/retreat/management/commands/seed_data.py
   (create the two empty folders + __init__.py files if they don't exist —
    see notes at the bottom of this docstring)

2. Run:
       python manage.py seed_data

   Options:
       python manage.py seed_data --flush                 # wipe existing seed data first
       python manage.py seed_data --participants 5000      # default 5000
       python manage.py seed_data --programs 6              # default 6
       python manage.py seed_data --batch-size 2000          # bulk_create chunk size
       python manage.py seed_data --seed 42                  # reproducible run

   Recommended for a fresh, clean large dataset:
       python manage.py seed_data --flush --participants 5000 --programs 6

WHAT IT CREATES
----------------
- N Programs (default 6), spread across past / ongoing / near-future / far-future,
  each spanning 4-6 RetreatDays.
- 6-7 DaySessions per RetreatDay, drawn from a pool of realistic retreat
  programme items (Morning Devotion, Bible Study, Workers' Meeting, Prayer
  Session, Evening Service, Testimony Time, Choir Practice, Counseling
  Session, Youth Hangout, Closing Service, Baptism Service, Deliverance
  Service), each with a randomly assigned speaker.
- P Participants (default 5000+) with real Users (login: <first>.<last>N@dlcf-test.local,
  password "testpass123" for all), spread across all 4 categories.
- Registrations: each participant registers for 1-3 of the programs.
- Attendance: for every registration, attendance rows are generated for every
  session on every day of that program that has ALREADY HAPPENED relative to
  today:
    * past days     -> ~85% present
    * today's day   -> ~55% present (retreat in progress)
    * future days   -> skipped entirely (haven't happened yet)

PERFORMANCE
-----------
This is designed to comfortably create 5,000+ participants and tens/hundreds
of thousands of attendance rows. All the high-volume tables (User,
Participant, Registration, Attendance) are written with chunked bulk_create()
calls instead of per-row update_or_create(), so it stays fast even at scale.
Progress is printed as each chunk completes.

FOLDER STRUCTURE NEEDED (if these don't already exist)
-------------------------------------------------------
backend/retreat/management/__init__.py            (empty file)
backend/retreat/management/commands/__init__.py    (empty file)
backend/retreat/management/commands/seed_data.py   (this file)
"""

import datetime
import random

from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from retreat.models import (
    Participant, Program, RetreatDay, DaySession, Registration, Attendance,
)


# ── Name / content pools ───────────────────────────────────────────────────

FIRST_NAMES = [
    "Ayodele", "Chinwe", "Emeka", "Funmilayo", "Ifeoma", "Kolawole",
    "Nkechi", "Oluwaseun", "Tolu", "Yemi", "Bisi", "Chidera",
    "Abiodun", "Chiamaka", "Damilare", "Ebere", "Folasade", "Gbenga",
    "Halima", "Ikechukwu", "Jumoke", "Kelechi", "Lekan", "Modupe",
    "Ngozi", "Oluwatobi", "Precious", "Rasheed", "Sade", "Tunde",
    "Uzoamaka", "Wale", "Yetunde", "Zainab", "Adaeze", "Babatunde",
    "Chidinma", "Damola", "Ejiro", "Feyisayo", "Gozie", "Habeeb",
    "Ibironke", "Jide", "Kemi", "Lawrence", "Mercy", "Nneka",
    "Oyindamola", "Peace", "Ruth", "Segun", "Titilayo", "Uche",
    "Victor", "Wumi", "Yusuf", "Zubairu", "Abosede", "Blessing",
]
LAST_NAMES = [
    "Adeyemi", "Okafor", "Balogun", "Eze", "Ogunleye", "Nwachukwu",
    "Fashola", "Uche", "Adewale", "Chukwu", "Okonkwo", "Ajayi",
    "Adebayo", "Nwosu", "Bello", "Okoro", "Ogundipe", "Anyanwu",
    "Afolabi", "Onyekachi", "Oyelaran", "Nwankwo", "Salami", "Emeka",
    "Adegoke", "Iwuchukwu", "Fabiyi", "Chinedu", "Akintola", "Umeh",
    "Ogunbiyi", "Nnamdi", "Sowande", "Ekwueme", "Adisa", "Obi",
    "Fagbenle", "Chukwuemeka", "Ayodeji", "Okeke",
]
TITLES = ["Pastor", "Bro.", "Sister", "Deaconess", "Elder", "Minister"]

SCHOOLS = [
    "Lead City University", "University of Ibadan", "UoPeople",
    "Polytechnic Ibadan", "Bowen University", "Obafemi Awolowo University",
    "Ladoke Akintola University of Technology", "Ajayi Crowther University",
]
CATEGORIES = ["Adult", "Campus", "Youth", "Children"]
CATEGORY_WEIGHTS = [0.40, 0.25, 0.25, 0.10]

SESSION_TEMPLATE = [
    "Morning Devotion", "Bible Study", "Workers' Meeting", "Prayer Session",
    "Evening Service", "Testimony Time", "Choir Practice", "Counseling Session",
    "Youth Hangout", "Closing Service", "Baptism Service", "Deliverance Service",
]

# name, theme, day-offset-from-today for start_date, number of days
PROGRAM_SPECS = [
    ("Oluyole Zone Workers' Retreat 2025",              "Sharpened for Service",       -400, None),
    ("Ibadan Region Youth Camp Meeting 2025",            "Arise and Shine",             -120, None),
    ("Deeper Life Campus Fellowship Leadership Retreat", "Raising Kingdom Leaders",       -2, None),
    ("DLCF Oluyole Region Annual Retreat 2026",          "Gather. Worship. Be Renewed.",  20, None),
    ("Children's Camp Meeting 2026",                     "Little Lights, Big Faith",      60, None),
    ("Deeper Life Global Workers' Conference 2026",      "Equipped and Sent",            150, None),
]

ATTENDANCE_RATES = {
    "past": 0.85,
    "today": 0.55,
}


class Command(BaseCommand):
    help = "Seed the database with a large DLCF retreat dataset for testing/demo purposes."

    def add_arguments(self, parser):
        parser.add_argument("--flush", action="store_true",
                             help="Delete existing seed-generated data first.")
        parser.add_argument("--participants", type=int, default=5000,
                             help="Number of participants to create (default: 5000).")
        parser.add_argument("--programs", type=int, default=6,
                             help="Number of programs to create, up to len(PROGRAM_SPECS) (default: 6).")
        parser.add_argument("--batch-size", type=int, default=2000,
                             help="Chunk size for bulk_create calls (default: 2000).")
        parser.add_argument("--seed", type=int, default=None,
                             help="Random seed for reproducible output (default: not fixed).")

    def handle(self, *args, **options):
        if options["seed"] is not None:
            random.seed(options["seed"])

        n_participants = options["participants"]
        n_programs = min(options["programs"], len(PROGRAM_SPECS))
        batch_size = options["batch_size"]

        if options["flush"]:
            self._flush()

        with transaction.atomic():
            programs = self._create_programs(n_programs)
            days_by_program, sessions_by_day = self._create_days_and_sessions(programs)

        self.stdout.write(self.style.SUCCESS(
            f"✔ Created {len(programs)} programs, "
            f"{sum(len(d) for d in days_by_program.values())} days, "
            f"{sum(len(s) for s in sessions_by_day.values())} sessions."
        ))

        participants = self._create_participants(n_participants, batch_size)
        self.stdout.write(self.style.SUCCESS(f"✔ Created {len(participants)} participants."))

        registrations = self._create_registrations(participants, programs, days_by_program, batch_size)
        self.stdout.write(self.style.SUCCESS(f"✔ Created {len(registrations)} registrations."))

        attendance_count = self._create_attendance(
            participants, registrations, days_by_program, sessions_by_day, batch_size
        )
        self.stdout.write(self.style.SUCCESS(f"✔ Created {attendance_count} attendance records."))

        self.stdout.write(self.style.SUCCESS("\n✔ Large dummy dataset created successfully."))
        self.stdout.write(f"  Programs: {', '.join(p.name for p in programs)}")
        self.stdout.write(f"  Participants: {len(participants)} (password for all: testpass123)")
        self.stdout.write(f"  Registrations: {len(registrations)}")
        self.stdout.write(f"  Attendance records: {attendance_count}")
        if participants:
            self.stdout.write("\n  Sample login:")
            self.stdout.write(f"    email: {participants[0]['email']}")
            self.stdout.write("    password: testpass123")

    # ── Flush ────────────────────────────────────────────────────────────

    def _flush(self):
        self.stdout.write("Flushing existing retreat data...")
        Attendance.objects.all().delete()
        Registration.objects.all().delete()
        DaySession.objects.all().delete()
        RetreatDay.objects.all().delete()
        Program.objects.all().delete()
        # Only remove participants/users created by this script, identifiable
        # by their @dlcf-test.local email domain, to avoid nuking real accounts.
        Participant.objects.filter(user__email__endswith="@dlcf-test.local").delete()
        User.objects.filter(email__endswith="@dlcf-test.local").delete()

    # ── Programs / Days / Sessions ──────────────────────────────────────

    def _create_programs(self, n_programs):
        today = datetime.date.today()
        programs = []
        for name, theme, offset, _ in PROGRAM_SPECS[:n_programs]:
            n_days = random.randint(4, 6)
            start_date = today + datetime.timedelta(days=offset)
            end_date = start_date + datetime.timedelta(days=n_days - 1)
            program, _ = Program.objects.update_or_create(
                name=name,
                defaults={"theme": theme, "start_date": start_date, "end_date": end_date},
            )
            programs.append(program)
        return programs

    def _create_days_and_sessions(self, programs):
        days_by_program = {}
        sessions_by_day = {}
        for program in programs:
            n_days = (program.end_date - program.start_date).days + 1
            days = []
            for i in range(n_days):
                date = program.start_date + datetime.timedelta(days=i)
                day, _ = RetreatDay.objects.update_or_create(
                    program=program, date=date,
                    defaults={"day_number": i + 1, "label": f"Day {i + 1}"},
                )
                days.append(day)

                n_sessions = random.randint(6, 7)
                titles = random.sample(SESSION_TEMPLATE, k=min(n_sessions, len(SESSION_TEMPLATE)))
                # if we need more sessions than the template has, wrap around
                while len(titles) < n_sessions:
                    titles.append(random.choice(SESSION_TEMPLATE))

                sessions = []
                hour = 6
                for title in titles:
                    start = datetime.time((hour % 22) + 1, random.choice([0, 15, 30, 45]))
                    end_hour = min(start.hour + 1, 23)
                    end = datetime.time(end_hour, start.minute)
                    speaker = f"{random.choice(TITLES)} {random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
                    session, _ = DaySession.objects.update_or_create(
                        retreat_day=day, title=title, start_time=start,
                        defaults={"speaker": speaker, "end_time": end},
                    )
                    sessions.append(session)
                    hour += 2

                sessions_by_day[day.id] = sessions
            days_by_program[program.id] = days
        return days_by_program, sessions_by_day

    # ── Participants (bulk, chunked) ────────────────────────────────────

    def _create_participants(self, n_participants, batch_size):
        password_hash = make_password("testpass123")
        participants = []
        user_batch, meta_batch = [], []

        for i in range(1, n_participants + 1):
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            full_name = f"{first} {last}"
            email = f"{first.lower()}.{last.lower()}{i}@dlcf-test.local"
            category = random.choices(CATEGORIES, weights=CATEGORY_WEIGHTS, k=1)[0]
            sex = random.choice(["M", "F"])
            code = f"DLCF-{first[:3].upper()}{i:05d}"

            user_batch.append(User(
                username=email, email=email, first_name=first, last_name=last,
                password=password_hash,
            ))
            meta_batch.append({
                "email": email, "full_name": full_name, "category": category,
                "sex": sex, "code": code,
                "school": random.choice(SCHOOLS) if category in ("Campus", "Youth") else "",
                "phone_number": f"080{random.randint(10000000, 99999999)}",
                "address": f"{random.randint(1, 99)} Retreat Camp Road, Ibadan",
            })

            if len(user_batch) >= batch_size or i == n_participants:
                User.objects.bulk_create(user_batch, batch_size=batch_size, ignore_conflicts=True)
                emails = [m["email"] for m in meta_batch]
                user_ids = dict(User.objects.filter(email__in=emails).values_list("email", "id"))

                participant_batch = [
                    Participant(
                        user_id=user_ids[m["email"]], full_name=m["full_name"],
                        school=m["school"], phone_number=m["phone_number"],
                        address=m["address"], sex=m["sex"], category=m["category"],
                        code=m["code"],
                    )
                    for m in meta_batch if m["email"] in user_ids
                ]
                Participant.objects.bulk_create(participant_batch, batch_size=batch_size, ignore_conflicts=True)

                codes = [m["code"] for m in meta_batch]
                participant_ids = dict(Participant.objects.filter(code__in=codes).values_list("code", "id"))
                for m in meta_batch:
                    if m["code"] in participant_ids:
                        participants.append({
                            "id": participant_ids[m["code"]], "email": m["email"],
                            "category": m["category"],
                        })

                self.stdout.write(f"  ...{len(participants)}/{n_participants} participants created")
                user_batch, meta_batch = [], []

        return participants

    # ── Registrations (bulk, chunked) ───────────────────────────────────

    def _create_registrations(self, participants, programs, days_by_program, batch_size):
        registrations = []
        reg_batch = []

        for p in participants:
            n_regs = random.randint(1, min(3, len(programs)))
            chosen_programs = random.sample(programs, k=n_regs)
            for program in chosen_programs:
                days = days_by_program[program.id]
                # register on a random day within the program's span
                reg_day = random.choice(days)
                reg_batch.append(Registration(
                    participant_id=p["id"], program_id=program.id,
                    registered_on=reg_day.date, registration_day_id=reg_day.id,
                ))

            if len(reg_batch) >= batch_size:
                created = Registration.objects.bulk_create(reg_batch, batch_size=batch_size, ignore_conflicts=True)
                registrations.extend(reg_batch)
                self.stdout.write(f"  ...{len(registrations)} registrations created")
                reg_batch = []

        if reg_batch:
            Registration.objects.bulk_create(reg_batch, batch_size=batch_size, ignore_conflicts=True)
            registrations.extend(reg_batch)

        return registrations

    # ── Attendance (bulk, chunked) ──────────────────────────────────────

    def _classify_day(self, day, today):
        if day.date < today:
            return "past"
        if day.date == today:
            return "today"
        return "future"

    def _create_attendance(self, participants, registrations, days_by_program, sessions_by_day, batch_size):
        today = datetime.date.today()
        category_by_id = {p["id"]: p["category"] for p in participants}

        # Precompute which sessions "count" (already happened) per program,
        # along with the attendance rate to use for each.
        eligible_sessions_by_program = {}
        for program_id, days in days_by_program.items():
            entries = []
            for day in days:
                bucket = self._classify_day(day, today)
                if bucket == "future":
                    continue
                rate = ATTENDANCE_RATES[bucket]
                for session in sessions_by_day[day.id]:
                    entries.append((session.id, rate))
            eligible_sessions_by_program[program_id] = entries

        att_batch = []
        total_created = 0
        seen_pairs = set()

        for reg in registrations:
            entries = eligible_sessions_by_program.get(reg.program_id, [])
            for session_id, rate in entries:
                key = (reg.participant_id, session_id)
                if key in seen_pairs:
                    continue
                seen_pairs.add(key)
                present = random.random() < rate
                att_batch.append(Attendance(
                    participant_id=reg.participant_id, session_id=session_id, present=present,
                ))

            if len(att_batch) >= batch_size:
                Attendance.objects.bulk_create(att_batch, batch_size=batch_size, ignore_conflicts=True)
                total_created += len(att_batch)
                self.stdout.write(f"  ...{total_created} attendance records created")
                att_batch = []

        if att_batch:
            Attendance.objects.bulk_create(att_batch, batch_size=batch_size, ignore_conflicts=True)
            total_created += len(att_batch)

        return total_created