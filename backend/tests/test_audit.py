"""Sprint B.1: AuditChain HMAC zincir bütünlüğü testleri."""
from __future__ import annotations

import pytest

from app.services.audit import AuditChain


@pytest.mark.asyncio
class TestAuditChain:
    async def test_append_creates_entry(self):
        """Yeni bir kayit eklenince DB'ye yazilir ve seq artar."""
        chain = AuditChain()
        # Yeni instance — singleton'la cakismasin
        entry = await chain.append(
            event_type="test_event",
            payload={"foo": "bar"},
            agent_id="test-agent",
        )
        assert entry.seq >= 1
        assert entry.event_type == "test_event"
        assert "foo" in entry.payload_json
        assert entry.hmac_sig
        assert entry.agent_id == "test-agent"

    async def test_chain_links_prev_hash(self):
        """Ardisik kayitlarda prev_hash bir oncekinin hmac_sig'i olmali."""
        chain = AuditChain()
        e1 = await chain.append("e1", {"v": 1})
        e2 = await chain.append("e2", {"v": 2})
        assert e2.prev_hash == e1.hmac_sig
        assert e2.seq == e1.seq + 1

    async def test_verify_chain_returns_true_for_valid(self):
        """Hic dokunulmamis bir zincir verify edildiginde true donmeli."""
        chain = AuditChain()
        await chain.append("ev1", {"x": 1})
        await chain.append("ev2", {"x": 2})
        await chain.append("ev3", {"x": 3})

        ok, errors = await chain.verify_chain()
        assert ok is True
        assert errors == []

    async def test_compute_hmac_deterministic(self):
        """Ayni input icin hmac stabil olmali."""
        chain = AuditChain()
        sig1 = chain._compute_hmac(b"secret", 1, "", '{"a":1}')
        sig2 = chain._compute_hmac(b"secret", 1, "", '{"a":1}')
        assert sig1 == sig2

    async def test_compute_hmac_changes_with_input(self):
        chain = AuditChain()
        sig1 = chain._compute_hmac(b"secret", 1, "", '{"a":1}')
        sig2 = chain._compute_hmac(b"secret", 2, "", '{"a":1}')
        sig3 = chain._compute_hmac(b"secret", 1, "prevHash", '{"a":1}')
        sig4 = chain._compute_hmac(b"secret", 1, "", '{"a":2}')
        sig5 = chain._compute_hmac(b"different", 1, "", '{"a":1}')
        # Hepsi farkli olmali
        assert len({sig1, sig2, sig3, sig4, sig5}) == 5

    async def test_payload_json_sorted_keys(self):
        """Payload JSON sort_keys=True ile yazilir; ayni dict ayni JSON uretir."""
        chain = AuditChain()
        e1 = await chain.append("ev", {"b": 2, "a": 1})
        e2 = await chain.append("ev", {"a": 1, "b": 2})
        # Iki kaydin payload_json'lari ayni olmali (sort_keys=True sayesinde)
        assert e1.payload_json == e2.payload_json