from django.urls import path
from . import views

urlpatterns = [
    path('puntajes/', views.registrar_puntaje, name='registrar_puntaje'),
]