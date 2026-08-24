import pytest
from app.services.chat_service import is_simple_conversational_query

def test_is_simple_conversational_query_simple_greetings():
    assert is_simple_conversational_query("merhaba") is True
    assert is_simple_conversational_query("selam") is True
    assert is_simple_conversational_query("nasılsın") is True
    assert is_simple_conversational_query("merhabalar, nasılsın?") is True
    assert is_simple_conversational_query("teşekkürler") is True
    assert is_simple_conversational_query("iyi akşamlar") is True

def test_is_simple_conversational_query_complex_queries():
    assert is_simple_conversational_query("dosya oku") is False
    assert is_simple_conversational_query("web ara") is False
    assert is_simple_conversational_query("kod yaz") is False
    assert is_simple_conversational_query("bana python kodu yaz") is False

def test_is_simple_conversational_query_urls_and_paths():
    assert is_simple_conversational_query("https://google.com adresine git") is False
    assert is_simple_conversational_query("c:/windows/system32 klasörünü aç") is False

def test_is_simple_conversational_query_markdown_code():
    assert is_simple_conversational_query("```python\nprint(1)\n```") is False
