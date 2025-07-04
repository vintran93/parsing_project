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
        title = serializer.validated_data.get("title")
        # Provide fallback title if empty or None
        if not title:
            title = "Untitled Test"
        instance = serializer.save(title=title)
        try:
            parse_and_attach(instance, instance.doc_file)
            instance.save()
        except Exception as e:
            instance.delete()
            raise e


# APIView to parse a docx file directly (separate endpoint)
class WordParseView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            file_bytes = file_obj.read()
            parsed = parse_docx_to_json(file_bytes)
            return Response(parsed)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# APIView to grade a test submission
class GradeTestView(APIView):
    def post(self, request, format=None):
        data = request.data
        test_id = data.get("test_id")
        answers = data.get("answers")  # expects dict like {"0": "a", "1": "b"}

        if not test_id or not answers:
            return Response(
                {"error": "test_id and answers are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            word_test = WordTest.objects.get(id=test_id)
        except WordTest.DoesNotExist:
            return Response({"error": "Test not found"}, status=status.HTTP_404_NOT_FOUND)

        parsed = word_test.parsed_json
        questions = parsed.get("questions", [])

        total = len(questions)
        correct_count = 0
        results = []

        for idx, question in enumerate(questions):
            correct_letter = question.get("correct_answer", "a").lower()
            # Answers keys may be strings, so convert idx to str to check
            user_answer = answers.get(str(idx), "").lower()

            is_correct = (user_answer == correct_letter)
            if is_correct:
                correct_count += 1

            results.append({
                "question_number": idx + 1,
                "is_correct": is_correct,
                "correct_answer": correct_letter,
                "user_answer": user_answer,
            })

        score_percent = round((correct_count / total) * 100) if total > 0 else 0

        return Response({
            "score": correct_count,
            "total": total,
            "percent": score_percent,
            "results": results,
        })


# CSRF view (function-based)
@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({"detail": "CSRF cookie set"})


# Optional: CSRF class-based view alternative
@method_decorator(ensure_csrf_cookie, name='dispatch')
class CsrfView(APIView):
    def get(self, request, format=None):
        return JsonResponse({"detail": "CSRF cookie set"})