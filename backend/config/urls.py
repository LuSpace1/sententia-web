from django.contrib import admin
from django.urls import path
from core.views import HealthView, RegisterView, LoginView, DemoLoginView, ChatView, TrainView, PullModelView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', HealthView.as_view(), name='health'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/demo-login/', DemoLoginView.as_view(), name='demo-login'),
    path('api/chat/', ChatView.as_view(), name='chat'),
    path('api/train/', TrainView.as_view(), name='train'),
    path('api/models/pull/', PullModelView.as_view(), name='pull-model'),
]
