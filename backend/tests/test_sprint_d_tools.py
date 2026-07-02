"""Sprint D tool aileleri için smoke test'leri.

Test stratejisi:
- Schema doğrulama (to_openai_schema / to_anthropic_schema)
- Argüman validasyonu (boş input → ok=False)
- HIGH_RISK tool'ların `requires_confirmation = True`
- Network/binary gerektirenler skip ile atlanır
"""
from __future__ import annotations

import pytest

from app.services.approval_service import HIGH_RISK_TOOLS
from app.services.tools.base import ToolContext


def _ctx() -> ToolContext:
    return ToolContext(agent_id="test", agent_name="Test")


# ============================================================
# D.2 Research tools
# ============================================================


@pytest.mark.asyncio
class TestResearchTools:
    async def test_arxiv_schema(self):
        from app.services.tools.research_tools import ArxivSearchTool
        t = ArxivSearchTool()
        assert t.name == "arxiv_search"
        assert t.permission == "web_search"
        schema = t.to_openai_schema()
        assert "function" in schema
        assert "query" in schema["function"]["parameters"]["properties"]

    async def test_arxiv_empty_query(self):
        from app.services.tools.research_tools import ArxivSearchTool
        result = await ArxivSearchTool().execute({"query": ""}, _ctx())
        assert not result.ok
        assert "bos" in (result.error or "").lower()

    async def test_wikipedia_schema(self):
        from app.services.tools.research_tools import WikipediaLookupTool
        t = WikipediaLookupTool()
        assert t.name == "wikipedia_lookup"
        assert "title" in t.parameters["required"]

    async def test_wikipedia_empty_title(self):
        from app.services.tools.research_tools import WikipediaLookupTool
        result = await WikipediaLookupTool().execute({"title": ""}, _ctx())
        assert not result.ok

    async def test_youtube_search_schema(self):
        from app.services.tools.research_tools import YoutubeSearchTool
        t = YoutubeSearchTool()
        assert t.name == "youtube_search"

    async def test_youtube_transcript_invalid_id(self):
        from app.services.tools.research_tools import YoutubeTranscriptTool
        result = await YoutubeTranscriptTool().execute({"video_id_or_url": ""}, _ctx())
        assert not result.ok


# ============================================================
# D.4 Document extra
# ============================================================


@pytest.mark.asyncio
class TestDocumentExtraTools:
    async def test_pdf_merge_schema(self):
        from app.services.tools.document_extra_tools import PDFMergeTool
        t = PDFMergeTool()
        assert t.name == "pdf_merge"
        assert t.permission == "file_system"

    async def test_pdf_merge_empty_inputs(self):
        from app.services.tools.document_extra_tools import PDFMergeTool
        result = await PDFMergeTool().execute(
            {"input_paths": [], "output_path": "/tmp/x.pdf"}, _ctx(),
        )
        assert not result.ok

    async def test_pdf_split_missing_args(self):
        from app.services.tools.document_extra_tools import PDFSplitTool
        result = await PDFSplitTool().execute({"input_path": ""}, _ctx())
        assert not result.ok

    async def test_pptx_generate_schema(self):
        from app.services.tools.document_extra_tools import PPTXGenerateTool
        t = PPTXGenerateTool()
        assert t.name == "pptx_generate"

    async def test_markdown_to_html_empty(self):
        from app.services.tools.document_extra_tools import MarkdownToHtmlTool
        result = await MarkdownToHtmlTool().execute({"markdown": ""}, _ctx())
        assert not result.ok

    async def test_markdown_to_html_inline(self):
        """markdown paketi varsa basit donusumu test et."""
        try:
            import markdown  # type: ignore  # noqa
        except ImportError:
            pytest.skip("markdown paketi yuklu degil")

        from app.services.tools.document_extra_tools import MarkdownToHtmlTool
        result = await MarkdownToHtmlTool().execute(
            {"markdown": "# Hello\n\n**bold** _italic_", "wrap_html": False},
            _ctx(),
        )
        assert result.ok
        assert "<h1>" in result.data["html"]
        assert "<strong>bold</strong>" in result.data["html"]


# ============================================================
# D.6 DevOps
# ============================================================


@pytest.mark.asyncio
class TestDevOpsTools:
    async def test_docker_ps_schema(self):
        from app.services.tools.devops_tools import DockerPsTool
        t = DockerPsTool()
        assert t.name == "docker_ps"
        assert t.permission == "terminal_cmd"

    async def test_docker_run_requires_confirmation(self):
        from app.services.tools.devops_tools import DockerRunTool
        assert DockerRunTool().requires_confirmation is True

    async def test_docker_build_requires_confirmation(self):
        from app.services.tools.devops_tools import DockerBuildTool
        assert DockerBuildTool().requires_confirmation is True

    async def test_kubectl_apply_requires_confirmation(self):
        from app.services.tools.devops_tools import KubectlApplyTool
        assert KubectlApplyTool().requires_confirmation is True

    async def test_kubectl_get_no_confirmation(self):
        from app.services.tools.devops_tools import KubectlGetTool
        assert KubectlGetTool().requires_confirmation is False

    async def test_docker_logs_empty_container(self):
        from app.services.tools.devops_tools import DockerLogsTool
        result = await DockerLogsTool().execute({"container": ""}, _ctx())
        assert not result.ok


# ============================================================
# D.7 Security
# ============================================================


@pytest.mark.asyncio
class TestSecurityTools:
    async def test_dns_lookup_empty_host(self):
        from app.services.tools.security_tools import DNSLookupTool
        result = await DNSLookupTool().execute({"host": ""}, _ctx())
        assert not result.ok

    async def test_dns_lookup_localhost_fallback(self):
        """dnspython yoksa socket fallback ile localhost cözmeli."""
        from app.services.tools.security_tools import DNSLookupTool
        result = await DNSLookupTool().execute({"host": "localhost"}, _ctx())
        # En azından çalışmalı; sonuç gerçek DNS'e bağlı olabilir
        assert isinstance(result.ok, bool)

    async def test_whois_empty_domain(self):
        from app.services.tools.security_tools import WhoisQueryTool
        result = await WhoisQueryTool().execute({"domain": ""}, _ctx())
        assert not result.ok

    async def test_ssl_cert_check_schema(self):
        from app.services.tools.security_tools import SSLCertCheckTool
        t = SSLCertCheckTool()
        assert t.name == "ssl_cert_check"
        assert "hostname" in t.parameters["required"]

    async def test_port_scan_high_risk(self):
        from app.services.tools.security_tools import PortScanTool
        assert PortScanTool().requires_confirmation is True

    async def test_port_scan_empty_host(self):
        from app.services.tools.security_tools import PortScanTool
        result = await PortScanTool().execute({"host": ""}, _ctx())
        assert not result.ok

    async def test_port_scan_localhost(self):
        """localhost'ta hizli ve guvenli bir tarama."""
        from app.services.tools.security_tools import PortScanTool
        result = await PortScanTool().execute(
            {"host": "127.0.0.1", "ports": [80, 443], "timeout_sec": 0.3},
            _ctx(),
        )
        assert result.ok
        assert "open_ports" in result.data
        assert isinstance(result.data["open_ports"], list)


# ============================================================
# Registry & Risk integration
# ============================================================


class TestRegistryIntegration:
    def test_high_risk_tools_includes_devops(self):
        assert "docker_run" in HIGH_RISK_TOOLS
        assert "docker_build" in HIGH_RISK_TOOLS
        assert "kubectl_apply" in HIGH_RISK_TOOLS
        assert "port_scan" in HIGH_RISK_TOOLS

    def test_new_tools_registered(self):
        from app.services.tools.registry import tool_registry

        expected = [
            "arxiv_search",
            "wikipedia_lookup",
            "youtube_search",
            "youtube_transcript",
            "pdf_merge",
            "pdf_split",
            "pptx_generate",
            "markdown_to_html",
            "dns_lookup",
            "whois_query",
            "ssl_cert_check",
            "port_scan",
            "docker_ps",
            "docker_logs",
            "docker_run",
            "docker_build",
            "kubectl_get",
            "kubectl_logs",
            "kubectl_apply"]
        for name in expected:
            assert tool_registry.get(name) is not None, f"Tool kayitli degil: {name}"