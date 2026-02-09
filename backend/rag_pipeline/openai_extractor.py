import json
import os
import re
from pathlib import Path
from typing import Any

from openai import OpenAI

MODEL_NAME = "gpt-4.1-nano"
SCHEMA_VERSION = "lab_report_v2"


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


def _extract_report_prompt() -> str:
    return f"""
You are a medical laboratory report extraction engine.

Task:
Extract only explicitly stated data from the input report text.
Return exactly one valid JSON object and nothing else.

Output schema (must match exactly):
{{
  "schema_version": "{SCHEMA_VERSION}",
  "report": {{
    "report_type": "",
    "report_date": "",
    "patient": {{
      "name": "",
      "age": "",
      "sex": "",
      "patient_id": ""
    }}
  }},
  "panels": [
    {{
      "panel_name": "",
      "metrics": [
        {{
          "test_name": "",
          "value": "",
          "value_numeric": null,
          "unit": "",
          "reference_range": "",
          "flag": "unknown",
          "is_abnormal": false,
          "notes": ""
        }}
      ]
    }}
  ],
  "metrics": [
    {{
      "test_name": "",
      "value": "",
      "value_numeric": null,
      "unit": "",
      "reference_range": "",
      "flag": "unknown",
      "is_abnormal": false,
      "panel_name": "",
      "notes": ""
    }}
  ],
  "abnormal_metrics": [
    {{
      "test_name": "",
      "value": "",
      "value_numeric": null,
      "unit": "",
      "reference_range": "",
      "flag": "unknown",
      "is_abnormal": true,
      "panel_name": "",
      "notes": ""
    }}
  ],
  "summary_counts": {{
    "panel_count": 0,
    "metric_count": 0,
    "abnormal_metric_count": 0
  }}
}}

Hard requirements:
1) Use only information present in the input text; do not infer, estimate, or invent.
2) Return JSON only; no markdown, code fences, or commentary.
3) Preserve test names, values, units, and reference ranges exactly as written.
4) Use empty string ("") for missing text fields.
5) Use null for missing numeric fields.
6) Allowed flag values only: high, low, normal, abnormal, critical, unknown.
7) Set is_abnormal=true only when flag is high, low, abnormal, or critical.
8) Include every visible metric with a discernible test name and value.
9) If OCR repeats the same metric line, keep one deduplicated metric entry.
10) If uncertain, prefer conservative extraction and leave missing fields empty/null instead of guessing.
"""


def _looks_like_file_reference(value: str) -> bool:
    stripped = value.strip()
    if not stripped or "\n" in stripped or "\r" in stripped:
        return False
    if len(stripped) > 240:
        return False
    return True


def _extract_text_from_pdf(pdf_path: Path) -> str:
    reader_cls = None
    try:
        from pypdf import PdfReader as reader_cls  # type: ignore
    except Exception:
        try:
            from PyPDF2 import PdfReader as reader_cls  # type: ignore
        except Exception:
            reader_cls = None

    if reader_cls is None:
        raise RuntimeError(
            "PDF text extraction dependency not installed. Install pypdf to enable extraction."
        )

    reader = reader_cls(str(pdf_path))
    pages = []
    for page in reader.pages:
        page_text = (page.extract_text() or "").strip()
        if page_text:
            pages.append(page_text)

    extracted = "\n\n".join(pages).strip()
    if not extracted:
        raise ValueError(f"No extractable text found in PDF: {pdf_path}")
    return extracted


def _resolve_pdf_text(report_input) -> str:
    if isinstance(report_input, Path):
        if report_input.suffix.lower() != ".pdf":
            raise ValueError("Only PDF files are supported for extraction.")
        if not report_input.exists() or not report_input.is_file():
            raise ValueError(f"PDF file not found: {report_input}")
        return _extract_text_from_pdf(report_input)

    if isinstance(report_input, str):
        if _looks_like_file_reference(report_input):
            path_candidate = Path(report_input.strip())
            if path_candidate.exists() and path_candidate.is_file():
                if path_candidate.suffix.lower() != ".pdf":
                    raise ValueError("Only PDF files are supported for extraction.")
                return _extract_text_from_pdf(path_candidate)
        return report_input

    raise ValueError("Unsupported report input. Provide PDF text or a PDF file path.")


def _safe_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _safe_float(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    if not isinstance(value, str):
        return None
    candidate = value.replace(",", "")
    match = re.search(r"-?\d+(?:\.\d+)?", candidate)
    if not match:
        return None
    try:
        return float(match.group(0))
    except ValueError:
        return None


def _normalize_flag(raw_flag: Any) -> str:
    text = _safe_text(raw_flag).lower()
    if not text:
        return "unknown"
    synonyms = {
        "h": "high",
        "high": "high",
        "above": "high",
        "l": "low",
        "low": "low",
        "below": "low",
        "n": "normal",
        "normal": "normal",
        "abnormal": "abnormal",
        "critical": "critical",
        "panic": "critical",
        "unknown": "unknown",
    }
    if text in synonyms:
        return synonyms[text]
    if "critical" in text or "panic" in text:
        return "critical"
    if "high" in text:
        return "high"
    if "low" in text:
        return "low"
    if "normal" in text:
        return "normal"
    if "abnormal" in text:
        return "abnormal"
    return "unknown"


def _normalize_metric(metric: Any, panel_name: str = "") -> dict[str, Any] | None:
    if not isinstance(metric, dict):
        return None

    test_name = _safe_text(
        metric.get("test_name")
        or metric.get("name")
        or metric.get("metric_name")
        or metric.get("analyte")
    )
    if not test_name:
        return None

    value = _safe_text(metric.get("value") or metric.get("result") or metric.get("observed_value"))
    value_numeric = metric.get("value_numeric")
    if not isinstance(value_numeric, (int, float)):
        value_numeric = _safe_float(value)

    flag = _normalize_flag(
        metric.get("flag")
        or metric.get("status")
        or metric.get("interpretation")
        or metric.get("abnormality")
    )
    is_abnormal = flag in {"high", "low", "abnormal", "critical"}

    effective_panel_name = panel_name or _safe_text(metric.get("panel_name") or metric.get("panel"))

    normalized = {
        "test_name": test_name,
        "value": value,
        "value_numeric": float(value_numeric) if isinstance(value_numeric, (int, float)) else None,
        "unit": _safe_text(metric.get("unit")),
        "reference_range": _safe_text(
            metric.get("reference_range")
            or metric.get("range")
            or metric.get("normal_range")
        ),
        "flag": flag,
        "is_abnormal": is_abnormal,
        "panel_name": effective_panel_name,
        "notes": _safe_text(metric.get("notes") or metric.get("comment")),
    }
    return normalized


def _strip_code_fences(text: str) -> str:
    stripped = text.strip()
    if stripped.startswith("```") and stripped.endswith("```"):
        lines = stripped.splitlines()
        if len(lines) >= 3:
            return "\n".join(lines[1:-1]).strip()
    return stripped


def _parse_json_output(raw_output: str) -> Any:
    cleaned = _strip_code_fences(raw_output)
    if not cleaned:
        return None

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        candidate = cleaned[start : end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            return None

    return None


def _extract_report_metadata(payload: Any) -> dict[str, Any]:
    report_source = payload if isinstance(payload, dict) else {}
    report_block = report_source.get("report") if isinstance(report_source.get("report"), dict) else {}
    patient_block = report_block.get("patient") if isinstance(report_block.get("patient"), dict) else {}
    if not patient_block and isinstance(report_source.get("patient"), dict):
        patient_block = report_source["patient"]

    report_type = _safe_text(
        report_block.get("report_type")
        or report_source.get("report_type")
        or report_source.get("type")
    )
    report_date = _safe_text(
        report_block.get("report_date")
        or report_source.get("report_date")
        or report_source.get("date")
    )

    return {
        "report_type": report_type,
        "report_date": report_date,
        "patient": {
            "name": _safe_text(patient_block.get("name")),
            "age": _safe_text(patient_block.get("age")),
            "sex": _safe_text(patient_block.get("sex")),
            "patient_id": _safe_text(patient_block.get("patient_id") or patient_block.get("id")),
        },
    }


def _build_metrics_from_payload(payload: Any) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    flat_metrics: list[dict[str, Any]] = []
    panel_map: dict[str, list[dict[str, Any]]] = {}

    def add_metric(candidate_metric: Any, panel_name: str = "") -> None:
        normalized_metric = _normalize_metric(candidate_metric, panel_name=panel_name)
        if not normalized_metric:
            return
        effective_panel_name = normalized_metric.get("panel_name") or "Uncategorized"
        normalized_metric["panel_name"] = effective_panel_name
        flat_metrics.append(normalized_metric)
        panel_map.setdefault(effective_panel_name, []).append(normalized_metric)

    if isinstance(payload, dict):
        panels = payload.get("panels")
        if isinstance(panels, list):
            for panel in panels:
                if not isinstance(panel, dict):
                    continue
                panel_name = _safe_text(panel.get("panel_name") or panel.get("name") or "Uncategorized")
                metrics = panel.get("metrics")
                if not isinstance(metrics, list):
                    continue
                for metric in metrics:
                    add_metric(metric, panel_name=panel_name)

        if not flat_metrics:
            legacy_metrics = payload.get("metrics")
            if isinstance(legacy_metrics, dict):
                for metric_name, metric_value in legacy_metrics.items():
                    candidate = metric_value if isinstance(metric_value, dict) else {"value": metric_value}
                    candidate = dict(candidate)
                    candidate.setdefault("test_name", metric_name)
                    add_metric(candidate)
            elif isinstance(legacy_metrics, list):
                for metric in legacy_metrics:
                    add_metric(metric)

    if isinstance(payload, list) and not flat_metrics:
        for metric in payload:
            add_metric(metric)

    panels = [
        {
            "panel_name": panel_name,
            "metrics": metrics,
        }
        for panel_name, metrics in panel_map.items()
    ]

    return panels, flat_metrics


def _empty_canonical_payload() -> dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "report": {
            "report_type": "",
            "report_date": "",
            "patient": {
                "name": "",
                "age": "",
                "sex": "",
                "patient_id": "",
            },
        },
        "panels": [],
        "metrics": [],
        "abnormal_metrics": [],
        "summary_counts": {
            "panel_count": 0,
            "metric_count": 0,
            "abnormal_metric_count": 0,
        },
    }


def _canonicalize_payload(raw_output: str) -> dict[str, Any]:
    parsed = _parse_json_output(raw_output)
    canonical = _empty_canonical_payload()

    if parsed is None:
        canonical["parsing_status"] = "invalid_json"
        canonical["raw_output_excerpt"] = _strip_code_fences(raw_output)[:1200]
        return canonical

    canonical["report"] = _extract_report_metadata(parsed)
    panels, metrics = _build_metrics_from_payload(parsed)
    abnormal_metrics = [metric for metric in metrics if metric.get("is_abnormal")]

    canonical["panels"] = panels
    canonical["metrics"] = metrics
    canonical["abnormal_metrics"] = abnormal_metrics
    canonical["summary_counts"] = {
        "panel_count": len(panels),
        "metric_count": len(metrics),
        "abnormal_metric_count": len(abnormal_metrics),
    }
    return canonical


def extract_report(report_input):
    client = _get_openai_client()
    system = _extract_report_prompt()
    normalized_text = _resolve_pdf_text(report_input)

    prompt = f"""
Extract structured values from this medical report text using the required schema.
Do not output anything other than the JSON object.

{normalized_text}
"""

    response = client.responses.create(
        model=MODEL_NAME,
        instructions=system,
        input=prompt,
        temperature=0,
    )

    raw_output = response.output_text or ""
    canonical = _canonicalize_payload(raw_output)
    return json.dumps(canonical, ensure_ascii=True)


def extract_report_from_text(report_text):
    return extract_report(report_text)
