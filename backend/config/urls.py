from django.contrib import admin
from django.urls import path
<<<<<<< HEAD
from core.views import RegisterView, LoginView, ChatView, TrainView
=======
from core.views import RegisterView, LoginView, DemoLoginView, ChatView, TrainView, PullModelView
>>>>>>> fcf4c0ab9100e39151f1d226132f845352baacf8

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/demo-login/', DemoLoginView.as_view(), name='demo-login'),
    path('api/chat/', ChatView.as_view(), name='chat'),
    path('api/train/', TrainView.as_view(), name='train'),
<<<<<<< HEAD
=======
    path('api/models/pull/', PullModelView.as_view(), name='pull-model'),
>>>>>>> fcf4c0ab9100e39151f1d226132f845352baacf8
]
