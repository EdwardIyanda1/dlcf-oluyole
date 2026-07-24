from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from .models import Participant

User = get_user_model()


class EmailLoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email    = attrs['email'].strip().lower()
        password = attrs['password']

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'No account found with this email.'})

        if not user.check_password(password):
            raise serializers.ValidationError({'password': 'Incorrect password.'})

        if not user.is_active:
            raise serializers.ValidationError({'email': 'This account has been disabled.'})

        # Generate tokens directly — no simplejwt parent call needed
        refresh     = RefreshToken.for_user(user)
        participant = getattr(user, 'participant', None)

        return {
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'email':     user.email,
                'full_name': participant.full_name if participant else user.get_full_name(),
                'code':      participant.code      if participant else None,
                'is_admin':  user.is_staff or user.is_superuser,
            },
        }


class GoogleLoginSerializer(serializers.Serializer):
    """
    Verifies the ID token minted by Google Identity Services on the frontend
    (the `credential` field from the GSI callback — a signed JWT, NOT an
    access token, so nothing extra needs to be fetched from Google's API).

    Requires:
        GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]   in settings.py
        pip install google-auth
    """
    credential = serializers.CharField()

    def validate(self, attrs):
        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
        if not client_id:
            raise serializers.ValidationError({'credential': 'Google sign-in is not configured on the server.'})

        try:
            idinfo = google_id_token.verify_oauth2_token(
                attrs['credential'], google_requests.Request(), client_id
            )
        except ValueError:
            raise serializers.ValidationError({'credential': 'Invalid or expired Google token.'})

        email = idinfo.get('email')
        if not email or not idinfo.get('email_verified', True):
            raise serializers.ValidationError({'credential': 'Google account has no verified email.'})

        full_name = idinfo.get('name', '') or email.split('@')[0]

        user = User.objects.filter(email__iexact=email).first()
        is_new_user = False
        if not user:
            user = User.objects.create_user(username=email, email=email)
            user.set_unusable_password()  # this account only ever signs in via Google
            user.save()
            is_new_user = True

        participant = getattr(user, 'participant', None)
        profile_incomplete = False
        if not participant:
            # First-time Google sign-in with no existing registration: create a
            # minimal shell so they show up in the registry immediately, but
            # flag that phone/category/sex still need to be filled in.
            participant = Participant.objects.create(
                user=user, full_name=full_name,
                phone_number='', sex='M', category='Adult',
            )
            profile_incomplete = True

        refresh = RefreshToken.for_user(user)
        return {
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'is_new_user': is_new_user,
            'profile_incomplete': profile_incomplete,
            'user': {
                'email':     user.email,
                'full_name': participant.full_name,
                'code':      participant.code,
                'is_admin':  user.is_staff or user.is_superuser,
            },
        }