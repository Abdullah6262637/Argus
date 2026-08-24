import React from 'react';
import { Icon } from '../../Icon';

export function AboutTab() {
  const osInfo = typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Windows') ? 'Windows x64' : navigator.userAgent.includes('Mac') ? 'macOS (Darwin)' : 'Linux') : 'Windows x64';

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
      {/* Hero */}
      <div className="text-center py-3 relative overflow-hidden">
        <div className="flex justify-center">
          <img
            src="/logo.png"
            className="w-16 h-16 rounded-2xl object-contain p-0.5"
            alt="Argus Logo"
          />
        </div>
        <h2 className="text-xl font-bold text-brand-text mt-2 tracking-tight">
          Argus
        </h2>
        <p className="text-xs text-brand-mutedSoft mt-1 inline-flex items-center gap-1.5 font-mono">
          <Icon name="bolt" size={13} weight={600} filled className="text-brand-accent" />
          <span>Aynı anda her şeyi gören çoklu ajan sistemi</span>
          <span className="text-brand-border">·</span>
          <span className="text-brand-accent font-bold">v0.4.5</span>
        </p>
      </div>

      {/* Tanım */}
      <AboutSection icon="description" title="Proje Hakkında & Vizyon">
        <p className="leading-relaxed text-xs text-brand-mutedSoft">
          Argus; geliştiriciler, veri bilimciler ve sistem mühendisleri için tasarlanmış 
          <strong className="text-brand-text font-semibold"> otonom ve yarı otonom çoklu ajan (Multi-Agent) kontrol panelidir</strong>. 
          Geleneksel chat arayüzlerinin aksine Argus, her biri farklı dil modelleriyle (LLM) 
          güçlendirilmiş uzman ajanları tek bir çatı altında koordine edebilir, hedefleri gerçekleştirmek için 
          çok adımlı otonom planlama, sorgulama ve araç çalıştırma (Tool Use) süreçlerini yönetebilir.
        </p>
      </AboutSection>

      {/* Sistem Durumu */}
      <AboutSection icon="check_circle" title="Uygulama Çalışma Bilgileri">
        <div className="grid grid-cols-2 gap-2 mt-1">
          <InfoRow icon="desktop_windows" label="Çalıştığı İşletim Sistemi" value={osInfo} />
          <InfoRow icon="javascript" label="Runtime Motoru" value="Electron 33 · React 18" />
          <InfoRow icon="terminal" label="Sistem Ajan Shell" value="PowerShell (Win)" />
          <InfoRow icon="api" label="Yerel Backend API" value="FastAPI · Async Python" />
        </div>
      </AboutSection>

      {/* Öne Çıkan Özellikler */}
      <AboutSection icon="auto_awesome" title="Öne Çıkan Ajan Kabiliyetleri">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Feat icon="hub" text="Hiyerarşik Çoklu Model: OpenAI, Anthropic, Gemini, DeepSeek, Mistral, xAI Grok ve yerel modellerin tek projede eş zamanlı çalışması." />
          <Feat icon="psychology" text="Otonom Planlama Döngüsü: Hedef bazlı dinamik planlama, yürütme, gözlem ve planda otomatik sapma düzeltmesi." />
          <Feat icon="build" text="Gelişmiş Araç Entegrasyonu: 60'tan fazla yerleşik araçla (dosya sistemi, web tarayıcısı, Git, veritabanı, terminal)." />
          <Feat icon="schema" text="Bilgi Grafiği & Bellek: Ajanlar arası paylaşılan anlamsal ilişkileri gösteren Knowledge Graph ve Vektör Bellek." />
          <Feat icon="schedule" text="Zamanlanmış Otonom Görevler: Cron ifadeleriyle tetiklenen arka plan ajansal görevleri ve YAML Pipeline desteği." />
          <Feat icon="security" text="HITL & Güvenlik: Kritik işletim sistemi ve dosya erişim işlemlerinde İnsan Onayı ve HMAC-SHA256 zincirli kayıt sistemi." />
        </div>
      </AboutSection>

      {/* Klavye Kısayolları */}
      <AboutSection icon="keyboard" title="Klavye Kısayolları & Hızlı Erişim">
        <div className="text-[11px] font-mono divide-y divide-brand-border/20">
          <div className="grid grid-cols-3 gap-2 py-2 font-bold text-brand-text">
            <div>Kısayol Kombinasyonu</div>
            <div className="col-span-2">İşlem / Tetiklediği Aksiyon</div>
          </div>
          <div className="grid grid-cols-3 gap-2 py-2 items-center text-brand-mutedSoft">
            <div><kbd className="bg-brand-panelAlt px-1.5 py-0.5 rounded text-brand-accent">Ctrl + K</kbd></div>
            <div className="col-span-2">Komut Paletini Aç / Kapat (Fuzzy Search)</div>
          </div>
          <div className="grid grid-cols-3 gap-2 py-2 items-center text-brand-mutedSoft">
            <div><kbd className="bg-brand-panelAlt px-1.5 py-0.5 rounded">Ctrl + N</kbd></div>
            <div className="col-span-2">Yeni Sohbet Oturumu Başlat</div>
          </div>
          <div className="grid grid-cols-3 gap-2 py-2 items-center text-brand-mutedSoft">
            <div><kbd className="bg-brand-panelAlt px-1.5 py-0.5 rounded">Ctrl + Shift + N</kbd></div>
            <div className="col-span-2">Yeni Uzman Ajan Yapılandırma Formu</div>
          </div>
          <div className="grid grid-cols-3 gap-2 py-2 items-center text-brand-mutedSoft">
            <div><kbd className="bg-brand-panelAlt px-1.5 py-0.5 rounded">Ctrl + Shift + M</kbd></div>
            <div className="col-span-2">Mevcut Sohbet Geçmişini İndir (.md)</div>
          </div>
        </div>
      </AboutSection>

      <div className="text-center text-[10px] text-brand-mutedSoft pt-4 border-t border-brand-border/20 flex items-center justify-center gap-2">
        <Icon name="copyright" size={11} weight={500} />
        <span>2026 Argus Project</span>
        <span className="text-brand-border">·</span>
        <span>MIT Lisansı (Açık Kaynak)</span>
      </div>
    </div>
  );
}

function AboutSection({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[10px] uppercase tracking-wider font-bold text-brand-mutedSoft mb-2 inline-flex items-center gap-1.5">
        <Icon
          name={icon}
          size={12}
          weight={550}
          className="text-brand-accent"
        />
        {title}
      </h3>
      <div className="text-xs text-brand-mutedSoft leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Feat({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2 py-1.5 px-1 rounded-md">
      <Icon
        name={icon}
        size={13}
        weight={550}
        className="text-brand-accent flex-shrink-0 mt-0.5"
      />
      <span className="text-[11px] text-brand-mutedSoft leading-snug">{text}</span>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="py-1 px-1">
      <div className="text-[9px] uppercase tracking-wider text-brand-mutedSoft font-bold inline-flex items-center gap-1">
        <Icon name={icon} size={10} weight={500} />
        {label}
      </div>
      <div className="text-[11px] text-brand-text mt-0.5 font-mono truncate">
        {value}
      </div>
    </div>
  );
}
