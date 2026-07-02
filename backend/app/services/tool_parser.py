"""LLM yaniti icindeki metinsel tool cagrilarini parse eder.

Bazi proxy'ler veya yerel modeller native function calling iletmiyor;
bunun yerine model `<function_calls><invoke name="X"><parameter name="Y">Z</parameter></invoke></function_calls>`
gibi metinsel bir format uretebilir. Bu modul o formati yakalayip
gercek ToolCall objelerine cevirir.

Desteklenen formatlar:
1. Anthropic-style XML:
   <function_calls>
     <invoke name="tool_name">
       <parameter name="arg1">value1</parameter>
       <parameter name="arg2">value2</parameter>
     </invoke>
   </function_calls>

2. JSON-block (TOOL_CALL: ...):
   ```tool_call
   {"name": "tool_name", "arguments": {"arg1": "value1"}}
   ```
"""
from __future__ import annotations

import json
import logging
import re
import uuid
from typing import List, Tuple

from app.services.llm import ToolCall

logger = logging.getLogger(__name__)


# XML kapsayicilari
_FUNCTION_CALLS_RE = re.compile(
    r"<function_calls>(.*?)</function_calls>",
    re.DOTALL | re.IGNORECASE,
)
_INVOKE_RE = re.compile(
    r'<invoke\s+name=["\']([^"\']+)["\']\s*>(.*?)</invoke>',
    re.DOTALL | re.IGNORECASE,
)
_PARAMETER_RE = re.compile(
    r'<parameter\s+name=["\']([^"\']+)["\']\s*>(.*?)</parameter>',
    re.DOTALL | re.IGNORECASE,
)

# JSON-block format
_JSON_BLOCK_RE = re.compile(
    r"```(?:tool_call|json)?\s*\n(\{[\s\S]*?\})\s*\n```",
    re.IGNORECASE,
)


def _coerce_value(raw: str) -> object:
    """Parametre degerini uygun tipe donustur (json -> sayi/bool/dizi)."""
    s = raw.strip()
    # Bool
    if s.lower() == "true":
        return True
    if s.lower() == "false":
        return False
    if s.lower() in ("null", "none"):
        return None
    # Sayi
    if re.fullmatch(r"-?\d+", s):
        try:
            return int(s)
        except ValueError:
            pass
    if re.fullmatch(r"-?\d*\.\d+", s):
        try:
            return float(s)
        except ValueError:
            pass
    # JSON (dizi/object)
    if (s.startswith("[") and s.endswith("]")) or (s.startswith("{") and s.endswith("}")):
        try:
            return json.loads(s)
        except json.JSONDecodeError:
            pass
    # String
    return s


def parse_text_tool_calls(text: str) -> Tuple[str, List[ToolCall]]:
    """Metni tara, tool cagrilarini cikar.

    Return:
        (cleaned_text, tool_calls): metinden cagri bloklari silinmis ve
        bulunan ToolCall listesi.
    """
    if not text:
        return "", []

    tool_calls: List[ToolCall] = []
    cleaned = text

    # 1) <function_calls><invoke ...> XML
    for fc_match in _FUNCTION_CALLS_RE.finditer(text):
        block = fc_match.group(1)
        for inv_match in _INVOKE_RE.finditer(block):
            name = inv_match.group(1).strip()
            body = inv_match.group(2)
            args = {}
            for p_match in _PARAMETER_RE.finditer(body):
                pname = p_match.group(1).strip()
                pvalue = _coerce_value(p_match.group(2))
                args[pname] = pvalue
            tool_calls.append(
                ToolCall(id=f"text_{uuid.uuid4().hex[:8]}", name=name, arguments=args)
            )
        cleaned = cleaned.replace(fc_match.group(0), "").strip()

    # 2) Yalnizca <invoke ...> bloklari (function_calls sarmaladici olmadan)
    if not tool_calls:
        for inv_match in _INVOKE_RE.finditer(text):
            name = inv_match.group(1).strip()
            body = inv_match.group(2)
            args = {}
            for p_match in _PARAMETER_RE.finditer(body):
                pname = p_match.group(1).strip()
                pvalue = _coerce_value(p_match.group(2))
                args[pname] = pvalue
            tool_calls.append(
                ToolCall(id=f"text_{uuid.uuid4().hex[:8]}", name=name, arguments=args)
            )
            cleaned = cleaned.replace(inv_match.group(0), "").strip()

    # 3) ```tool_call JSON ``` bloklari
    if not tool_calls:
        for j_match in _JSON_BLOCK_RE.finditer(text):
            try:
                data = json.loads(j_match.group(1))
                if isinstance(data, dict) and "name" in data:
                    name = str(data["name"])
                    args = data.get("arguments") or data.get("args") or {}
                    if not isinstance(args, dict):
                        continue
                    tool_calls.append(
                        ToolCall(
                            id=f"text_{uuid.uuid4().hex[:8]}",
                            name=name,
                            arguments=args,
                        )
                    )
                    cleaned = cleaned.replace(j_match.group(0), "").strip()
            except json.JSONDecodeError:
                continue

    return cleaned.strip(), tool_calls


def build_text_tool_instructions(tool_names: List[str]) -> str:
    """Native tool calling'i desteklemeyen modeller icin metinsel format ogret."""
    if not tool_names:
        return ""
    names = ", ".join(tool_names)
    return (
        "ARAC KULLANIMI (ONEMLI):\n"
        "Eger bir araci cagirmak istersen TAM OLARAK su XML formatinda yaz "
        "(baska aciklama yapmadan):\n\n"
        "<function_calls>\n"
        "<invoke name=\"ARAC_ADI\">\n"
        "<parameter name=\"PARAM_ADI\">DEGER</parameter>\n"
        "</invoke>\n"
        "</function_calls>\n\n"
        "Birden fazla parametre varsa <parameter> bloklarini coklu yaz. "
        "Ornek - tarayicida google.com acmak icin:\n\n"
        "<function_calls>\n"
        "<invoke name=\"open_url\">\n"
        "<parameter name=\"url\">https://www.google.com</parameter>\n"
        "</invoke>\n"
        "</function_calls>\n\n"
        f"Mevcut araclar: {names}. "
        "Aciklama metnini araci CALISTIRDIKTAN SONRA yaz, oncesinde degil. "
        "Aciklama yazmadan once mutlaka <function_calls>...</function_calls> blogunu uret."
    )