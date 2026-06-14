from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_nested import routers as nested_routers

from .views import (
    ParticipantViewSet, ProgramViewSet, RetreatDayViewSet,
    DaySessionViewSet, RegistrationViewSet,
    check_in_by_code, login_view, signup_view,
)

# Top-level router
router = DefaultRouter()
router.register(r'participants',  ParticipantViewSet)
router.register(r'programs',      ProgramViewSet)
router.register(r'registrations', RegistrationViewSet)

# /programs/{program_pk}/days/
programs_router = nested_routers.NestedDefaultRouter(router, r'programs', lookup='program')
programs_router.register(r'days', RetreatDayViewSet, basename='program-days')

# /programs/{program_pk}/days/{day_pk}/sessions/
days_router = nested_routers.NestedDefaultRouter(programs_router, r'days', lookup='day')
days_router.register(r'sessions', DaySessionViewSet, basename='day-sessions')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(programs_router.urls)),
    path('', include(days_router.urls)),
    path('checkin/<str:code>/',  check_in_by_code,           name='checkin'),
    path('auth/login/',          login_view,                  name='login'),
    path('auth/signup/',         signup_view,                 name='signup'),
    path('auth/refresh/',        TokenRefreshView.as_view(),  name='token_refresh'),
]