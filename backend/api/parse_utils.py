from __future__ import annotations

import re
import string
from io import BytesIO
from typing import List, Dict, Any

from docx import Document

# --- Regex helpers -----------------------------------------------------------
PREFIX_RE = re.compile(r"^[a-zA-Z]\)\s*")  # matches "a) " etc.


def _clean_prefix(text: str) -> str:
    """Remove a leading "a) " / "B) " etc. if present."""
    return PREFIX_RE.sub("", text).strip()


# --- Core public function ----------------------------------------------------

def parse_docx_to_json(blob: bytes, title: str | None = None) -> Dict[str, Any]:
    """Parse a .docx file (given as raw bytes) into the JSON structure above.

    Parameters
    ----------
    blob : bytes
        Raw bytes of a .docx file (as obtained from Django’s InMemoryUploadedFile.read()).
    title : str | None
        Optional title to override whatever is in the document.
    """
    doc = Document(BytesIO(blob))

    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

    questions: List[Dict[str, Any]] = []
    current: Dict[str, Any] | None = None

    for para in paragraphs:
        if para.endswith("?"):
            # New question starts
            if current:
                questions.append(current)
            current = {"question": para, "options": [], "explanation": ""}
        else:
            if current is None:
                # Ignore header text before first question
                if title is None:  # first non‑blank paragraph = title
                    title = para
                continue

            # Heuristic: short line -> option, else -> explanation
            if len(para) < 200 and len(para.split()) < 20:
                current["options"].append(_clean_prefix(para))
            else:
                if current["explanation"]:
                    current["explanation"] += " " + para
                else:
                    current["explanation"] = para

    if current:
        questions.append(current)

    # Add letter prefixes (a) b) …) for options and store question number.
    for idx, q in enumerate(questions):
        lettered: List[str] = []
        for o_idx, text in enumerate(q["options"]):
            lettered.append(f"{string.ascii_lowercase[o_idx]}) {text}")
        q["options"] = lettered
        q["number"] = idx + 1

    return {"title": title, "questions": questions}


# Convenience function for models -------------------------------------------

def parse_and_attach(word_test_obj, file_field):
    """Read *file_field* (.docx) and save parsed JSON back to *word_test_obj*.

    Usage::
        parse_and_attach(instance, instance.doc_file)
        instance.save(update_fields=["parsed_json"])
    """
    file_field.seek(0)
    parsed = parse_docx_to_json(file_field.read(), title=word_test_obj.title)
    word_test_obj.parsed_json = parsed
