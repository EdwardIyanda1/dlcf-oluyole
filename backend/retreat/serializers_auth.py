from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

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