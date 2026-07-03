import { StepHeading, Field, inputCls } from './FormComponents';
import type { AgentTemplate } from '../AgentForm';
import { Icon } from '../Icon';

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'developer',
    label: '💻 Yazılım Geliştirici',
    name: 'Yazılım Geliştirici',
    role: 'Senior Software Engineer',
    description: 'Kod yazar, hata ayıklar ve terminal komutlarını çalıştırır.',
    system_prompt: 'Sen deneyimli bir yazılım geliştiricisin. Sana verilen kodlama görevlerini yerine getir, kod yaz ve terminal komutlarıyla test et.',
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.5,
    permissions: { file_system: true, terminal_cmd: true, web_search: true, system_admin: true },
    image: { enabled: false, provider: 'openai', model: 'dall-e-3' },
    video: { enabled: false, provider: 'openai', model: 'sora-1' },
    audio: { enabled: true, provider: 'openai', model: 'whisper-1' }
  },
  {
    id: 'researcher',
    label: '🔍 Araştırmacı Asistan',
    name: 'Araştırmacı Asistan',
    role: 'Research Specialist',
    description: 'Web araması yapar, dokümanları okur ve bilgi derler.',
    system_prompt: 'Sen uzman bir araştırmacısın. Web araması ve yerel doküman okuma araçlarını kullanarak derinlemesine araştırmalar yap ve özetler oluştur.',
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    permissions: { file_system: true, terminal_cmd: false, web_search: true, system_admin: false },
    image: { enabled: false, provider: 'openai', model: 'dall-e-3' },
    video: { enabled: false, provider: 'openai', model: 'sora-1' },
    audio: { enabled: false, provider: 'openai', model: 'whisper-1' }
  },
  {
    id: 'writer',
    label: '✍️ İçerik Yazarı',
    name: 'İçerik Yazarı',
    role: 'Content Creator & Editor',
    description: 'Makaleler, raporlar ve yaratıcı metinler hazırlar.',
    system_prompt: 'Sen profesyonel bir içerik editörü ve yazarısın. Çeşitli konularda makale, blog yazısı ve raporlar hazırlar, dilleri ve tonu mükemmel kullanırsın.',
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.8,
    permissions: { file_system: true, terminal_cmd: false, web_search: true, system_admin: false },
    image: { enabled: true, provider: 'openai', model: 'dall-e-3' },
    video: { enabled: false, provider: 'openai', model: 'sora-1' },
    audio: { enabled: false, provider: 'openai', model: 'whisper-1' }
  },
  {
    id: 'devops',
    label: '🛠️ DevOps Mühendisi',
    name: 'DevOps Mühendisi',
    role: 'DevOps & SRE',
    description: 'Docker, bash betikleri ve sistem araçlarını kullanarak dağıtım yapar.',
    system_prompt: 'Sen sistem yöneticisi ve DevOps mühendisisin. Terminal komutları, Docker ve diğer araçlarla sistem kurulumlarını ve yönetimini gerçekleştirirsin.',
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.3,
    permissions: { file_system: true, terminal_cmd: true, web_search: true, system_admin: true },
    image: { enabled: false, provider: 'openai', model: 'dall-e-3' },
    video: { enabled: false, provider: 'openai', model: 'sora-1' },
    audio: { enabled: false, provider: 'openai', model: 'whisper-1' }
  }
];

export function Step1Basic({
  name,
  setName,
  role,
  setRole,
  description,
  setDescription,
  onApplyTemplate,
  selectedTemplateId,
  onClearTemplate
}: {
  name: string;
  setName: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  onApplyTemplate: (tpl: AgentTemplate) => void;
  selectedTemplateId: string | null;
  onClearTemplate: () => void;
}) {
  return (
    <div className="space-y-4 max-w-xl mx-auto animate-step-in">
      <StepHeading
        title="Ajan kimligini tanit"
        desc="Ajanina bir isim ver ve ne is yapacagini kisa bicimde anlat."
      />

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[10px] font-semibold text-brand-textSoft uppercase tracking-wider">
            Sablon Galerisi (Hizli Baslangic)
          </label>
          {selectedTemplateId && (
            <button
              type="button"
              onClick={onClearTemplate}
              className="text-[10px] text-brand-danger hover:underline inline-flex items-center gap-0.5"
            >
              <Icon name="cancel" size={12} />
              Şablonu İptal Et
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AGENT_TEMPLATES.map((tpl) => {
            const isSelected = selectedTemplateId === tpl.id;
            const templateIcons: Record<string, string> = {
              developer: 'code',
              researcher: 'search',
              writer: 'edit_note',
              devops: 'terminal',
            };
            const iconName = templateIcons[tpl.id] || 'smart_toy';

            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onApplyTemplate(tpl)}
                className={`p-3.5 text-left text-xs rounded-xl border flex items-start gap-3 transition-all duration-300 active:scale-[0.97] shadow-sm ${
                  isSelected
                    ? 'border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent/15'
                    : 'border-brand-border bg-brand-panelAlt/30 hover:border-brand-borderStrong hover:bg-brand-panelAlt/50'
                }`}
              >
                <Icon
                  name={iconName}
                  size={20}
                  weight={550}
                  className={`flex-shrink-0 mt-0.5 transition-colors ${
                    isSelected ? 'text-brand-accent' : 'text-brand-textSoft'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-[12px] text-brand-text leading-tight">{tpl.name}</span>
                    {isSelected && (
                      <span className="text-brand-accent flex items-center flex-shrink-0">
                        <Icon name="check_circle" size={13} filled />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-brand-textSoft mt-1 leading-normal block">
                    {tpl.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <Field label="Ajan Adi *" icon="smart_toy">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="orn. Kodcu Asistan"
            className={inputCls}
          />
        </Field>

        <Field label="Rol / Unvan" icon="badge">
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="orn. Senior Full-Stack Developer"
            className={inputCls}
          />
        </Field>

        <Field label="Aciklama" icon="description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Bu ajanin temel gorevi nedir?"
            rows={3}
            className={inputCls + ' resize-none'}
          />
        </Field>
      </div>
    </div>
  );
}
