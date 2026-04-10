from django.urls import path
from . import views

app_name = 'contact'

urlpatterns = [
    path('contact/', views.send_contact_email, name='send_contact_email'),
    path('messages/', views.get_contact_messages, name='get_contact_messages'),
]
