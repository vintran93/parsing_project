from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from docx import Document
import string

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

        paragraphs = [p.text.strip() for p in document.paragraphs if p.text.strip()]

        questions = []
        current_question = None

        for para in paragraphs:
            if para.endswith('?'):
                if current_question:
                    questions.append(current_question)
                current_question = {
                    "question": para,
                    "options": [],
                    "explanation": ""
                }
            else:
                if not current_question:
                    continue
                if len(para) < 200 and len(para.split()) < 15:
                    current_question["options"].append(para.strip())
                else:
                    if current_question["explanation"]:
                        current_question["explanation"] += " " + para
                    else:
                        current_question["explanation"] = para

        if current_question:
            questions.append(current_question)

        output_lines = []
        for i, q in enumerate(questions, start=1):
            output_lines.append(f"{i}. {q['question']}")
            for idx, option in enumerate(q["options"]):
                letter = string.ascii_lowercase[idx] if idx < 26 else '?'
                label = f"{letter})"
                label = label.ljust(4)  # pad to 4 characters total
                output_lines.append(f"   {label}{option}")
            if q["explanation"]:
                output_lines.append(f"Explanation: {q['explanation']}")
            output_lines.append("")  # blank line

        plain_text_output = "\n".join(output_lines)

        return Response({"html": plain_text_output, "questions": None}, status=status.HTTP_200_OK)