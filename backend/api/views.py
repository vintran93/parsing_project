from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator

from .models import WordTest
from .serializers import WordTestSerializer
from .parse_utils import parse_docx_to_json, parse_and_attach  # import both

# ViewSet for WordTest with auto parse on upload
class WordTestViewSet(viewsets.ModelViewSet):
    queryset = WordTest.objects.all()
    serializer_class = WordTestSerializer
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        instance = serializer.save()
        try:
            # Parse the uploaded doc and attach parsed JSON
            parse_and_attach(instance, instance.doc_file)
            instance.save()
        except Exception as e:
            instance.delete()
            raise e

# APIView to parse a docx file directly (separate endpoint)
class WordParseView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):
        file_obj = request.FILES.get('file')  # use 'doc_file' key here
        if not file_obj:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            file_bytes = file_obj.read()
            parsed = parse_docx_to_json(file_bytes)
            return Response(parsed)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# APIView to grade a test submission (stub example)
class GradeTestView(APIView):
    def post(self, request, format=None):
        data = request.data
        return Response({"message": "Grading not implemented yet", "data": data})

# CSRF view (function-based)
@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({"detail": "CSRF cookie set"})

# Optional: CSRF class-based view alternative
@method_decorator(ensure_csrf_cookie, name='dispatch')
class CsrfView(APIView):
    def get(self, request, format=None):
        return JsonResponse({"detail": "CSRF cookie set"})