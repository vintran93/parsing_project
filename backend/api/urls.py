from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import WordParseView, GradeTestView, WordTestViewSet, csrf  # import the function-based view

router = DefaultRouter()
router.register(r"tests", WordTestViewSet, basename="wordtest")

urlpatterns = [
    path('parse-doc/', WordParseView.as_view(), name='parse-doc'),
    path('grade-test/', GradeTestView.as_view(), name='grade-test'),

    # CSRF endpoint for frontend to get CSRF cookie
    path('csrf/', csrf, name='csrf'),
    

    # Router URLs for WordTestViewSet
    path('', include(router.urls)),
]