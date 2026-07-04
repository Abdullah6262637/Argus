"""Genisletilmis dosya islemleri: search, copy, move, delete, mkdir, zip, unzip."""
from __future__ import annotations

import logging
import shutil
import zipfile
from pathlib import Path
from typing import Any, Dict, List

from app.services.security import expand_path
from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


def _safe(p: str) -> Path:
    """Path'i guvenli mutlak hale cevir."""
    return expand_path(p)


class SearchFilesTool(BaseTool):
    name = "search_files"
    description = (
        "Bir dizinde isim deseni ile dosya arar (rekursif). "
        "Pattern glob olabilir (orn. '*.py', 'README*')."
    )
    permission = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Aranacak kok dizin."},
            "pattern": {"type": "string", "description": "Glob pattern (orn. '*.txt')."},
            "max_results": {"type": "integer", "default": 100}},
        "required": ["path", "pattern"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            root = _safe(args.get("path") or ".")
            pattern = args.get("pattern") or "*"
            limit = int(args.get("max_results") or 100)
            if not root.exists() or not root.is_dir():
                return ToolResult(ok=False, error=f"Dizin yok: {root}")
            results: List[str] = []
            for p in root.rglob(pattern):
                results.append(str(p))
                if len(results) >= limit:
                    break
            lines = [f"{len(results)} eslesme ({pattern} altinda {root}):"]
            lines.extend(f"  {r}" for r in results[:50])
            if len(results) > 50:
                lines.append(f"  ... ve {len(results) - 50} sonuc daha")
            return ToolResult(ok=True, output="\n".join(lines), data={"results": results})
        except Exception as exc:
            return ToolResult(ok=False, error=f"Arama hatasi: {exc}")


class CopyFileTool(BaseTool):
    name = "copy_file"
    description = "Bir dosyayi/dizini kopyalar."
    permission = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "src": {"type": "string"},
            "dst": {"type": "string"}},
        "required": ["src", "dst"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            src = _safe(args.get("src") or "")
            dst = _safe(args.get("dst") or "")
            if not src.exists():
                return ToolResult(ok=False, error=f"Kaynak yok: {src}")
            dst.parent.mkdir(parents=True, exist_ok=True)
            if src.is_dir():
                shutil.copytree(src, dst)
            else:
                shutil.copy2(src, dst)
            return ToolResult(ok=True, output=f"Kopyalandi: {src} -> {dst}")
        except Exception as exc:
            return ToolResult(ok=False, error=f"Kopyala basarisiz: {exc}")


class MoveFileTool(BaseTool):
    name = "move_file"
    description = "Bir dosyayi/dizini tasiir veya yeniden adlandirir."
    permission = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "src": {"type": "string"},
            "dst": {"type": "string"}},
        "required": ["src", "dst"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            src = _safe(args.get("src") or "")
            dst = _safe(args.get("dst") or "")
            if not src.exists():
                return ToolResult(ok=False, error=f"Kaynak yok: {src}")
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(src), str(dst))
            return ToolResult(ok=True, output=f"Tasindi: {src} -> {dst}")
        except Exception as exc:
            return ToolResult(ok=False, error=f"Tasi basarisiz: {exc}")


class DeleteFileTool(BaseTool):
    name = "delete_file"
    description = "Bir dosyayi veya dizini siler. Dikkatli kullan, geri alinamaz."
    permission = "file_system"
    requires_confirmation = True
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string"},
            "recursive": {"type": "boolean", "default": False}},
        "required": ["path"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            p = _safe(args.get("path") or "")
            if not p.exists():
                return ToolResult(ok=False, error=f"Yol yok: {p}")
            if p.is_dir():
                if args.get("recursive"):
                    shutil.rmtree(p)
                else:
                    p.rmdir()
            else:
                p.unlink()
            return ToolResult(ok=True, output=f"Silindi: {p}")
        except Exception as exc:
            return ToolResult(ok=False, error=f"Sil basarisiz: {exc}")


class MkdirTool(BaseTool):
    name = "mkdir"
    description = "Bir veya daha fazla iclice dizin olusturur."
    permission = "file_system"
    parameters = {
        "type": "object",
        "properties": {"path": {"type": "string"}},
        "required": ["path"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            p = _safe(args.get("path") or "")
            p.mkdir(parents=True, exist_ok=True)
            return ToolResult(ok=True, output=f"Dizin hazir: {p}")
        except Exception as exc:
            return ToolResult(ok=False, error=f"Mkdir basarisiz: {exc}")


class ZipTool(BaseTool):
    name = "zip_files"
    description = "Bir dizini veya dosya listesini ZIP arsivi yapar."
    permission = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "source": {"type": "string", "description": "Sikistirilacak dosya/dizin yolu."},
            "output_zip": {"type": "string", "description": "Olusturulacak .zip dosyasi yolu."}},
        "required": ["source", "output_zip"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            src = _safe(args.get("source") or "")
            out = _safe(args.get("output_zip") or "")
            if not src.exists():
                return ToolResult(ok=False, error=f"Kaynak yok: {src}")
            out.parent.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
                if src.is_dir():
                    for f in src.rglob("*"):
                        if f.is_file():
                            zf.write(f, f.relative_to(src.parent))
                else:
                    zf.write(src, src.name)
            return ToolResult(
                ok=True,
                output=f"Zip olusturuldu: {out} ({out.stat().st_size} bayt)",
                data={"path": str(out)},
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"Zip basarisiz: {exc}")


class UnzipTool(BaseTool):
    name = "unzip"
    description = "Bir ZIP dosyasini bir dizine cikarir."
    permission = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "zip_path": {"type": "string"},
            "extract_to": {"type": "string"}},
        "required": ["zip_path", "extract_to"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            z = _safe(args.get("zip_path") or "")
            ext = _safe(args.get("extract_to") or "")
            ext.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(z, "r") as zf:
                zf.extractall(ext)
                count = len(zf.namelist())
            return ToolResult(ok=True, output=f"Cikarildi: {count} dosya -> {ext}")
        except Exception as exc:
            return ToolResult(ok=False, error=f"Unzip basarisiz: {exc}")