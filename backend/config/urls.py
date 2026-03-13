from django.contrib import admin
from django.urls import path
from core.views import RegisterView, LoginView, ChatView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/chat/', ChatView.as_view(), name='chat'),
]
