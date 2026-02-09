import json
import os
import re
from pathlib import Path
from typing import Any

from openai import OpenAI

MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-4.1-nano")
MAX_DOCUMENTS_FOR_SUMMARY = 10
MAX_METRICS_PER_DOCUMENT = 60
MAX_ABNORMAL_METRICS_PER_DOCUMENT = 25
#MAX_SUMMARY_OUTPUT_TOKENS = 2500


def _read_env_key_from_dotenv() -> str | None:
    candidates = [
        Path(__file__).resolve().parent / ".env",
        Path(__file__).resolve().parent.parent / ".env",
    ]
    for dotenv_path in candidates:
        if not dotenv_path.exists():
            continue

        for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            if key.strip() != "OPENAI_API_KEY":
                continue
            cleaned = value.strip().strip("'").strip('"')
            return cleaned or None
    return None


def _get_openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY") or _read_env_key_from_dotenv()
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not set. Add it to your environment or .env file."
        )
    return OpenAI(api_key=api_key)


def _normalize_whitespace(text: str) -> str:
    return " ".join(text.split())


def _is_pdf_filename(filename) -> bool:
    return isinstance(filename, str) and filename.lower().endswith(".pdf")


def _coerce_structured_data(value: Any) -> dict[str, Any] | None:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return None
        return parsed if isinstance(parsed, dict) else None
    return None


def _compact_metric(metric: Any) -> dict[str, Any] | None:
    if not isinstance(metric, dict):
        return None
    test_name = str(metric.get("test_name") or "").strip()
    value = str(metric.get("value") or "").strip()
    if not test_name:
        return None
    return {
        "test_name": test_name,
        "value": value,
        "unit": str(metric.get("unit") or "").strip(),
        "reference_range": str(metric.get("reference_range") or "").strip(),
        "flag": str(metric.get("flag") or "unknown").strip().lower() or "unknown",
        "is_abnormal": bool(metric.get("is_abnormal")),
        "panel_name": str(metric.get("panel_name") or "").strip(),
    }


def _compact_structured_data(structured: Any) -> dict[str, Any] | None:
    payload = _coerce_structured_data(structured)
    if not isinstance(payload, dict):
        return None

    if payload.get("schema_version") == "lab_report_v2":
        metrics = payload.get("metrics") if isinstance(payload.get("metrics"), list) else []
        abnormal_metrics = (
            payload.get("abnormal_metrics")
            if isinstance(payload.get("abnormal_metrics"), list)
            else []
        )
        compact_metrics = []
        for metric in metrics[:MAX_METRICS_PER_DOCUMENT]:
            compact = _compact_metric(metric)
            if compact:
                compact_metrics.append(compact)

        compact_abnormal_metrics = []
        abnormal_source = abnormal_metrics[:MAX_ABNORMAL_METRICS_PER_DOCUMENT] or metrics
        for metric in abnormal_source:
            compact = _compact_metric(metric)
            if compact and compact.get("is_abnormal"):
                compact_abnormal_metrics.append(compact)

        return {
            "schema_version": "lab_report_v2",
            "report": payload.get("report") if isinstance(payload.get("report"), dict) else {},
            "summary_counts": payload.get("summary_counts")
            if isinstance(payload.get("summary_counts"), dict)
            else {},
            "metrics": compact_metrics,
            "abnormal_metrics": compact_abnormal_metrics,
        }

    report_type = str(payload.get("report_type") or payload.get("type") or "").strip()
    report_date = str(payload.get("report_date") or payload.get("date") or "").strip()

    legacy_metrics = payload.get("metrics")
    compact_legacy_metrics = []
    if isinstance(legacy_metrics, dict):
        for name, value in list(legacy_metrics.items())[:MAX_METRICS_PER_DOCUMENT]:
            compact_legacy_metrics.append(
                {
                    "test_name": str(name),
                    "value": str(value),
                    "unit": "",
                    "reference_range": "",
                    "flag": "unknown",
                    "is_abnormal": False,
                    "panel_name": "",
                }
            )
    elif isinstance(legacy_metrics, list):
        for metric in legacy_metrics[:MAX_METRICS_PER_DOCUMENT]:
            compact = _compact_metric(metric)
            if compact:
                compact_legacy_metrics.append(compact)

    if report_type or report_date or compact_legacy_metrics:
        return {
            "schema_version": "legacy",
            "report": {
                "report_type": report_type,
                "report_date": report_date,
            },
            "metrics": compact_legacy_metrics,
        }

    return payload


def _compact_summary_input(data):
    if not isinstance(data, dict):
        return {"documents": []}

    documents = data.get("documents")
    if not isinstance(documents, list):
        return {"documents": []}

    compact_documents = []
    for doc in documents:
        if not isinstance(doc, dict):
            continue
        if not _is_pdf_filename(doc.get("filename")):
            continue

        compact_doc = {
            "filename": doc.get("filename"),
            "uploadedAt": doc.get("uploadedAt"),
            "extractionStatus": doc.get("extractionStatus"),
        }

        structured = _compact_structured_data(doc.get("structuredData"))
        if structured:
            compact_doc["structuredData"] = structured
        else:
            snippet = _normalize_whitespace(str(doc.get("extractedText") or ""))
            compact_doc["extractedTextSnippet"] = snippet[:1200]

        compact_documents.append(compact_doc)
        if len(compact_documents) >= MAX_DOCUMENTS_FOR_SUMMARY:
            break

    return {"documents": compact_documents}


def _extract_chat_text(response) -> str:
    if not response or not getattr(response, "choices", None):
        return ""
    choice = response.choices[0]
    if not choice or not getattr(choice, "message", None):
        return ""
    content = choice.message.content
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict) and isinstance(item.get("text"), str):
                parts.append(item["text"])
        return "\n".join(parts).strip()
    return ""


def _strip_code_fences(text: str) -> str:
    stripped = text.strip()
    if stripped.startswith("```") and stripped.endswith("```"):
        lines = stripped.splitlines()
        if len(lines) >= 3:
            return "\n".join(lines[1:-1]).strip()
    return stripped


def _parse_summary_json(raw_text: str) -> dict[str, Any] | None:
    cleaned = _strip_code_fences(raw_text)
    if not cleaned:
        return None

    try:
        parsed = json.loads(cleaned)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        candidate = cleaned[start : end + 1]
        try:
            parsed = json.loads(candidate)
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            return None
    return None


def _to_string_list(value: Any) -> list[str]:
    if isinstance(value, list):
        items = []
        for item in value:
            text = str(item).strip()
            if text:
                items.append(text)
        return items
    if isinstance(value, str):
        text = value.strip()
        return [text] if text else []
    return []


def _normalize_markdown_spacing(text: str) -> str:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    normalized = re.sub(r"[ \t]+\n", "\n", normalized)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    return normalized.strip()


def _format_summary_markdown(summary_payload: dict[str, Any]) -> str:
    coverage = _to_string_list(summary_payload.get("patient_report_coverage"))
    key_findings = _to_string_list(summary_payload.get("key_reported_findings"))
    abnormal_findings = _to_string_list(summary_payload.get("reported_abnormal_findings"))
    changes = _to_string_list(summary_payload.get("observed_changes_across_reports"))
    scope_note = str(summary_payload.get("scope_note") or "").strip()
    if not scope_note:
        scope_note = (
            "Findings are reported exactly as documented in the reports; "
            "no diagnosis or clinical inference is provided."
        )

    if not coverage:
        coverage = ["Not explicitly stated in the reports."]
    if not key_findings:
        key_findings = ["No explicit findings were available for extraction."]
    if not abnormal_findings:
        abnormal_findings = ["No abnormalities were explicitly reported."]
    if not changes:
        changes = ["No explicit cross-report changes were stated."]

    sections = [
        ("Patient & Report Coverage", coverage),
        ("Key Reported Findings", key_findings),
        ("Reported Abnormal Findings", abnormal_findings),
        ("Observed Changes Across Reports", changes),
        ("Scope Note", [scope_note]),
    ]

    lines = []
    for title, items in sections:
        lines.append(f"**{title}**")
        for item in items:
            lines.append(f"- {item}")
        lines.append("")
    return _normalize_markdown_spacing("\n".join(lines))


def _heuristic_summary(compact_data) -> str:
    docs = compact_data.get("documents") if isinstance(compact_data, dict) else None
    if not isinstance(docs, list):
        return _format_summary_markdown(
            {
                "patient_report_coverage": ["Summary unavailable from model output."],
                "key_reported_findings": ["No model output available."],
                "reported_abnormal_findings": [],
                "observed_changes_across_reports": [],
                "scope_note": (
                    "This fallback summary contains only high-level processing status."
                ),
            }
        )
    total = len(docs)
    with_structured = sum(1 for d in docs if isinstance(d, dict) and d.get("structuredData"))
    with_text = sum(1 for d in docs if isinstance(d, dict) and d.get("extractedTextSnippet"))
    return _format_summary_markdown(
        {
            "patient_report_coverage": [
                f"Total reports processed: {total}",
                f"Structured extraction available: {with_structured}",
                f"Text-only extraction available: {with_text}",
            ],
            "key_reported_findings": [
                "Detailed findings were unavailable from model output; refer to extracted report data."
            ],
            "reported_abnormal_findings": [],
            "observed_changes_across_reports": [],
            "scope_note": (
                "This is an automated fallback summary and does not include diagnosis or inference."
            ),
        }
    )


def generate_summary(data):
    compact_data = _compact_summary_input(data)
    docs = compact_data.get("documents", [])
    if not docs:
        return "No PDF documents found to summarize."

    client = _get_openai_client()
    system = """
You are a medical report summarizer.

Task:
Summarize only explicitly reported findings from the provided dataset.

Hard requirements:
1) Use only information present in the input data.
2) Do not diagnose.
3) Do not provide recommendations, treatment advice, or prognosis.
4) Do not infer causes, risk, severity, or clinical conclusions.
5) Do not invent values, ranges, trends, or abnormalities.
6) Mention abnormalities only if explicitly flagged abnormal/high/low/critical
   or if clearly outside a provided reference range in the input.
7) Keep the summary concise, factual, and professional.
8) Return JSON only, following the required output keys exactly.
"""

    data_block = json.dumps(compact_data, indent=2)

    prompt = f"""Summarize findings from this lab-report dataset.

Return a single JSON object with exactly these keys:
{{
  "patient_report_coverage": ["..."],
  "key_reported_findings": ["..."],
  "reported_abnormal_findings": ["..."],
  "observed_changes_across_reports": ["..."],
  "scope_note": "..."
}}

Formatting and content rules:
- Each list item must be one concise factual statement.
- Keep wording neutral and professional.
- If a section has no explicit data, return an empty list for that section.
- scope_note must be a single sentence stating that this is findings-only and non-diagnostic.

{data_block}
"""

    response = client.chat.completions.create(
        model=MODEL_NAME,
        #max_tokens=MAX_SUMMARY_OUTPUT_TOKENS,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        temperature=0,
    )
    summary_text = _extract_chat_text(response)
    if summary_text:
        summary_payload = _parse_summary_json(summary_text)
        if summary_payload:
            return _format_summary_markdown(summary_payload)

    fallback_prompt = f"""Create a concise, findings-only summary in markdown using EXACTLY this section structure:

**Patient & Report Coverage**
- ...

**Key Reported Findings**
- ...

**Reported Abnormal Findings**
- ...

**Observed Changes Across Reports**
- ...

**Scope Note**
- Findings are reported exactly as documented in the reports; no diagnosis or inference is provided.

Rules:
- Use only the provided data.
- No diagnosis, recommendations, or clinical conclusions.
- No invented values or trends.
- Keep statements factual and concise.

{data_block}
"""
    fallback_response = client.chat.completions.create(
        model=MODEL_NAME,
        #max_tokens=MAX_SUMMARY_OUTPUT_TOKENS,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": fallback_prompt},
        ],
        temperature=0,
    )
    fallback_text = _extract_chat_text(fallback_response)
    if fallback_text:
        fallback_payload = _parse_summary_json(fallback_text)
        if fallback_payload:
            return _format_summary_markdown(fallback_payload)
        return _normalize_markdown_spacing(_strip_code_fences(fallback_text))

    return _heuristic_summary(compact_data)
