from __future__ import annotations

import re
import string
from io import BytesIO
from typing import List, Dict, Any

from docx import Document

# --------------------------------------------------------------------------- #
# Regex helpers
# --------------------------------------------------------------------------- #
OPTION_PREFIX_RE  = re.compile(r"^[A-Da-d][\)\.\s]\s*")        # “A) ”  or “b. ”
PREFIX_CLEAN_RE   = re.compile(r"^[A-Da-d][\)\.\s]\s*")
CORRECT_LINE_RE   = re.compile(r"correct\s*answer\s*[:\-]?\s*([a-d])",
                               flags=re.I)                     # “Correct answer: B”

EXPECTED_OPTIONS  = 4  # how many answer choices per question

def _clean_prefix(text: str) -> str:
    return PREFIX_CLEAN_RE.sub("", text).strip()

# --------------------------------------------------------------------------- #
# Core parser
# --------------------------------------------------------------------------- #
def parse_docx_to_json(blob: bytes, title: str | None = None) -> Dict[str, Any]:
    """
    Parse .docx bytes to the JSON structure our app expects.
    * The first 4 non‑blank lines after a question become its options,
      regardless of length.
    * “Correct answer: X” or leading ‘*’ still set correct_answer.
    """
    doc  = Document(BytesIO(blob))
    paras = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

    questions: List[Dict[str, Any]] = []
    current: Dict[str, Any] | None  = None

    for para in paras:
        # ---------------- New question --------------------------------------
        if para.endswith("?"):
            if current:
                questions.append(current)
            current = {
                "question":        para,
                "options":         [],
                "explanation":     "",
                "correct_answer":  None,
            }
            continue

        # ---------------- Title before first question -----------------------
        if current is None:
            if title is None:
                title = para
            continue

        # ---------------- “Correct answer: X” -------------------------------
        if (m := CORRECT_LINE_RE.match(para)):
            current["correct_answer"] = m.group(1).lower()
            continue           # don’t add to options/explanation

        # ---------------- Option detection ----------------------------------
        is_leading_star = para.startswith("*")
        core_text       = para[1:].strip() if is_leading_star else para

        should_be_option = (
            OPTION_PREFIX_RE.match(core_text) is not None
            or len(current["options"]) < EXPECTED_OPTIONS        # <- KEY CHANGE
        )

        if should_be_option:
            cleaned = _clean_prefix(core_text)
            current["options"].append(cleaned)

            if is_leading_star:
                current["correct_answer"] = string.ascii_lowercase[
                    len(current["options"]) - 1
                ]
            continue

        # ---------------- Otherwise: explanation ----------------------------
        current["explanation"] += (" " if current["explanation"] else "") + para

    if current:
        questions.append(current)

    # ---------------- Final pass per question ------------------------------
    for idx, q in enumerate(questions):
        # Add letter prefixes
        q["options"] = [
            f"{string.ascii_lowercase[i]}) {opt}" for i, opt in enumerate(q["options"])
        ]
        q["number"] = idx + 1

        # Fallback correct answer
        if q["correct_answer"] is None and q["options"]:
            q["correct_answer"] = "a"

    return {"title": title, "questions": questions}

# --------------------------------------------------------------------------- #
# Model helper
# --------------------------------------------------------------------------- #
def parse_and_attach(word_test_obj, file_field):
    """Attach parsed JSON back to a WordTest instance."""
    file_field.seek(0)
    word_test_obj.parsed_json = parse_docx_to_json(
        file_field.read(), title=word_test_obj.title
    )