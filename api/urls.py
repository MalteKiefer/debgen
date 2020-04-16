from django.urls import path
from . import views

urlpatterns = [
    path('', views.index),
    path('repos/', views.repos),
    path('categories/', views.categories),
    path('releases/', views.categories),
    path('random/', views.random),
]
