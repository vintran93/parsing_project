import string
import logging
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from docx import Document

logger = logging.getLogger(__name__)

# ──────────────────────────── PARSER ────────────────────────────
class WordParseView(APIView):
    """
    POST /api/parse-doc/
    multipart‑form: file=<.docx>

    Response JSON:
    {
      "title": "Practice Test 3",
      "questions": [
        {
          "question": "...?",
          "options": ["a) ...", "b) ...", ...],
          "explanation": "..."
        },
        ...
      ]
    }
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=400)
        if not file_obj.name.endswith(".docx"):
            return Response({"error": "Only .docx files supported"}, status=400)

        # Read Word document
        try:
            doc = Document(file_obj)
        except Exception as exc:
            logger.exception("Failed to read .docx")
            return Response({"error": str(exc)}, status=400)

        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        logger.debug("Extracted %d paragraphs", len(paragraphs))

        # Optional title
        title = None
        if paragraphs and not paragraphs[0].endswith("?"):
            title = paragraphs.pop(0)
            logger.debug("Detected title: %s", title)

        questions = []
        current = None
        collecting_options = False

        for para in paragraphs:
            if para.endswith("?"):  # new question
                if current:
                    questions.append(current)
                current = {"question": para, "options": [], "explanation": ""}
                collecting_options = True
                logger.debug("New question: %s", para)
                continue

            if not current:
                continue  # skip stray text before first question

            if collecting_options:
                if para.startswith("Explanation:"):
                    current["explanation"] = para[len("Explanation:"):].strip()
                    collecting_options = False
                    logger.debug("Explanation begins: %s", current["explanation"])
                else:
                    current["options"].append(para)
                    logger.debug("Option added: %s", para)
            else:
                current["explanation"] += " " + para
                logger.debug("Explanation cont.: %s", para)

        if current:
            questions.append(current)

        # Add a)/b)/c) labels
        for q in questions:
            q["options"] = [
                f"{string.ascii_lowercase[i]}) {opt}" for i, opt in enumerate(q["options"])
            ]

        return Response({"title": title, "questions": questions}, status=200)


# ──────────────────────────── GRADER ────────────────────────────
class GradeTestView(APIView):
    """
    POST /api/grade-test/
    Body JSON: {"answers":{"0":"a","1":"b", ...}}

    Responds with score, total, and per‑question results.
    """

    # Replace with your real answer key (index ➜ letter)
    CORRECT_ANSWERS = {
        0: "c",
        1: "b",
        2: "a",
        3: "b",
        4: "d",
        5: "d",
        6: "a",
        7: "a",
        8: "c",
        9: "b",
    }

    def post(self, request, format=None):
        answers = request.data.get("answers")
        if not isinstance(answers, dict):
            return Response({"error": "answers must be an object"}, status=400)

        total = len(self.CORRECT_ANSWERS)
        score = 0
        results = []

        for idx, correct in self.CORRECT_ANSWERS.items():
            given = answers.get(str(idx), "").lower()
            ok = given == correct.lower()
            if ok:
                score += 1
            results.append({
                "question_index": idx,
                "correct_answer": correct,
                "user_answer": given or None,
                "is_correct": ok,
            })

        return Response(
            {"score": score, "total": total, "results": results},
            status=200,
        )