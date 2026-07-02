"""Kod yurutme tool'lari: python_eval (sandbox), evaluate_math, regex_match."""
from __future__ import annotations

import asyncio
import io
import logging
import math
import re
from contextlib import redirect_stdout
from typing import Any, Dict

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


# Guvenli built-in beyaz listesi
SAFE_BUILTINS = {
    "abs", "all", "any", "ascii", "bin", "bool", "bytes", "callable",
    "chr", "complex", "dict", "divmod", "enumerate", "filter", "float",
    "format", "frozenset", "hash", "hex", "id", "int", "isinstance",
    "issubclass", "iter", "len", "list", "map", "max", "min", "next",
    "object", "oct", "ord", "pow", "print", "range", "repr", "reversed",
    "round", "set", "slice", "sorted", "str", "sum", "tuple", "type", "zip"}


class PythonEvalTool(BaseTool):
    name = "python_eval"
    description = (
        "Sandbox edilmis Python kodu calistirir (math/string islemleri icin). "
        "Dosya, network, OS erisimi YOKTUR. Kisa hesaplamalar, string dönüşümleri, "
        "veri donusumleri icin kullan. print() ile cikti yazabilirsin."
    )
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "code": {"type": "string", "description": "Calistirilacak Python kodu."},
            "timeout_sec": {"type": "integer", "default": 5}},
        "required": ["code"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        code = args.get("code") or ""
        if not code.strip():
            return ToolResult(ok=False, error="kod bos olamaz")
        timeout = float(args.get("timeout_sec") or 5)

        try:
            result = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(None, self._eval_sync, code),
                timeout=timeout,
            )
            return ToolResult(ok=True, output=result, data={"code": code})
        except asyncio.TimeoutError:
            return ToolResult(ok=False, error=f"Python eval zaman asimi ({timeout}s)")
        except Exception as exc:
            return ToolResult(ok=False, error=f"Python eval hatasi: {exc}")

    @staticmethod
    def _eval_sync(code: str) -> str:
        # Sandbox - sadece guvenli built-ins
        import builtins
        safe_builtins = {
            name: getattr(builtins, name) for name in SAFE_BUILTINS
            if hasattr(builtins, name)
        }
        globs: Dict[str, Any] = {
            "__builtins__": safe_builtins,
            "math": math,
            "re": re,
        }
        buf = io.StringIO()
        with redirect_stdout(buf):
            try:
                # Once expression olarak dene -> sonucu yazdir
                try:
                    val = eval(code, globs, {})
                    if val is not None:
                        print(repr(val))
                except SyntaxError:
                    # Statement (multi-line, def, vs.)
                    exec(code, globs, {})
            except Exception as exc:
                return f"HATA: {type(exc).__name__}: {exc}"
        out = buf.getvalue().strip()
        return out or "(cikti yok)"


class EvaluateMathTool(BaseTool):
    name = "evaluate_math"
    description = (
        "Bir matematik ifadesi degerlendirir (sadece sayilar, +-*/, parantez, math fonksiyonlari)."
    )
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "expression": {"type": "string", "description": "orn. '2*pi*5', 'sqrt(144)+1'"}},
        "required": ["expression"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        expr = (args.get("expression") or "").strip()
        if not expr:
            return ToolResult(ok=False, error="expression bos olamaz")
        # Sadece izin verilen karakterler
        if re.search(r"[a-zA-Z_][a-zA-Z_0-9]*", expr):
            for token in re.findall(r"[a-zA-Z_][a-zA-Z_0-9]*", expr):
                if token not in dir(math) and token not in {"pi", "e", "tau", "inf", "nan"}:
                    return ToolResult(ok=False, error=f"Yasakli isim: {token}")
        try:
            allowed = {k: getattr(math, k) for k in dir(math) if not k.startswith("_")}
            allowed.update({"pi": math.pi, "e": math.e, "tau": math.tau, "inf": math.inf})
            result = eval(expr, {"__builtins__": {}}, allowed)
            return ToolResult(ok=True, output=f"{expr} = {result}", data={"result": result})
        except Exception as exc:
            return ToolResult(ok=False, error=f"Hesaplama hatasi: {exc}")


class RegexMatchTool(BaseTool):
    name = "regex_match"
    description = "Bir metin uzerinde regex araması yapar, eslesenleri doner."
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "pattern": {"type": "string"},
            "text": {"type": "string"},
            "flags": {
                "type": "string",
                "description": "(opsiyonel) i,m,s,x kombinasyonu",
                "default": ""}},
        "required": ["pattern", "text"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        pattern = args.get("pattern") or ""
        text = args.get("text") or ""
        flags_str = (args.get("flags") or "").lower()
        if not pattern or not text:
            return ToolResult(ok=False, error="pattern ve text gerekli")
        flags = 0
        if "i" in flags_str:
            flags |= re.IGNORECASE
        if "m" in flags_str:
            flags |= re.MULTILINE
        if "s" in flags_str:
            flags |= re.DOTALL
        if "x" in flags_str:
            flags |= re.VERBOSE
        try:
            matches = re.findall(pattern, text, flags=flags)
            return ToolResult(
                ok=True,
                output=f"{len(matches)} eslesme:\n" + "\n".join(str(m) for m in matches[:50]),
                data={"matches": matches, "count": len(matches)},
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"Regex hatasi: {exc}")