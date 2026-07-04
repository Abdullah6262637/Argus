# 08 — MCP (Model Context Protocol) Entegrasyonu

## MCP Nedir?

**Model Context Protocol (MCP)**, Anthropic tarafından geliştirilen açık bir standarttır. LLM'lerin harici araçlara, veritabanlarına ve servislere standart bir protokol üzerinden erişmesini sağlar.

Argus'ta MCP desteği, harici araç sunucularının ajan araç kataloğuna otomatik olarak eklenmesini sağlar. Kendi MCP sunucunuzu yazabilir veya topluluk tarafından geliştirilen hazır sunucuları kullanabilirsiniz.

---

## MCP Sunucu Türleri

### Stdio Transport
Sunucu, alt işlem olarak başlatılır ve stdin/stdout üzerinden iletişim kurar. En yaygın yöntem.

```json
{
  "name": "filesystem",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
}
```

### SSE Transport
Sunucu zaten çalışıyor ve HTTP SSE endpoint'i sunar.

```json
{
  "name": "my-custom-server",
  "transport": "sse",
  "url": "http://localhost:3001/sse"
}
```

---

## MCP Sunucu Ekleme

### Arayüz Üzerinden

1. **Ayarlar** → **MCP** sekmesine gidin
2. **"+ MCP Sunucu Ekle"** butonuna tıklayın
3. Sunucu adı, transport türü ve komut/URL girin
4. **"Bağlan"** — Sunucu başlatılır ve araçlar yüklenir

### API Üzerinden

```bash
POST /api/mcp/servers
{
  "name": "filesystem",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"],
  "env": {}
}
```

---

## Hazır MCP Sunucuları

### Resmi Anthropic Sunucuları

```bash
# Dosya sistemi erişimi
npx -y @modelcontextprotocol/server-filesystem /path/to/dir

# GitHub erişimi
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_... \
npx -y @modelcontextprotocol/server-github

# Google Drive
npx -y @modelcontextprotocol/server-gdrive

# PostgreSQL
DATABASE_URL=postgresql://... \
npx -y @modelcontextprotocol/server-postgres

# Slack
SLACK_BOT_TOKEN=xoxb-... \
npx -y @modelcontextprotocol/server-slack

# Brave Search
BRAVE_API_KEY=... \
npx -y @modelcontextprotocol/server-brave-search

# Puppeteer (tarayıcı kontrolü)
npx -y @modelcontextprotocol/server-puppeteer
```

### Topluluk Sunucuları

```bash
# Notion
npx -y notion-mcp-server

# Linear
npx -y linear-mcp-server

# Jira
npx -y jira-mcp-server
```

---

## MCP Sunucu Yapılandırma Örnekleri

### Örnek 1 — Dosya Sistemi

```json
{
  "name": "docs-filesystem",
  "transport": "stdio",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "C:\\Users\\Kullanici\\Belgeler"
  ]
}
```

Bu sunucu, ajanlara şu araçları sağlar:
- `read_file` — Dosya okuma
- `write_file` — Dosya yazma
- `list_directory` — Dizin listeleme
- `create_directory` — Klasör oluşturma
- `move_file` — Dosya taşıma

### Örnek 2 — GitHub Entegrasyonu

```json
{
  "name": "github",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_abc123..."
  }
}
```

Bu sunucu, ajanlara şu araçları sağlar:
- `search_repositories` — Repo arama
- `get_file_contents` — Dosya içeriği
- `create_or_update_file` — Dosya güncelleme
- `create_pull_request` — PR oluşturma
- `list_issues` — Issue listesi
- `create_issue` — Issue oluşturma

### Örnek 3 — Özel SSE Sunucusu

```json
{
  "name": "internal-api",
  "transport": "sse",
  "url": "http://internal.company.com:8080/mcp/sse",
  "headers": {
    "Authorization": "Bearer my-token"
  }
}
```

---

## MCP ile Ajan Yapılandırması

Ajan formunda **Adım 6 — Plugins ve MCP** bölümünde MCP sunucularını etkinleştirebilirsiniz.

Seçilen MCP sunucusunun sağladığı araçlar, ajanın standart araç listesine eklenir. LLM, bu araçları diğer araçlarla aynı şekilde kullanabilir.

---

## Kendi MCP Sunucunuzu Yazma

### TypeScript ile (Önerilen)

```bash
npm install @modelcontextprotocol/sdk
```

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "my-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Araç tanımla
server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "my_tool",
      description: "Aracın ne yaptığını açıkla",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Arama sorgusu" }
        },
        required: ["query"]
      }
    }
  ]
}));

// Araç çağrısını işle
server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "my_tool") {
    const { query } = request.params.arguments as { query: string };
    return {
      content: [{ type: "text", text: `Sonuç: ${query}` }]
    };
  }
});

// Başlat
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Python ile

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types

app = Server("my-python-server")

@app.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="my_python_tool",
            description="Python ile yazılmış araç",
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {"type": "string"}
                },
                "required": ["text"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if name == "my_python_tool":
        result = arguments["text"].upper()
        return [types.TextContent(type="text", text=result)]

async def main():
    async with stdio_server() as streams:
        await app.run(*streams, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

## MCP Bağlantı Sorunları

### Sunucu Başlamıyor

```bash
# npx önbelleğini temizle
npx clear-npx-cache

# Paketi global yükle ve tekrar dene
npm install -g @modelcontextprotocol/server-filesystem
```

### "Tool not found" Hatası

Sunucu bağlı olduğunda araçların listelendiğini doğrulayın:
```bash
GET /api/mcp/servers/{name}/tools
```

### Bağlantı Zaman Aşımı

```env
# Backend .env
MCP_CONNECT_TIMEOUT=30  # saniye
```

---

## API Referansı

```bash
# Sunucu listesi
GET /api/mcp/servers

# Sunucu ekle
POST /api/mcp/servers
Body: {"name": "...", "transport": "stdio", "command": "..."}

# Sunucu sil
DELETE /api/mcp/servers/{name}

# Sunucunun araçları
GET /api/mcp/servers/{name}/tools

# Yeniden bağlan
POST /api/mcp/servers/{name}/reconnect
```
