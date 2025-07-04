from django.urls import path
from .views import WordParseView

urlpatterns = [
    path('parse-doc/', WordParseView.as_view(), name='parse-doc'),  # match React URL
]