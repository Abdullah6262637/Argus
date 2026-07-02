# OpenClaw (Clawdbot) ve AI Ajan Sistemleri  
【8†embed_image】OpenClaw (önceki adıyla Clawdbot), bilgisayarınızda yerel olarak çalışan, sürekli hafızası olan ve gerçek sistem işlemleri yapabilen açık kaynaklı bir yapay zekâ ajanıdır【5†L33-L42】【5†L44-L52】. Özetle, klasik bir sohbet botu gibi sadece cevap üretmekle kalmaz; verilen görevleri planlar, uygular ve sonuçları takip eder【5†L33-L42】【5†L44-L52】. Örneğin, e-posta yönetimi, takvim planlama, dosya düzenleme, kod yazma ve web otomasyonu gibi birçok görevi otomatikleştirebilir【19†L181-L189】【19†L248-L254】. Clawbot ve OpenClaw’ın ana farkı, tamamen yerel çalışabilmesi ve bulut zorunluluğu olmadan, API veya yerel LLM modelleriyle sistem üzerinde işlem yapabilmesidir【5†L44-L52】【19†L137-L140】.  

## Çoklu Ajan Mimarisi ve Roller  
OpenClaw aynı anda birden fazla ajanı destekleyecek biçimde tasarlanmıştır. Her ajan (*agent*) tamamen izole bir “beyin” gibi çalışır: kendi çalışma alanı, oturumları ve kimlik bilgileri vardır【22†L224-L232】. Örneğin her ajanın `SOUL.md` veya `AGENTS.md` gibi dosyalarıyla kişilik ve rol tanımı yapılabilir; bu sayede ajanlara “kod geliştirici”, “sosyal medya uzmanı” gibi roller atanabilir. Gelen mesajlar yapılandırılmış kurallarla (bindings) uygun ajana yönlendirilir【22†L324-L332】. Bu mimari sayesinde birden fazla kullanıcı veya kullanım senaryosu aynı sunucuda ayrı “ajan beyin”leri ile yönetilebilir【22†L224-L232】.  

## Model Entegrasyonu  
【11†embed_image】Sistemimizde **50’den fazla farklı LLM modeli** ve sağlayıcısı entegre edilebilir. OpenClaw’ın felsefesi, modele bağımlı olmamaktır【19†L205-L212】. Örneğin OpenAI (GPT-3/GPT-4), Anthropic (Claude), Google (Gemini), xAI, Hugging Face veya yerel modeller (Ollama, Meta Llama vb.) kolayca eklenebilir【19†L205-L212】【19†L137-L140】. Her ajana farklı bir model veya API anahtarı atanabilir; böylece bir ajan GPT-4, diğer ajan Claude veya yerel bir model kullanabilir. Model entegrasyonu için anahtar yönetimi ve model son-nokta yapılandırması önemlidir. Arka uçta (Python) OpenAI gibi API anahtarları *asla* frontend tarafında saklanmamalı, ortam değişkenleri ile güvenle korunmalıdır【30†L135-L138】.  

## Pasif Görevler ve Zamanlanmış İşlemler  
Sistemimizin ajanları yalnızca kullanıcı komutlarına cevap vermekle kalmamalıdır; **zamanlanmış görevler** de otomatikleştirilebilmelidir. OpenClaw’da örneğin her sabah özet sunma, düzenli yedekleme veya belirli bir saatte mail kontrol etme gibi brifingler yapılabilir【19†L252-L260】. Python tarafında bu amaçla *cron* işleyicileri, APScheduler veya Celery Beat gibi araçlar kullanılabilir. Örneğin:  
- Her gün saat 09:00’da “günlük toplantıları özetle” komutu ajana iletilir.  
- Her gece belirli klasörlerin yedeği alınır.  
- Belirli URL’ler üzerinden webhook’lar tetiklenerek olaylar izlenir.  

## Güvenlik ve Sandbox  
OpenClaw’ın üzerinde çalıştığı en kritik konu güvenliktir. Gerçek sistem erişimi sağlanan ajanlar, yanlış yapılandırıldığında tehlikeli olabilir【7†L156-L160】【24†L117-L125】. Bu nedenle:  
- **Sandboxlama:** Her ajanın kodu izinleri kısıtlı bir *sandbox* (Docker konteyner veya VM) içinde koşmalıdır【7†L156-L160】【25†L55-L59】. Örneğin Docker’da “non-root” kullanıcı ve salt okunur dosya sistemleri kullanılmalı, ağ erişimi dışa kapatılmalıdır【25†L55-L59】.  
- **Güvenlik Politikalı Çalıştırma:** Ağ trafiği filtrelenmeli, her ajan için maksimum işlem süresi ve adım sayısı belirlenmelidir【25†L55-L59】【27†L77-L80】. Belirli komutlar için beyaz liste mantığı uygulanmalı, çok sayıda harici API çağrısı engellenmelidir.  
- **Anahtar Yönetimi:** API anahtarları ve kimlik bilgileri kesinlikle frontend’te tutulmamalıdır【30†L135-L138】. Her ajan için farklı ve güvencesi sağlanmış kimlik bilgileri konfigüre edilmelidir.  
- **İncelemeler ve Loglama:** Ajana verilecek görevler önceden test edilmiş, taklit edilmiş komut zincirleri olmalıdır. Her agent eylemi sıkı şekilde loglanarak geriye dönük denetlenebilir olmalıdır.  

Bu önlemler, ajanların güvenli bir şekilde *otonom* çalışmasını sağlar. Gerçek dünyada yaşanan örnekler (örneğin bir Claude modelinin kötü niyetli bir komutla sistemi ele geçirmesi) sandbox kullanımının gerekliliğini göstermiştir【25†L139-L143】.  

## Performans ve Ölçeklenebilirlik  
Çok sayıda ajanın bir arada çalışması her zaman daha iyi sonuç vermez; yönetim ve eşgüdüm yükü artar【27†L77-L80】. UC Berkeley ve DeepMind araştırmaları, ajans sayısı ile verimlilik arasında negatif korelasyon olduğunu göstermektedir【27†L77-L80】. Başka bir deyişle, **fazla ajan** koordine edilmesi zor, maliyetli ve gecikmeli iş akışlarına neden olabilir. Bu nedenle mimaride şunlar planlanmalıdır:  
- **Koordinatör Ajan:** Büyük iş akışlarında bir “yönetici” ajan, alt ajanlara görev dağıtarak işi bölümlere ayırabilir.  
- **Kaynak Yönetimi:** Ajanlar aynı anda aşırı yük getirebileceğinden, kaynak sınırları (CPU/GPU, bellek) belirlenmelidir. Gerektiğinde ajana özgü işlem havuzları veya sınırlayıcılar kullanılabilir.  
- **Önbellek ve Ön-işleme:** Sık kullanılan sorgular için önbellekleme; uzun konuşma geçmişi için özet çıkarma (token miktarını azaltma) uygulanabilir.  
- **Verimlilik Ölçümü:** Ajan başına geçirilen zaman, token kullanımı ve tamamlanan görev sayısı takip edilerek gereksiz ajanlar tespit edilebilir.  

## Python Backend ve React UI Kurulumu  
### Adım 1: Ortam Hazırlığı  
1. **Python Kurulumu:** Python 3.10+ sürümü kurulmalı. Yeni bir sanal ortam (`python -m venv`) oluşturun ve aktif edin.  
2. **Backend Kütüphaneleri:** FastAPI, Uvicorn (ASGI sunucusu), pydantic, SQL (ör. SQLite için SQLAlchemy) ve OpenAI/anthropic istemcileri gibi kütüphaneler `pip install fastapi uvicorn pydantic sqlalchemy openai` komutuyla yüklenir. FastAPI, modern asenkron yapısı ve otomatik Swagger dökümantasyonu ile yüksek performans sunar【30†L89-L96】.  
3. **Frontend Kurulumu:** Node.js ve npm kurulmalı. React uygulamasını `create-react-app` veya Vite ile başlatın. Bir CSS kütüphanesi (örneğin Material-UI veya Ant Design) seçerek kurulum yapabilirsiniz. 

### Adım 2: Backend Yapılandırması  
- **API Anahtarları:** Tüm API anahtarlarını çevresel değişken olarak `.env` dosyasında tutun; bu anahtarları `os.environ` veya `pydantic` ile alın【30†L135-L138】. Frontend kodunda anahtar kullanılmamalıdır.  
- **API Rotası:** FastAPI üzerinden `/chat` gibi bir POST endpoint’i oluşturun. Bu endpoint, JSON olarak gelen “soru” metnini alacak, ilgili ajanı seçip işleyerek modelden yanıt alacak ve sonucu JSON olarak döndürecek.  
- **Ajan Yönetimi:** Bir yapılandırma dosyasında (ör. JSON veya YAML) ajan kimlikleri, rolleri ve her bir ajan için kullanılacak model ayarları tanımlanabilir. Backend bu dosyayı okuyarak ajan nesneleri oluşturur.  
- **Veri Depolama:** Kullanıcı-ajan sohbet geçmişleri, görev defterleri ve notlar gibi durum bilgileri bir veri tabanında (SQLite, PostgreSQL vb.) saklanabilir. Alternatif olarak dosya sistemi üzerinde dizinler de kullanılabilir.  
- **Gerçek Zamanlı İletişim:** Chat uygulamasında kullanıcı-sistem mesajları anlık gösterilmesi isteniyorsa WebSocket (örn. FastAPI WebSocket) kullanılabilir. Aksi halde basit AJAX/HTTP istekleri de yeterlidir.  

### Adım 3: Frontend (React) Tasarımı  
- **Ekran Düzeni:** Ekranı yatay bölünmüş panellere ayırın. Örneğin sol panel (tüm yükseklik boyunca, genişlik ~25%) ajan listesini, sağ panel (yükseklik boyunca, ~25% genişlik) sistem durumunu veya ajanın araçlarını, ortadaki büyük alan ise sohbet penceresini içerebilir. Bu çerçeve dizaynı kurumsal ve sade bir görünüm için grid veya flexbox ile kolayca uygulanabilir.  
- **Ajan Listesi:** Sol panelde ajanların isimleri, rolleri ve durumları (çevrimiçi/boşta) gösterilir. Kullanıcı bir ajanı seçtiğinde sohbet penceresi o ajana bağlanır.  
- **Sohbet Penceresi:** Ortadaki alan, seçili ajanla yapılan sohbete ayrılır. Mesaj balonları (user vs. agent) farklı stillerle gösterilir. Mesaj gönderme için bir metin girişi ve “Gönder” düğmesi bulunur.  
- **Pasif Görevler Görünümü:** Sağ panelde zamanlanmış görevler, sistem logları veya ajanın etkinlik geçmişi görüntülenebilir. Bu sayede ajanlarla yapılan konuşma dışında ajanın ne tür işler yaptığı takip edilebilir.  

### Adım 4: Entegrasyon ve Test  
- Backend API’sini başlatın (örneğin `uvicorn main:app --reload`). Frontend’den API endpoint’ine bağlantı yaparak sohbet başlatın.  
- Ajan persona ve başlangıç komutlarını test edin. Örneğin, “bugün plan nedir?” diyerek takvim özetini alıp alamadığınızı kontrol edin.  
- *Sandbox* veya kısıtlı modlarda (ör. `fastapi.testing`) ajanları çalıştırarak öncelikle izinleri sınırlandırılmış şekilde test edin.  

## Güvenlik ve Sonuçlar  
Bu tasarımda, OpenClaw gibi yerel bir **AI ajan sistemini** Python ve React ile yeniden oluşturduk. Gelişmiş güvenlik önlemleri (container bazlı izolasyon, anahtar yönetimi, izin kısıtlaması) kullanarak ajanların yan etkisiz çalışması sağlanır【7†L156-L160】【25†L55-L59】. Modüler yapısı sayesinde her ajana özel model ve rol tanımlanabilir; gerektiğinde ekstra ajanlar ekleyerek sistem genişletilebilir. Ancak daha önceki araştırmaların da işaret ettiği gibi, ajans sayısı arttıkça performans ve verimlilik dikkatle izlenmelidir【27†L77-L80】. Özetle, bu adım adım kurulum ve tasarım rehberi, OpenClaw benzeri bir yerel AI ajan sistemini Python backend ve React ön yüz ile kurmanız için detaylı bir yol haritası sunmaktadır.  

**Kaynaklar:** OpenClaw/Clawbot dokümantasyon ve teknolojik blog yazıları ışığında derlenmiştir【5†L33-L42】【7†L156-L160】【19†L205-L212】【22†L224-L232】【24†L117-L125】【25†L55-L59】【27†L77-L80】【30†L135-L138】.