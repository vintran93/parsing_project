from django.urls import path
from .views import WordParseView, GradeTestView

urlpatterns = [
    path('parse-doc/', WordParseView.as_view(), name='parse-doc'),
    path('grade-test/', GradeTestView.as_view(), name='grade-test'),
]