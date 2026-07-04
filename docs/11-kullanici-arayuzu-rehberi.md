# 11 — Kullanıcı Arayüzü Rehberi

## Genel Düzen

```
┌──────────────────────────────────────────────────────────┐
│                      HEADER (Üst Bar)                    │
│  [Logo] Argus   [Arama/Komut Paleti]   [Araçlar] [Ayar] │
├─────────────┬──────────────────────────┬─────────────────┤
│             │                          │                 │
│  AJAN       │    SOHBET PENCERESİ      │  SİSTEM         │
│  LİSTESİ   │                          │  PANELİ         │
│  (Sol)      │    (Orta, Ana Alan)      │  (Sağ)          │
│             │                          │                 │
├─────────────┴──────────────────────────┴─────────────────┤
│                    MESAJ GİRİŞİ                          │
└──────────────────────────────────────────────────────────┘
```

### Panel Görünürlüğü

- **Sol panel**: Üst barda ajan listesi butonu ile aç/kapat
- **Sağ panel**: Sistem paneli butonu ile aç/kapat
- Her panel tercihi localStorage'a kaydedilir

---

## Kurulum Sihirbazı (İlk Açılış)

İlk çalıştırmada veya sistem sıfırlandıktan sonra otomatik açılır.

### Adım 1 — Hoş Geldiniz

- Sistem versiyonu ve gereksinimler gösterilir
- Python, Node.js, SQLite sürümleri kontrol edilir
- Her bileşen için yeşil/kırmızı durum göstergesi

### Adım 2 — API Anahtarları

- Sağlayıcı logolarıyla birlikte API anahtar alanları
- Her alan için "Gizle/Göster" butonu
- Boş bırakılabilen alanlar (olmayan sağlayıcı kullanılmaz)

### Adım 3 — Ajan Şablonları

- 12 şablon kartı (emoji + ad + açıklama)
- Çoklu seçim
- Toplu sağlayıcı seçimi (seçilen tüm ajanlar aynı provider kullanır)

### Adım 4 — Tema Seçimi

- 4 tema kartı: Mono, Midnight, Sunset, Forest
- Her kartta renk paleti önizlemesi (4 renkli şerit)
- Seçim anında arka planda uygulanır

### Tamamlanma

Kurulum bittikten sonra:
1. Ayarlar kaydedilir
2. Seçilen ajan şablonları oluşturulur
3. **Splash Screen** açılır (~6 saniye boot animasyonu)
4. Ana ekrana geçilir

---

## Ajan Listesi (Sol Panel)

```
┌─────────────────┐
│ + Yeni Ajan     │
├─────────────────┤
│ 🧑‍💻 Geliştirici │ ← Aktif ajan
│    Python Dev   │
│    ● Çalışıyor  │
├─────────────────┤
│ 🔍 Araştırmacı  │
│    Research AI  │
│    ○ Hazır      │
├─────────────────┤
│ ✍️  Yazar        │
│    Content AI   │
│    ○ Hazır      │
└─────────────────┘
```

### Ajan Durumları

| İkon | Durum | Açıklama |
|---|---|---|
| ●  (yeşil) | Çalışıyor | Aktif olarak görev yapıyor |
| ○  (gri) | Hazır | Bekleme modunda |
| ⚠️ | Hata | Son işlemde hata oluştu |
| 🔴 | Pasif | Devre dışı bırakıldı |

### Sağ Tık Menüsü

Ajan kartına sağ tıklandığında:
- **Sohbete Git** — Bu ajanın sohbet penceresine geç
- **Düzenle** — Ajan formunu düzenleme modunda aç (`Ctrl+E`)
- **Kopyala** — Ajanı klonla
- **Yeni Sohbet** — Geçmişi temizle, yeni başlat
- **Dışa Aktar** — JSON olarak indir
- **Denetçi** — Ajan iç durumu (prompt geçmişi, araç çağrıları)
- **Pasif Yap / Aktif Et** — Geçici devre dışı bırak
- **Sil** — Kalıcı sil (onay gerektirir)

---

## Sohbet Penceresi (Orta)

### Mesaj Türleri

**Kullanıcı Mesajı:**
```
[Kullanıcı avatarı] Mesaj metni
```

**Ajan Yanıtı:**
```
[Ajan avatarı + renk] Yanıt metni (Markdown render)
   ├── Kod blokları: syntax highlighting
   ├── Tablolar: formatlı
   ├── Listeler: madde işaretli
   └── Matematik: LaTeX render
```

**Araç Çağrısı (Ajanın yaptığı):**
```
[🔧 web_search] → query: "Python async tutorial"
   └── [↵ Sonuç] 5 arama sonucu bulundu
```

**Onay Bekleme:**
```
[⚠️ Onay Gerekli] delete_file('/important.txt')
   Ajan bu dosyayı silmek istiyor.
   [✅ Onayla]  [❌ Reddet]
```

### Mesaj Giriş Alanı

- **Metin:** Çok satırlı giriş (`Shift+Enter` ile yeni satır, `Enter` ile gönder)
- **Dosya:** Sürükle-bırak veya ataş butonu
- **Ses:** Mikrofon butonu ile sesli giriş (Web Speech API)
- **Durdur:** Akış sırasında `■ Durdur` butonuna basın

### Sohbet Kısayolları

| Kısayol | İşlev |
|---|---|
| `Enter` | Gönder |
| `Shift+Enter` | Yeni satır |
| `Ctrl+Shift+S` | Sohbeti Markdown olarak indir |
| `↑` (boş giriş) | Önceki mesajı düzenle |

---

## Sistem Paneli (Sağ)

Gerçek zamanlı sistem bilgilerini gösterir:

### Sekmeler

**Durum Sekmesi:**
- Her ajanın çalışma durumu
- Aktif araç çağrıları
- Son tamamlanan görevler

**Görevler Sekmesi:**
- Zamanlanmış görev listesi
- Son çalışma zamanları
- Bir sonraki çalışma zamanları

**Loglar Sekmesi:**
- Gerçek zamanlı log akışı
- Filtre: INFO | WARNING | ERROR
- Belirli ajan logu filtreleme

**Bellek Sekmesi:**
- Seçili ajanın anı sayısı
- Son kaydedilen anılar
- Hızlı arama

---

## Komut Paleti (`Ctrl+K`)

Spotlight benzeri hızlı erişim paneli.

### Komut Kategorileri

**Ajanlar:**
```
> @Geliştirici: Python ile decorator nedir?
> Yeni ajan oluştur
> Araştırmacı ajanını düzenle
```

**Navigasyon:**
```
> Ayarları aç
> İş akışlarını aç
> Bilgi grafiğini aç
```

**Eylemler:**
```
> Seçili sohbeti temizle
> Tüm ajanları yenile
> Sistem sıfırla
```

**Kısayol Örnekleri:**
- `@` — Ajan adına göre hızlı mesaj gönder
- `>` — Komut çalıştır
- `#` — Sohbet geçmişinde ara
- `?` — Yardım ve dokümantasyon

---

## Ayarlar Modalı

**Ayarlar → Genel:**
- Tema seçimi
- Yoğunluk (compact / comfortable / spacious)
- Font boyutu

**Ayarlar → API Anahtarları:**
- Tüm sağlayıcıların API anahtarları
- Format doğrulama
- Bağlantı testi

**Ayarlar → Ajanlar:**
- Toplu sağlayıcı güncelleme
- Tüm sohbetleri temizle
- Ajan içe aktarma

**Ayarlar → MCP:**
- MCP sunucu listesi
- Yeni sunucu ekleme
- Bağlantı durumu

**Ayarlar → Plugins:**
- Yüklü plugin'ler
- Aktif/Pasif durumu

**Ayarlar → Gelişmiş:**
- Log düzeyi
- Sistem tanısı (Doctor)
- **⚠️ Sistemi Sıfırla** — Tüm verileri siler

---

## Ajan Denetçisi

`Ctrl+I` veya ajan listesinde "Denetçi" menüsü ile açılır.

### Sekmeler

- **Genel Bilgiler**: Ajan yapılandırması, son aktivite
- **Prompt Geçmişi**: Sisteme gönderilen prompt versiyonları
- **Araç Çağrıları**: Son 50 araç çağrısı ve süreleri
- **Bellek**: Ajan anıları
- **İstatistikler**: Toplam mesaj, araç çağrısı, hata sayısı

---

## Klavye Kısayolları

| Kısayol | İşlev |
|---|---|
| `Ctrl+K` | Komut paletini aç |
| `Ctrl+N` | Yeni ajan oluştur |
| `Ctrl+E` | Seçili ajanı düzenle |
| `Ctrl+I` | Ajan denetçisini aç |
| `Ctrl+R` | Ajanları yenile |
| `Ctrl+,` | Ayarları aç |
| `Ctrl+W` | İş akışlarını aç |
| `Ctrl+Shift+S` | Sohbeti dışa aktar |
| `Ctrl+Shift+E` | Ajan JSON'ını dışa aktar |
| `1` - `9` | 1-9. ajanı seç |
| `Escape` | Açık modalı kapat |

---

## Temalar

| Tema | Açıklama | Arka Plan | Vurgu |
|---|---|---|---|
| **Mono** | Siyah-beyaz minimalist | `#000000` | `#ffffff` |
| **Midnight** | Gece mavisi | `#0b1220` | `#60a5fa` |
| **Sunset** | Sıcak amber | `#1a0f0a` | `#fb923c` |
| **Forest** | Koyu yeşil | `#0a1410` | `#34d399` |

Tema değiştirme: `Ctrl+,` → Genel → Tema

---

## Animasyonlar

### Splash Screen (Sistem Başlatma)

Kurulum sonrası veya başlangıçta:
- Argus logosu merkeze gelir
- 4 adımlı boot sequence (her biri ~1.5 saniye)
- Animasyonlu progress bar
- Toplam ~6 saniye

### Reset Screen (Sistem Sıfırlama)

Sıfırlama onayından sonra:
- 6 adımlı silme sequence (her biri ~1.8-2.2 saniye)
- Kırmızı progress bar
- Tamamlanan adımlar üstü çizili olur
- Toplam ~12 saniye
- Sonunda kurulum sihirbazına geçiş
