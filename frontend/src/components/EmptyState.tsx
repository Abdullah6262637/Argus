import { Icon } from './Icon';

interface EmptyStateProps {
  onCreate: () => void;
  error: string | null;
}

export function EmptyState({ onCreate, error }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-xl w-full text-center">
        <div className="mb-6 flex justify-center">
          <img
            src="/logo.png"
            className="w-32 h-32 rounded-2xl object-contain shadow-md"
            alt="Argus Logo"
          />
        </div>
        <h1 className="text-3xl font-semibold text-brand-text mb-3 tracking-wide">
          Argus'a Hoş Geldin
        </h1>
        <p className="text-brand-muted mb-8 leading-relaxed">
          Henüz hiç ajanın yok. Kendi AI ajanını oluştur — LLM sağlayıcısı,
          model, API anahtarı ve kişiliğini (system prompt) sen belirle.
          Bağlantıyı test ederek başladığından emin ol.
        </p>

        {error && (
          <div className="mb-6 p-3 text-xs text-brand-danger bg-brand-danger/10 border border-brand-danger/40 rounded inline-flex items-center gap-2">
            <Icon name="error" size={16} />
            {error}
          </div>
        )}

        <button
          onClick={onCreate}
          className="px-6 py-3 text-sm font-semibold rounded bg-brand-accent text-brand-bg hover:bg-brand-accentDim transition inline-flex items-center gap-2"
        >
          <Icon name="add_circle" size={20} />
          Yeni Ajan Olustur
        </button>

        <div className="mt-10 grid grid-cols-3 gap-3 text-left">
          <FeatureCard
            icon="hub"
            title="Coklu Saglayici"
            desc="OpenAI, Anthropic veya uyumlu ozel endpoint (base URL)"
          />
          <FeatureCard
            icon="psychology"
            title="Ozel Persona"
            desc="System prompt (SOUL) ile ajanin kisiligini ve kurallarini belirle"
          />
          <FeatureCard
            icon="schedule"
            title="Zamanli Gorevler"
            desc="Cron ifadesi ile ajani pasif calisan otomasyonlara bagla"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="p-4 rounded border border-brand-border bg-brand-panel">
      <div className="text-brand-accent mb-1.5">
        <Icon name={icon} size={22} />
      </div>
      <div className="text-xs font-semibold text-brand-text mb-1">{title}</div>
      <div className="text-[11px] text-brand-muted leading-relaxed">{desc}</div>
    </div>
  );
}