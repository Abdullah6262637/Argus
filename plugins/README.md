# Plugins (Drop-in Tools)

Bu klasore `*.py` dosyalari koyarak yeni tool'lar ekleyebilirsiniz.

Her dosyada `BaseTool` subclass'i olusturun:

```python
# plugins/hello_tool.py
from app.services.tools.base import BaseTool, ToolContext, ToolResult


class HelloTool(BaseTool):
    name = "hello"
    description = "Bir kullaniciyi selamlar."
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "Isim"}
        },
        "required": ["name"]}

    async def execute(self, args: dict, context: ToolContext) -> ToolResult:
        name = args.get("name", "dunya")
        return ToolResult(ok=True, output=f"Merhaba, {name}!")
```

Backend yeniden baslatildiginda otomatik olarak yuklenir ve tool olarak kullanilabilir hale gelir.

## Notlar
- Dosya adi `_` ile baslarsa atlanir.
- Sadece `BaseTool` subclass'lari (kendi modulunde tanimli olanlar) kayit edilir.
- Hatali plugin'ler log'da gorunur, uygulama crash olmaz.