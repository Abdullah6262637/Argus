"""Sprint B.1: AgentManager CRUD + load + auto-encrypt testleri."""
from __future__ import annotations

from pathlib import Path

import pytest
import yaml

from app.services.agent_manager import AgentManager
from app.services.security import secrets as secret_store


@pytest.fixture
def temp_agents_yaml(tmp_path: Path) -> Path:
    """Test icin izole bir agents.yaml olustur."""
    yaml_path = tmp_path / "agents.yaml"
    yaml_path.write_text("agents: []\n", encoding="utf-8")
    return yaml_path


@pytest.fixture
def temp_souls(tmp_path: Path) -> Path:
    sd = tmp_path / "souls"
    sd.mkdir(parents=True, exist_ok=True)
    (sd / "test_soul.md").write_text("Sen bir test ajanisin.", encoding="utf-8")
    return sd


@pytest.fixture
def manager(temp_agents_yaml: Path, temp_souls: Path) -> AgentManager:
    m = AgentManager(config_path=str(temp_agents_yaml), souls_dir=str(temp_souls))
    m.load()
    return m


class TestAgentManagerCRUD:
    def test_load_empty_yaml(self, manager: AgentManager):
        assert manager.list_agents() == []
        assert manager.list_agents(include_inactive=True) == []

    def test_create_agent(self, manager: AgentManager):
        agent = manager.create_agent(
            name="Test Agent",
            role="Tester",
            description="A test agent",
            provider="openai",
            model="gpt-4o-mini",
            system_prompt="You are a tester",
            api_key="sk-test-12345")
        assert agent.id == "test-agent"
        assert agent.name == "Test Agent"
        assert agent.api_key == "sk-test-12345"
        assert manager.get("test-agent") is agent

    def test_create_unique_id(self, manager: AgentManager):
        a1 = manager.create_agent(name="Same Name")
        a2 = manager.create_agent(name="Same Name")
        assert a1.id != a2.id
        assert a2.id.startswith(a1.id)

    def test_create_with_turkish_name(self, manager: AgentManager):
        a = manager.create_agent(name="Geliştirici Şahin")
        # Turkce karakterler slugify edilmeli
        assert all(c.isalnum() or c == "-" for c in a.id)

    def test_update_agent(self, manager: AgentManager):
        manager.create_agent(name="Original", agent_id="orig", model="gpt-4o")
        updated = manager.update_agent("orig", name="Updated", temperature=0.9)
        assert updated.name == "Updated"
        assert updated.temperature == 0.9
        # Dokunulmayan alan korunmali
        assert updated.model == "gpt-4o"

    def test_update_clear_api_key(self, manager: AgentManager):
        manager.create_agent(name="With Key", agent_id="wk", api_key="sk-xxx")
        updated = manager.update_agent("wk", clear_api_key=True)
        assert updated.api_key is None

    def test_update_unknown_raises(self, manager: AgentManager):
        with pytest.raises(KeyError):
            manager.update_agent("nonexistent", name="X")

    def test_delete_agent(self, manager: AgentManager):
        manager.create_agent(name="Doomed", agent_id="doomed")
        manager.delete_agent("doomed")
        assert manager.get("doomed") is None

    def test_delete_unknown_raises(self, manager: AgentManager):
        with pytest.raises(KeyError):
            manager.delete_agent("ghost")

    def test_duplicate_agent(self, manager: AgentManager):
        original = manager.create_agent(
            name="Original",
            agent_id="orig",
            model="gpt-4o",
            api_key="sk-x")
        copy = manager.duplicate_agent("orig")
        assert copy.id != original.id
        assert copy.id.endswith("-kopya")
        assert copy.name == "Original (Kopya)"
        assert copy.model == "gpt-4o"
        assert copy.api_key == "sk-x"

    def test_export_without_secrets(self, manager: AgentManager):
        manager.create_agent(name="Sec", agent_id="sec", api_key="sk-secret")
        exp = manager.export_agent("sec", include_secrets=False)
        assert "agent" in exp
        assert exp["agent"].get("api_key") is None or "api_key" not in exp["agent"]

    def test_export_with_secrets(self, manager: AgentManager):
        manager.create_agent(name="Sec", agent_id="sec2", api_key="sk-secret")
        exp = manager.export_agent("sec2", include_secrets=True)
        assert exp["agent"].get("api_key") is not None

    def test_list_filters_inactive(self, manager: AgentManager):
        manager.create_agent(name="Active", agent_id="a1", is_active=True)
        manager.create_agent(name="Inactive", agent_id="a2", is_active=False)
        active_only = manager.list_agents(include_inactive=False)
        assert len(active_only) == 1
        assert active_only[0].id == "a1"
        all_agents = manager.list_agents(include_inactive=True)
        assert len(all_agents) == 2


class TestAgentManagerPersistence:
    def test_save_and_reload(self, temp_agents_yaml: Path, temp_souls: Path):
        m1 = AgentManager(config_path=str(temp_agents_yaml), souls_dir=str(temp_souls))
        m1.load()
        m1.create_agent(name="Persisted", agent_id="p1", api_key="sk-saved")

        # Yeni instance olustur ve yukle
        m2 = AgentManager(config_path=str(temp_agents_yaml), souls_dir=str(temp_souls))
        m2.load()
        a = m2.get("p1")
        assert a is not None
        assert a.name == "Persisted"
        # api_key decrypt edilmis olarak gelmeli
        assert a.api_key == "sk-saved"

    def test_yaml_stores_encrypted_key(self, temp_agents_yaml: Path, temp_souls: Path):
        """API key dosyaya yazildiginda enc:: prefix'iyle olmali."""
        m = AgentManager(config_path=str(temp_agents_yaml), souls_dir=str(temp_souls))
        m.load()
        m.create_agent(name="Sec", agent_id="ss", api_key="sk-plain-key")

        raw = yaml.safe_load(temp_agents_yaml.read_text(encoding="utf-8"))
        agent_yaml = raw["agents"][0]
        # cryptography kuruluysa enc:: prefix olmali; yoksa plaintext
        if secret_store._get_fernet() is not None:
            assert agent_yaml["api_key"].startswith("enc::")


class TestAgentManagerSoulLoading:
    def test_load_soul_from_file(self, temp_agents_yaml: Path, temp_souls: Path):
        # YAML'a soul referansli ajan yaz
        temp_agents_yaml.write_text(
            "agents:\n"
            "  - id: souled\n"
            "    name: Souled\n"
            "    provider: openai\n"
            "    model: gpt-4o\n"
            "    soul: test_soul.md\n",
            encoding="utf-8",
        )
        m = AgentManager(config_path=str(temp_agents_yaml), souls_dir=str(temp_souls))
        m.load()
        a = m.get("souled")
        assert a is not None
        assert "test ajanisin" in a.system_prompt
        assert a.soul_file == "test_soul.md"

    def test_inline_prompt_overrides_soul(self, temp_agents_yaml: Path, temp_souls: Path):
        temp_agents_yaml.write_text(
            "agents:\n"
            "  - id: inline\n"
            "    name: Inline\n"
            "    provider: openai\n"
            "    model: gpt-4o\n"
            "    system_prompt: 'INLINE PROMPT'\n",
            encoding="utf-8",
        )
        m = AgentManager(config_path=str(temp_agents_yaml), souls_dir=str(temp_souls))
        m.load()
        a = m.get("inline")
        assert a is not None
        assert a.system_prompt == "INLINE PROMPT"


class TestAgentManagerAutoEncrypt:
    def test_plaintext_key_auto_encrypted_on_load(
        self,
        temp_agents_yaml: Path,
        temp_souls: Path,
    ):
        """Yaml'a plaintext api_key yazilmissa load() sonrasi sifrelenir."""
        temp_agents_yaml.write_text(
            "agents:\n"
            "  - id: plain\n"
            "    name: Plain\n"
            "    provider: openai\n"
            "    model: gpt-4o\n"
            "    api_key: sk-plaintext-key-123\n",
            encoding="utf-8",
        )
        m = AgentManager(config_path=str(temp_agents_yaml), souls_dir=str(temp_souls))
        m.load()  # auto-encrypt tetiklenir

        # Sadece cryptography varsa test anlamli
        if secret_store._get_fernet() is None:
            pytest.skip("cryptography yuklu degil")

        # Yeniden oku — plaintext kalmamali
        raw = yaml.safe_load(temp_agents_yaml.read_text(encoding="utf-8"))
        api_key_in_yaml = raw["agents"][0]["api_key"]
        assert api_key_in_yaml.startswith("enc::")
        # Ama bellekteki plain hali korunur
        agent = m.get("plain")
        assert agent is not None
        assert agent.api_key == "sk-plaintext-key-123"