from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ParticipantViewSet, 
    ProgramViewSet, 
    RetreatSessionViewSet, 
    AttendanceViewSet,
    check_in_by_code,
    login_view
)

router = DefaultRouter()
router.register(r'participants', ParticipantViewSet)
router.register(r'programs', ProgramViewSet)
router.register(r'sessions', RetreatSessionViewSet, basename='retreatsession')
router.register(r'attendance', AttendanceViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('checkin/<str:code>/', check_in_by_code, name='checkin'),
    path('auth/login/', login_view, name='login'),
]