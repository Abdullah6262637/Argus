import asyncio
import os
import sys

# Backend yolunu ekleyelim ki import app calissin
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.services.llm.factory import get_provider
from app.services.llm.base import ChatMessage

async def main():
    try:
        print("Testing 'local' provider (Ollama) ...")
        p = get_provider("local", "llama3.2", base_url="http://localhost:11434/v1")
        print("Provider:", p)
        res = await p.chat([ChatMessage(role="user", content="Merhaba!")])
        print("Response:", res.content)
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(main())
