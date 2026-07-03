import base64
import hashlib
import uuid
import socket
import urllib.request
import json
from typing import Dict, Any
from app.services.tools.base import BaseTool, ToolResult, ToolContext

class GetIPAddressTool(BaseTool):
    name = "get_ip_address"
    description = "Sistemin yerel (LAN) ve dış (public) IP adreslerini döndürür."
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {},
        "required": []
    }

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            # Local IP
            local_ip = "127.0.0.1"
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            try:
                # Doesn't need to connect, just gets socket info
                s.connect(('8.8.8.8', 80))
                local_ip = s.getsockname()[0]
            except Exception:
                pass
            finally:
                s.close()

            # Public IP using ipify (non-blocking simulation/simple request)
            public_ip = "Bilinmiyor"
            try:
                # Simple synchronous request in thread pool or simple timeout read
                req = urllib.request.Request("https://api.ipify.org?format=json", headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=3) as response:
                    res = json.loads(response.read().decode())
                    public_ip = res.get("ip", "Bilinmiyor")
            except Exception as e:
                public_ip = f"Hata ({str(e)})"

            return ToolResult(
                ok=True,
                output=f"Yerel IP (LAN): {local_ip}\nDış IP (Public): {public_ip}",
                data={"local_ip": local_ip, "public_ip": public_ip}
            )
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class Base64Tool(BaseTool):
    name = "base64_encode_decode"
    description = "Verilen metni Base64 formatına kodlar (encode) veya Base64 formatından çözer (decode)."
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "enum": ["encode", "decode"],
                "description": "Kodlama mı yoksa çözme mi yapılacağı."
            },
            "text": {
                "type": "string",
                "description": "İşleme alınacak metin."
            }
        },
        "required": ["action", "text"]
    }

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        action = args.get("action")
        text = args.get("text", "")
        try:
            if action == "encode":
                encoded = base64.b64encode(text.encode("utf-8")).decode("utf-8")
                return ToolResult(ok=True, output=encoded, data={"result": encoded})
            else:
                decoded = base64.b64decode(text.encode("utf-8")).decode("utf-8")
                return ToolResult(ok=True, output=decoded, data={"result": decoded})
        except Exception as e:
            return ToolResult(ok=False, error=f"Base64 işlemi başarısız: {str(e)}")


class HashGeneratorTool(BaseTool):
    name = "generate_hash"
    description = "Verilen metnin MD5, SHA-1 veya SHA-256 algoritmasıyla özetini (hash) hesaplar."
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "algorithm": {
                "type": "string",
                "enum": ["md5", "sha1", "sha256"],
                "description": "Kullanılacak hash algoritması."
            },
            "text": {
                "type": "string",
                "description": "Özeti hesaplanacak metin."
            }
        },
        "required": ["algorithm", "text"]
    }

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        algo = args.get("algorithm", "sha256").lower()
        text = args.get("text", "")
        try:
            h = hashlib.new(algo)
            h.update(text.encode("utf-8"))
            digest = h.hexdigest()
            return ToolResult(ok=True, output=digest, data={"hash": digest})
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class UUIDGeneratorTool(BaseTool):
    name = "generate_uuid"
    description = "Rastgele UUID v4 (benzersiz kimlik anahtarı) üretir."
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "count": {
                "type": "integer",
                "description": "Kaç adet UUID üretileceği (varsayılan: 1).",
                "default": 1
            }
        },
        "required": []
    }

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        count = args.get("count", 1)
        if count < 1:
            count = 1
        uuids = [str(uuid.uuid4()) for _ in range(count)]
        output = "\n".join(uuids)
        return ToolResult(ok=True, output=output, data={"uuids": uuids})


class TextStatsTool(BaseTool):
    name = "calculate_text_stats"
    description = "Metnin karakter sayısı, kelime sayısı, cümle sayısı ve tahmini okuma süresini hesaplar."
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "text": {
                "type": "string",
                "description": "Analiz edilecek metin."
            }
        },
        "required": ["text"]
    }

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        text = args.get("text", "")
        char_count = len(text)
        words = text.split()
        word_count = len(words)
        
        # Simple sentence count estimation
        sentences = [s for s in text.replace("!", ".").replace("?", ".").split(".") if s.strip()]
        sentence_count = len(sentences)

        # Average reading speed: 200 words per minute
        reading_time_min = round(word_count / 200, 1)
        if reading_time_min < 0.1 and word_count > 0:
            reading_time_min = 0.1

        output = (
            f"Karakter Sayısı: {char_count}\n"
            f"Kelime Sayısı: {word_count}\n"
            f"Cümle Sayısı: {sentence_count}\n"
            f"Tahmini Okuma Süresi: {reading_time_min} dakika"
        )
        return ToolResult(
            ok=True,
            output=output,
            data={
                "char_count": char_count,
                "word_count": word_count,
                "sentence_count": sentence_count,
                "reading_time_min": reading_time_min
            }
        )


class WeatherTool(BaseTool):
    name = "get_weather_forecast"
    description = "Belirtilen şehir için güncel hava durumu bilgilerini getirir."
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "city": {
                "type": "string",
                "description": "Hava durumu öğrenilecek şehir adı (örn. 'Istanbul', 'Ankara')."
            }
        },
        "required": ["city"]
    }

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        city = args.get("city", "").strip()
        if not city:
            return ToolResult(ok=False, error="Şehir ismi boş olamaz.")
        
        try:
            # Query wttr.in in JSON format for the city
            # Using format=j1 gives detailed JSON structure
            formatted_city = urllib.parse.quote(city)
            url = f"https://wttr.in/{formatted_city}?format=j1"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode("utf-8"))
                
                current = data.get("current_condition", [{}])[0]
                temp_c = current.get("temp_C", "Bilinmiyor")
                weather_desc = current.get("lang_tr", current.get("weatherDesc", [{}])[0].get("value", "Bilinmiyor"))
                if isinstance(weather_desc, list) and len(weather_desc) > 0:
                    weather_desc = weather_desc[0].get("value", "Bilinmiyor")
                
                humidity = current.get("humidity", "Bilinmiyor")
                wind_speed = current.get("windspeedKmph", "Bilinmiyor")
                feel_like = current.get("FeelsLikeC", "Bilinmiyor")
                
                output = (
                    f"Şehir: {city.capitalize()}\n"
                    f"Sıcaklık: {temp_c}°C (Hissedilen: {feel_like}°C)\n"
                    f"Durum: {weather_desc}\n"
                    f"Nem: %{humidity}\n"
                    f"Rüzgar Hızı: {wind_speed} km/h"
                )
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={
                        "city": city,
                        "temperature": temp_c,
                        "description": weather_desc,
                        "humidity": humidity,
                        "wind_speed": wind_speed
                    }
                )
        except Exception as e:
            # Fallback/simulated response if offline or API blocked
            return ToolResult(
                ok=True,
                output=f"Şehir: {city.capitalize()}\nSıcaklık: 18°C (wttr.in API bağlantı hatası sebebiyle simüle edildi)\nDurum: Parçalı Bulutlu\nNem: %60\nRüzgar: 12 km/h",
                data={"city": city, "simulated": True}
            )
