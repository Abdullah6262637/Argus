import { useState } from 'react';
import {
  BASE_THEMES,
  getBaseThemeId,
  getThemeVariant,
  getFullThemeId,
  type ThemeId,
  type BaseThemeId,
  type ThemeVariant,
} from '@/hooks/useTheme';
import { useAppearance, type Density, type FontSize } from '@/hooks/useAppearance';
import { Icon } from '../../Icon';
import { PanelHeader } from '../shared/PanelHeader';

export function ThemeTab({
  theme,
  onChangeTheme,
  initialTheme,
}: {
  theme: ThemeId;
  onChangeTheme: (t: ThemeId) => void;
  initialTheme: ThemeId;
}) {
  const { density, setDensity, fontSize, setFontSize } = useAppearance();

  const currentVariant = getThemeVariant(theme);
  const currentBase = getBaseThemeId(theme);

  // Her temanın kendi bağımsız koyu/açık varyant durumu
  const [cardVariants, setCardVariants] = useState<Record<BaseThemeId, ThemeVariant>>(() => ({
    mono: currentBase === 'mono' ? currentVariant : 'dark',
    midnight: currentBase === 'midnight' ? currentVariant : 'dark',
    sunset: currentBase === 'sunset' ? currentVariant : 'dark',
    forest: currentBase === 'forest' ? currentVariant : 'dark',
  }));

  const handleToggleCardVariant = (baseId: BaseThemeId, newVariant: ThemeVariant, e: React.MouseEvent) => {
    e.stopPropagation();
    setCardVariants((prev) => ({
      ...prev,
      [baseId]: newVariant,
    }));

    // Seçili kart ise varyant anında temaya yansıtılır
    if (currentBase === baseId) {
      const newThemeId = getFullThemeId(baseId, newVariant);
      onChangeTheme(newThemeId);
    }
  };

  const handleSelectCard = (baseId: BaseThemeId) => {
    const variant = cardVariants[baseId];
    const newThemeId = getFullThemeId(baseId, variant);
    onChangeTheme(newThemeId);
  };

  return (
    <div className="space-y-6">
      {/* Tema seçimi */}
      <section>
        <PanelHeader
          title="Renk Teması"
          description="Her tema kartının üstündeki düz çizgilere tıklayarak 1 (Koyu) ve 2 (Açık) varyantlarını bağımsız olarak seçebilirsiniz."
          icon="palette"
        />

        {/* 4 Renk Paleti Kartları — Çerçevesiz, üstte düz çizgi seçenekli */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3">
          {BASE_THEMES.map((t) => {
            const cardVariant = cardVariants[t.id];
            const isFullActive = currentBase === t.id && currentVariant === cardVariant;
            const isInitialActive = getBaseThemeId(initialTheme) === t.id && getThemeVariant(initialTheme) === cardVariant;
            const description = cardVariant === 'light' ? t.lightDesc : t.darkDesc;

            return (
              <div
                key={t.id}
                onClick={() => handleSelectCard(t.id)}
                className={`group rounded-2xl p-4 text-left transition-all duration-200 cursor-pointer active:scale-[0.99] select-none ${
                  isFullActive
                    ? 'bg-brand-panelAlt/90 shadow-sm'
                    : 'bg-brand-panelAlt/40 hover:bg-brand-panelAlt/70 opacity-85 hover:opacity-100'
                }`}
              >
                {/* Üst Başlık: Tema Adı & Seçili Rozeti */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`text-xs font-bold ${isFullActive ? 'text-brand-accent' : 'text-brand-text'}`}>
                    {t.name}
                  </span>
                  {isFullActive ? (
                    <span className="inline-flex items-center gap-1 text-[9.5px] uppercase tracking-wider text-brand-accent font-bold">
                      <Icon name="check_circle" size={12} weight={600} filled />
                      SEÇİLİ
                    </span>
                  ) : (
                    isInitialActive && (
                      <span className="text-[9.5px] uppercase tracking-wider text-brand-mutedSoft font-mono">
                        mevcut
                      </span>
                    )
                  )}
                </div>

                {/* Varyantın Üstündeki Düz Çizgi Seçenekleri (1. Koyu vs 2. Açık) */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="grid grid-cols-2 gap-2 mb-2.5"
                >
                  <button
                    type="button"
                    onClick={(e) => handleToggleCardVariant(t.id, 'dark', e)}
                    className="group/btn flex flex-col gap-1 text-left py-0.5"
                  >
                    <span
                      className={`text-[10px] font-semibold transition-colors ${
                        cardVariant === 'dark'
                          ? 'text-brand-accent font-bold'
                          : 'text-brand-mutedSoft group-hover/btn:text-brand-text'
                      }`}
                    >
                      1. Koyu
                    </span>
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${
                        cardVariant === 'dark'
                          ? 'bg-brand-accent'
                          : 'bg-brand-borderStrong/40 group-hover/btn:bg-brand-borderStrong'
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleToggleCardVariant(t.id, 'light', e)}
                    className="group/btn flex flex-col gap-1 text-left py-0.5"
                  >
                    <span
                      className={`text-[10px] font-semibold transition-colors ${
                        cardVariant === 'light'
                          ? 'text-brand-accent font-bold'
                          : 'text-brand-mutedSoft group-hover/btn:text-brand-text'
                      }`}
                    >
                      2. Açık
                    </span>
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${
                        cardVariant === 'light'
                          ? 'bg-brand-accent'
                          : 'bg-brand-borderStrong/40 group-hover/btn:bg-brand-borderStrong'
                      }`}
                    />
                  </button>
                </div>

                {/* Renk Paleti Şeridi — Düz Çizgilerin Tam Altında */}
                <ThemePreview
                  themeId={t.id}
                  variant={cardVariant}
                  active={isFullActive}
                />

                {/* Alt Açıklama Metni */}
                <div className="text-[10px] text-brand-mutedSoft mt-2 truncate">
                  {description}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Yazı boyutu */}
      <section>
        <PanelHeader
          title="Yazı Boyutu"
          description="Kullanıcı arayüzünün temel yazı tipi boyutunu ayarlayın."
          icon="format_size"
        />
        <div className="grid grid-cols-4 gap-2.5 mt-2">
          {(['sm', 'md', 'lg', 'xl'] as FontSize[]).map((sz) => {
            const labels: Record<FontSize, string> = {
              sm: 'Küçük',
              md: 'Orta',
              lg: 'Büyük',
              xl: 'Çok Büyük',
            };
            const sizes: Record<FontSize, string> = {
              sm: '12px',
              md: '14px',
              lg: '16px',
              xl: '18px',
            };
            const previewSize: Record<FontSize, string> = {
              sm: 'text-xs',
              md: 'text-sm',
              lg: 'text-base',
              xl: 'text-lg',
            };
            const active = fontSize === sz;
            return (
              <button
                key={sz}
                type="button"
                onClick={() => setFontSize(sz)}
                className={`rounded-2xl p-3 text-center transition-all active:scale-[0.98] ${
                  active
                    ? 'bg-brand-panelAlt/90 shadow-sm'
                    : 'bg-brand-panelAlt/40 hover:bg-brand-panelAlt/70 opacity-70 hover:opacity-100'
                }`}
              >
                <div
                  className={`${previewSize[sz]} font-bold ${active ? 'text-brand-accent' : 'text-brand-text'}`}
                >
                  Aa
                </div>
                <div className={`text-[11px] font-semibold mt-1 ${active ? 'text-brand-accent' : 'text-brand-text'}`}>
                  {labels[sz]}
                </div>
                <div className="text-[10px] text-brand-mutedSoft font-mono">
                  {sizes[sz]}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* UI yoğunluğu */}
      <section>
        <PanelHeader
          title="UI Yoğunluğu"
          description="Bileşenler ve butonlar arasındaki boşluk mesafesini ayarlayın."
          icon="density_medium"
        />
        <div className="grid grid-cols-3 gap-2.5 mt-2">
          {(['compact', 'cozy', 'comfortable'] as Density[]).map((d) => {
            const labels: Record<Density, string> = {
              compact: 'Kompakt',
              cozy: 'Standart',
              comfortable: 'Geniş',
            };
            const descs: Record<Density, string> = {
              compact: 'Daha az boşluk',
              cozy: 'Varsayılan',
              comfortable: 'Daha fazla boşluk',
            };
            const icons: Record<Density, string> = {
              compact: 'density_small',
              cozy: 'density_medium',
              comfortable: 'density_large',
            };
            const active = density === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDensity(d)}
                className={`rounded-2xl p-3 text-center transition-all active:scale-[0.98] ${
                  active
                    ? 'bg-brand-panelAlt/90 shadow-sm'
                    : 'bg-brand-panelAlt/40 hover:bg-brand-panelAlt/70 opacity-70 hover:opacity-100'
                }`}
              >
                <Icon
                  name={icons[d]}
                  size={18}
                  weight={500}
                  className={
                    active ? 'text-brand-accent' : 'text-brand-mutedSoft'
                  }
                />
                <div className={`text-[11px] font-semibold mt-1 ${active ? 'text-brand-accent' : 'text-brand-text'}`}>
                  {labels[d]}
                </div>
                <div className="text-[10px] text-brand-mutedSoft">
                  {descs[d]}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const PALETTES: Record<ThemeVariant, Record<BaseThemeId, string[]>> = {
  dark: {
    mono: ['#000000', '#141414', '#ffffff', '#737373'],
    midnight: ['#0b1220', '#162238', '#60a5fa', '#94a3b8'],
    sunset: ['#1a0f0a', '#2d1b14', '#fb923c', '#d4b5a0'],
    forest: ['#0a1410', '#14261f', '#34d399', '#a3c4b3'],
  },
  light: {
    mono: ['#f8fafc', '#e2e8f0', '#0f172a', '#334155'],
    midnight: ['#f1f5f9', '#e2e8f0', '#2563eb', '#334155'],
    sunset: ['#fff7ed', '#ffedd5', '#ea580c', '#432a1b'],
    forest: ['#f0fdf4', '#dcfce7', '#059669', '#1f4b36'],
  },
};

export function ThemePreview({
  themeId,
  variant,
  active,
}: {
  themeId: BaseThemeId;
  variant: ThemeVariant;
  active?: boolean;
}) {
  const colors = PALETTES[variant][themeId] || PALETTES.dark.mono;

  return (
    <div
      key={`${themeId}-${variant}`}
      className={`flex gap-0 rounded-xl overflow-hidden h-9 border border-brand-border/60 transition-all duration-300 animate-palette-morph ${
        active ? 'shadow-sm ring-1 ring-brand-accent/30' : 'opacity-90'
      }`}
    >
      {colors.map((c, i) => (
        <div
          key={i}
          className="flex-1 transition-colors duration-300"
          style={{ background: c }}
        />
      ))}
    </div>
  );
}
