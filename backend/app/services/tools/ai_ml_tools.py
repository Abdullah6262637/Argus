"""AI & ML Tools - FAZ 1
Yapay zeka ve makine öğrenmesi işlemleri için tool'lar.
HuggingFace, OpenAI, Anthropic ve diğer AI servisleri entegrasyonu.
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from app.services.tools.base import BaseTool, PermissionKey, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class HuggingfaceInferenceTool(BaseTool):
    """HuggingFace Inference API ile model çalıştırma."""
    
    name = "huggingface_inference"
    description = (
        "HuggingFace Inference API kullanarak model inference çalıştırır. "
        "Text generation, classification, translation gibi görevler için kullanılabilir."
    )
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "model_id": {
                "type": "string",
                "description": "HuggingFace model ID (örn: 'gpt2', 'bert-base-uncased')"
            },
            "inputs": {
                "type": "string",
                "description": "Model'e gönderilecek input text"
            },
            "task": {
                "type": "string",
                "description": "Görev tipi: text-generation, text-classification, translation, summarization",
                "enum": ["text-generation", "text-classification", "translation", "summarization", "question-answering"]
            },
            "parameters": {
                "type": "object",
                "description": "Opsiyonel model parametreleri (max_length, temperature, vb.)",
                "properties": {
                    "max_length": {"type": "integer"},
                    "temperature": {"type": "number"},
                    "top_p": {"type": "number"}
                }
            }
        },
        "required": ["model_id", "inputs", "task"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            model_id = args.get("model_id")
            inputs = args.get("inputs")
            task = args.get("task")
            params = args.get("parameters", {})
            
            if not model_id or not inputs or not task:
                return ToolResult(ok=False, error="model_id, inputs ve task parametreleri gerekli")
            
            # HuggingFace API çağrısı
            try:
                import httpx
                import os
                
                api_token = os.getenv("HUGGINGFACE_API_TOKEN")
                if not api_token:
                    return ToolResult(
                        ok=False,
                        error="HUGGINGFACE_API_TOKEN environment variable tanımlı değil"
                    )
                
                api_url = f"https://api-inference.huggingface.co/models/{model_id}"
                headers = {"Authorization": f"Bearer {api_token}"}
                
                payload = {"inputs": inputs}
                if params:
                    payload["parameters"] = params
                
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(api_url, headers=headers, json=payload)
                    response.raise_for_status()
                    result = response.json()
                
                # Sonucu formatla
                if isinstance(result, list) and len(result) > 0:
                    if task == "text-generation":
                        output_text = result[0].get("generated_text", str(result))
                    elif task == "text-classification":
                        output_text = f"Label: {result[0].get('label')}, Score: {result[0].get('score'):.4f}"
                    else:
                        output_text = str(result[0])
                else:
                    output_text = str(result)
                
                return ToolResult(
                    ok=True,
                    output=f"Model: {model_id}\nTask: {task}\n\nSonuç:\n{output_text}",
                    data={"model_id": model_id, "task": task, "result": result}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="httpx paketi yüklü değil: pip install httpx")
            except httpx.HTTPStatusError as e:
                return ToolResult(ok=False, error=f"HuggingFace API hatası: {e.response.status_code} - {e.response.text}")
            except Exception as e:
                return ToolResult(ok=False, error=f"API çağrısı hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("HuggingFace inference hatası")
            return ToolResult(ok=False, error=str(e))


class OpenAIEmbeddingTool(BaseTool):
    """OpenAI Embedding API ile metin embedding'i oluşturma."""
    
    name = "openai_embedding"
    description = (
        "OpenAI Embedding API kullanarak metin için vector embedding oluşturur. "
        "Semantic search, clustering ve similarity hesaplamaları için kullanılır."
    )
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "text": {
                "type": "string",
                "description": "Embedding oluşturulacak metin"
            },
            "model": {
                "type": "string",
                "description": "Embedding modeli (varsayılan: text-embedding-3-small)",
                "enum": ["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"]
            }
        },
        "required": ["text"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            text = args.get("text")
            model = args.get("model", "text-embedding-3-small")
            
            if not text:
                return ToolResult(ok=False, error="text parametresi gerekli")
            
            try:
                from openai import AsyncOpenAI
                import os
                
                api_key = os.getenv("OPENAI_API_KEY")
                if not api_key:
                    return ToolResult(ok=False, error="OPENAI_API_KEY environment variable tanımlı değil")
                
                client = AsyncOpenAI(api_key=api_key)
                
                response = await client.embeddings.create(
                    model=model,
                    input=text
                )
                
                embedding = response.data[0].embedding
                dimensions = len(embedding)
                
                # İlk 5 ve son 5 değeri göster
                preview = f"[{', '.join(map(str, embedding[:5]))} ... {', '.join(map(str, embedding[-5:]))}]"
                
                return ToolResult(
                    ok=True,
                    output=f"Embedding oluşturuldu\nModel: {model}\nBoyut: {dimensions}\nÖnizleme: {preview}",
                    data={
                        "model": model,
                        "dimensions": dimensions,
                        "embedding": embedding,
                        "usage": {
                            "prompt_tokens": response.usage.prompt_tokens,
                            "total_tokens": response.usage.total_tokens
                        }
                    }
                )
                
            except ImportError:
                return ToolResult(ok=False, error="openai paketi yüklü değil: pip install openai")
            except Exception as e:
                return ToolResult(ok=False, error=f"OpenAI API hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("OpenAI embedding hatası")
            return ToolResult(ok=False, error=str(e))


class OpenAIModerationTool(BaseTool):
    """OpenAI Moderation API ile içerik moderasyonu."""
    
    name = "openai_moderation"
    description = (
        "OpenAI Moderation API kullanarak metin içeriğini analiz eder. "
        "Zararlı, tehlikeli veya uygunsuz içerik tespiti yapar."
    )
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "text": {
                "type": "string",
                "description": "Moderasyon yapılacak metin"
            }
        },
        "required": ["text"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            text = args.get("text")
            
            if not text:
                return ToolResult(ok=False, error="text parametresi gerekli")
            
            try:
                from openai import AsyncOpenAI
                import os
                
                api_key = os.getenv("OPENAI_API_KEY")
                if not api_key:
                    return ToolResult(ok=False, error="OPENAI_API_KEY environment variable tanımlı değil")
                
                client = AsyncOpenAI(api_key=api_key)
                
                response = await client.moderations.create(input=text)
                result = response.results[0]
                
                # Kategorileri analiz et
                flagged_categories = []
                category_scores = []
                
                for category, flagged in result.categories.model_dump().items():
                    score = getattr(result.category_scores, category)
                    category_scores.append(f"{category}: {score:.4f}")
                    if flagged:
                        flagged_categories.append(category)
                
                if result.flagged:
                    status = "⚠️ UYGUNSUZ İÇERİK TESPİT EDİLDİ"
                    flagged_text = f"\nİhlal edilen kategoriler: {', '.join(flagged_categories)}"
                else:
                    status = "✅ İçerik uygun"
                    flagged_text = ""
                
                output = f"{status}{flagged_text}\n\nKategori skorları:\n" + "\n".join(category_scores)
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={
                        "flagged": result.flagged,
                        "categories": result.categories.model_dump(),
                        "category_scores": result.category_scores.model_dump(),
                        "flagged_categories": flagged_categories
                    }
                )
                
            except ImportError:
                return ToolResult(ok=False, error="openai paketi yüklü değil: pip install openai")
            except Exception as e:
                return ToolResult(ok=False, error=f"OpenAI API hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("OpenAI moderation hatası")
            return ToolResult(ok=False, error=str(e))


class SentimentAnalysisTool(BaseTool):
    """Metin duygu analizi (sentiment analysis)."""
    
    name = "sentiment_analysis"
    description = (
        "Verilen metnin duygusal tonunu analiz eder (pozitif, negatif, nötr). "
        "Müşteri geri bildirimleri, sosyal medya analizi için kullanılır."
    )
    permission: PermissionKey = "none"
    
    parameters = {
        "type": "object",
        "properties": {
            "text": {
                "type": "string",
                "description": "Analiz edilecek metin"
            },
            "language": {
                "type": "string",
                "description": "Metin dili (varsayılan: auto-detect)",
                "enum": ["auto", "en", "tr", "es", "fr", "de"]
            }
        },
        "required": ["text"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            text = args.get("text")
            language = args.get("language", "auto")
            
            if not text:
                return ToolResult(ok=False, error="text parametresi gerekli")
            
            try:
                from textblob import TextBlob
                
                # TextBlob ile basit sentiment analizi
                blob = TextBlob(text)
                polarity = blob.sentiment.polarity  # -1 (negatif) ile +1 (pozitif) arası
                subjectivity = blob.sentiment.subjectivity  # 0 (objektif) ile 1 (subjektif) arası
                
                # Sentiment kategorisi belirle
                if polarity > 0.1:
                    sentiment = "Pozitif 😊"
                elif polarity < -0.1:
                    sentiment = "Negatif 😞"
                else:
                    sentiment = "Nötr 😐"
                
                # Subjektiflik kategorisi
                if subjectivity > 0.6:
                    subj_text = "Yüksek subjektiflik (kişisel görüş)"
                elif subjectivity > 0.3:
                    subj_text = "Orta subjektiflik"
                else:
                    subj_text = "Düşük subjektiflik (objektif)"
                
                output = f"""Duygu Analizi Sonucu:
                
Sentiment: {sentiment}
Polarity Skoru: {polarity:.3f} (-1: negatif, +1: pozitif)
Subjektiflik: {subjectivity:.3f} (0: objektif, 1: subjektif)
{subj_text}

Analiz edilen metin uzunluğu: {len(text)} karakter
"""
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={
                        "sentiment": sentiment,
                        "polarity": polarity,
                        "subjectivity": subjectivity,
                        "text_length": len(text)
                    }
                )
                
            except ImportError:
                return ToolResult(
                    ok=False,
                    error="textblob paketi yüklü değil: pip install textblob && python -m textblob.download_corpora"
                )
            except Exception as e:
                return ToolResult(ok=False, error=f"Analiz hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Sentiment analysis hatası")
            return ToolResult(ok=False, error=str(e))


class TextSummarizationTool(BaseTool):
    """Metin özetleme (text summarization)."""
    
    name = "text_summarization"
    description = (
        "Uzun metinleri özetler. Makale, rapor, doküman özetleme için kullanılır. "
        "Extractive (cümle seçimi) veya abstractive (yeniden yazma) yöntemler kullanılabilir."
    )
    permission: PermissionKey = "none"
    
    parameters = {
        "type": "object",
        "properties": {
            "text": {
                "type": "string",
                "description": "Özetlenecek metin"
            },
            "max_sentences": {
                "type": "integer",
                "description": "Özetteki maksimum cümle sayısı (varsayılan: 3)",
                "minimum": 1,
                "maximum": 10
            },
            "method": {
                "type": "string",
                "description": "Özetleme yöntemi",
                "enum": ["extractive", "abstractive"]
            }
        },
        "required": ["text"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            text = args.get("text")
            max_sentences = args.get("max_sentences", 3)
            method = args.get("method", "extractive")
            
            if not text:
                return ToolResult(ok=False, error="text parametresi gerekli")
            
            if len(text) < 100:
                return ToolResult(ok=False, error="Metin çok kısa, en az 100 karakter gerekli")
            
            try:
                if method == "extractive":
                    # Basit extractive özetleme (TextRank benzeri)
                    from textblob import TextBlob
                    
                    blob = TextBlob(text)
                    sentences = blob.sentences
                    
                    if len(sentences) <= max_sentences:
                        summary = text
                    else:
                        # Basit skorlama: cümle uzunluğu ve kelime çeşitliliği
                        scored_sentences = []
                        for sent in sentences:
                            score = len(set(sent.words)) / max(len(sent.words), 1)
                            scored_sentences.append((score, str(sent)))
                        
                        # En yüksek skorlu cümleleri seç
                        scored_sentences.sort(reverse=True)
                        top_sentences = [sent for _, sent in scored_sentences[:max_sentences]]
                        
                        # Orijinal sırayı koru
                        summary_sentences = []
                        for sent in sentences:
                            if str(sent) in top_sentences:
                                summary_sentences.append(str(sent))
                        
                        summary = " ".join(summary_sentences)
                    
                    compression_ratio = len(summary) / len(text)
                    
                    output = f"""Metin Özeti (Extractive):

{summary}

---
Orijinal uzunluk: {len(text)} karakter
Özet uzunluk: {len(summary)} karakter
Sıkıştırma oranı: {compression_ratio:.1%}
Cümle sayısı: {len(summary_sentences) if 'summary_sentences' in locals() else len(blob.sentences)}
"""
                    
                    return ToolResult(
                        ok=True,
                        output=output,
                        data={
                            "summary": summary,
                            "original_length": len(text),
                            "summary_length": len(summary),
                            "compression_ratio": compression_ratio,
                            "method": "extractive"
                        }
                    )
                    
                else:  # abstractive
                    return ToolResult(
                        ok=False,
                        error="Abstractive özetleme için LLM API kullanılmalı (openai_embedding veya huggingface_inference)"
                    )
                
            except ImportError:
                return ToolResult(
                    ok=False,
                    error="textblob paketi yüklü değil: pip install textblob && python -m textblob.download_corpora"
                )
            except Exception as e:
                return ToolResult(ok=False, error=f"Özetleme hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Text summarization hatası")
            return ToolResult(ok=False, error=str(e))


class TextClassificationTool(BaseTool):
    """Metin sınıflandırma (text classification)."""
    
    name = "text_classification"
    description = (
        "Metni önceden tanımlanmış kategorilere sınıflandırır. "
        "Spam tespiti, konu sınıflandırma için kullanılır."
    )
    permission: PermissionKey = "none"
    
    parameters = {
        "type": "object",
        "properties": {
            "text": {
                "type": "string",
                "description": "Sınıflandırılacak metin"
            },
            "categories": {
                "type": "array",
                "description": "Olası kategoriler listesi",
                "items": {"type": "string"},
                "minItems": 2
            }
        },
        "required": ["text", "categories"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            text = args.get("text")
            categories = args.get("categories", [])
            
            if not text or len(categories) < 2:
                return ToolResult(ok=False, error="text ve en az 2 kategori gerekli")
            
            # Basit keyword-based sınıflandırma
            text_lower = text.lower()
            scores = {}
            
            for category in categories:
                category_lower = category.lower()
                score = 0.0
                if category_lower in text_lower:
                    score += 0.5
                category_words = set(category_lower.split())
                text_words = set(text_lower.split())
                common_words = category_words & text_words
                if category_words:
                    score += len(common_words) / len(category_words) * 0.5
                scores[category] = score
            
            best_category = max(scores, key=scores.get) if scores else categories[0]
            confidence = scores.get(best_category, 0.0)
            
            sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
            score_text = "\n".join([f"  {cat}: {score:.2f}" for cat, score in sorted_scores])
            
            output = f"""Tahmin: {best_category} (güven: {confidence:.2f})

Skorlar:
{score_text}"""
            
            return ToolResult(ok=True, output=output, data={"predicted_category": best_category, "confidence": confidence, "all_scores": scores})
                
        except Exception as e:
            logger.exception("Text classification hatası")
            return ToolResult(ok=False, error=str(e))


class CodeGenerationTool(BaseTool):
    """AI ile kod üretimi."""
    
    name = "code_generation"
    description = "Doğal dil açıklamasından kod üretir. Python, JavaScript, SQL vb."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "description": {
                "type": "string",
                "description": "Üretilecek kodun açıklaması"
            },
            "language": {
                "type": "string",
                "description": "Programlama dili",
                "enum": ["python", "javascript", "typescript", "sql"]
            }
        },
        "required": ["description", "language"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            description = args.get("description")
            language = args.get("language")
            
            if not description or not language:
                return ToolResult(ok=False, error="description ve language gerekli")
            
            output = f"""Kod Üretimi: {language}

Açıklama: {description}

⚠️ Bu tool LLM API gerektirir. Lütfen huggingface_inference kullanın:
- Model: "bigcode/starcoder"
- Input: "{description} in {language}"
"""
            
            return ToolResult(ok=True, output=output, data={"description": description, "language": language})
                
        except Exception as e:
            logger.exception("Code generation hatası")
            return ToolResult(ok=False, error=str(e))


class QuestionAnsweringTool(BaseTool):
    """Soru-cevap sistemi."""
    name = "question_answering"
    description = "Verilen bağlam içinde soruya cevap bulur."
    permission: PermissionKey = "none"
    parameters = {
        "type": "object",
        "properties": {
            "question": {"type": "string", "description": "Soru"},
            "context": {"type": "string", "description": "Bağlam metni"}
        },
        "required": ["question", "context"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            question = args.get("question")
            ctx = args.get("context")
            if not question or not ctx:
                return ToolResult(ok=False, error="question ve context gerekli")
            output = f"Soru: {question}\n\n⚠️ LLM API gerektirir. huggingface_inference kullanın:\n- Task: question-answering\n- Input: question + context"
            return ToolResult(ok=True, output=output, data={"question": question})
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class ParaphraseTextTool(BaseTool):
    """Metni yeniden ifade et."""
    name = "paraphrase_text"
    description = "Metni farklı kelimelerle yeniden yazar."
    permission: PermissionKey = "none"
    parameters = {
        "type": "object",
        "properties": {
            "text": {"type": "string", "description": "Yeniden ifade edilecek metin"}
        },
        "required": ["text"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            text = args.get("text")
            if not text:
                return ToolResult(ok=False, error="text gerekli")
            output = f"Orijinal: {text}\n\n⚠️ LLM API gerektirir."
            return ToolResult(ok=True, output=output, data={"original": text})
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class CodeExplanationTool(BaseTool):
    """Kod açıklama."""
    name = "code_explanation"
    description = "Verilen kodu açıklar."
    permission: PermissionKey = "none"
    parameters = {
        "type": "object",
        "properties": {
            "code": {"type": "string", "description": "Açıklanacak kod"},
            "language": {"type": "string", "description": "Programlama dili"}
        },
        "required": ["code"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            code = args.get("code")
            if not code:
                return ToolResult(ok=False, error="code gerekli")
            output = f"Kod:\n{code}\n\n⚠️ LLM API gerektirir."
            return ToolResult(ok=True, output=output, data={"code": code})
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class BugDetectionTool(BaseTool):
    """Bug tespiti."""
    name = "bug_detection"
    description = "Koddaki potansiyel hataları tespit eder."
    permission: PermissionKey = "none"
    parameters = {
        "type": "object",
        "properties": {
            "code": {"type": "string", "description": "Analiz edilecek kod"}
        },
        "required": ["code"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            code = args.get("code")
            if not code:
                return ToolResult(ok=False, error="code gerekli")
            output = f"Kod analizi:\n{code[:200]}...\n\n⚠️ LLM API gerektirir."
            return ToolResult(ok=True, output=output, data={"code_length": len(code)})
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class TestGenerationTool(BaseTool):
    """Test kodu üretimi."""
    name = "test_generation"
    description = "Verilen kod için test kodu üretir."
    permission: PermissionKey = "none"
    parameters = {
        "type": "object",
        "properties": {
            "code": {"type": "string", "description": "Test edilecek kod"},
            "framework": {"type": "string", "description": "Test framework (pytest, jest, junit)"}
        },
        "required": ["code"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            code = args.get("code")
            if not code:
                return ToolResult(ok=False, error="code gerekli")
            output = f"Test üretimi için:\n{code[:200]}...\n\n⚠️ LLM API gerektirir."
            return ToolResult(ok=True, output=output, data={"code_length": len(code)})
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class DocumentationGenerateTool(BaseTool):
    """Dokümantasyon üretimi."""
    name = "documentation_generate"
    description = "Kod için dokümantasyon üretir."
    permission: PermissionKey = "none"
    parameters = {
        "type": "object",
        "properties": {
            "code": {"type": "string", "description": "Dokümante edilecek kod"}
        },
        "required": ["code"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            code = args.get("code")
            if not code:
                return ToolResult(ok=False, error="code gerekli")
            output = f"Dokümantasyon üretimi:\n{code[:200]}...\n\n⚠️ LLM API gerektirir."
            return ToolResult(ok=True, output=output, data={"code_length": len(code)})
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class SQLQueryGenerateTool(BaseTool):
    """SQL sorgusu üretimi."""
    name = "sql_query_generate"
    description = "Doğal dilden SQL sorgusu üretir."
    permission: PermissionKey = "none"
    parameters = {
        "type": "object",
        "properties": {
            "description": {"type": "string", "description": "SQL sorgusu açıklaması"},
            "schema": {"type": "string", "description": "Veritabanı şeması (opsiyonel)"}
        },
        "required": ["description"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            desc = args.get("description")
            if not desc:
                return ToolResult(ok=False, error="description gerekli")
            output = f"SQL üretimi: {desc}\n\n⚠️ LLM API gerektirir."
            return ToolResult(ok=True, output=output, data={"description": desc})
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class RegexGenerateTool(BaseTool):
    """Regex pattern üretimi."""
    name = "regex_generate"
    description = "Doğal dilden regex pattern üretir."
    permission: PermissionKey = "none"
    parameters = {
        "type": "object",
        "properties": {
            "description": {"type": "string", "description": "Regex pattern açıklaması"}
        },
        "required": ["description"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            desc = args.get("description")
            if not desc:
                return ToolResult(ok=False, error="description gerekli")
            output = f"Regex üretimi: {desc}\n\n⚠️ LLM API gerektirir."
            return ToolResult(ok=True, output=output, data={"description": desc})
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class DataValidationRulesTool(BaseTool):
    """Veri validasyon kuralları."""
    name = "data_validation_rules"
    description = "Veri için validasyon kuralları önerir."
    permission: PermissionKey = "none"
    parameters = {
        "type": "object",
        "properties": {
            "data_type": {"type": "string", "description": "Veri tipi (email, phone, date, vb.)"}
        },
        "required": ["data_type"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            data_type = args.get("data_type")
            if not data_type:
                return ToolResult(ok=False, error="data_type gerekli")
            output = f"Validasyon kuralları: {data_type}\n\n⚠️ LLM API gerektirir."
            return ToolResult(ok=True, output=output, data={"data_type": data_type})
        except Exception as e:
            return ToolResult(ok=False, error=str(e))


class PromptOptimizeTool(BaseTool):
    """Prompt optimizasyonu."""
    name = "prompt_optimize"
    description = "LLM prompt'unu optimize eder."
    permission: PermissionKey = "none"
    parameters = {
        "type": "object",
        "properties": {
            "prompt": {"type": "string", "description": "Optimize edilecek prompt"}
        },
        "required": ["prompt"]
    }
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            prompt = args.get("prompt")
            if not prompt:
                return ToolResult(ok=False, error="prompt gerekli")
            output = f"Prompt optimizasyonu:\n{prompt}\n\n⚠️ LLM API gerektirir."
            return ToolResult(ok=True, output=output, data={"original_prompt": prompt})
        except Exception as e:
            return ToolResult(ok=False, error=str(e))
