from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status

from docx import Document

class WordParseView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        if not file_obj.name.endswith('.docx'):
            return Response({"error": "Only .docx files are supported"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            document = Document(file_obj)
        except Exception as e:
            return Response({"error": f"Failed to read document: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # Example: extract paragraphs as HTML and questions as JSON - customize as needed
        paragraphs = [para.text for para in document.paragraphs if para.text.strip()]
        html = "<br>".join(paragraphs)  # very simple conversion to HTML for example
        questions = [{"question": p} for p in paragraphs]  # placeholder logic

        return Response({"html": html, "questions": questions}, status=status.HTTP_200_OK)