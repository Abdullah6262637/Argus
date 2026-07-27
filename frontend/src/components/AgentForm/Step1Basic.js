import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StepHeading, Field, inputCls } from './FormComponents';
import { Icon } from '../Icon';
export const AGENT_TEMPLATES = [
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
export function Step1Basic({ name, setName, role, setRole, description, setDescription, onApplyTemplate, selectedTemplateId, onClearTemplate, isEditing }) {
    return (_jsxs("div", { className: "space-y-4 max-w-xl mx-auto animate-step-in", children: [_jsx(StepHeading, { title: "Ajan kimligini tanit", desc: "Ajanina bir isim ver ve ne is yapacagini kisa bicimde anlat." }), !isEditing && (_jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("label", { className: "block text-[10px] font-semibold text-brand-textSoft uppercase tracking-wider", children: "Sablon Galerisi (Hizli Baslangic)" }), selectedTemplateId && (_jsxs("button", { type: "button", onClick: onClearTemplate, className: "text-[10px] text-brand-danger hover:underline inline-flex items-center gap-0.5", children: [_jsx(Icon, { name: "cancel", size: 12 }), "\u015Eablonu \u0130ptal Et"] }))] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: AGENT_TEMPLATES.map((tpl) => {
                            const isSelected = selectedTemplateId === tpl.id;
                            const templateIcons = {
                                developer: 'code',
                                researcher: 'search',
                                writer: 'edit_note',
                                devops: 'terminal',
                            };
                            const iconName = templateIcons[tpl.id] || 'smart_toy';
                            return (_jsxs("button", { type: "button", onClick: () => onApplyTemplate(tpl), className: `p-3.5 text-left text-xs rounded-xl border flex items-start gap-3 transition-all duration-300 active:scale-[0.97] shadow-sm ${isSelected
                                    ? 'border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent/15'
                                    : 'border-brand-border bg-brand-panelAlt/30 hover:border-brand-borderStrong hover:bg-brand-panelAlt/50'}`, children: [_jsx(Icon, { name: iconName, size: 20, weight: 550, className: `flex-shrink-0 mt-0.5 transition-colors ${isSelected ? 'text-brand-accent' : 'text-brand-textSoft'}` }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center justify-between w-full", children: [_jsx("span", { className: "font-bold text-[12px] text-brand-text leading-tight", children: tpl.name }), isSelected && (_jsx("span", { className: "text-brand-accent flex items-center flex-shrink-0", children: _jsx(Icon, { name: "check_circle", size: 13, filled: true }) }))] }), _jsx("span", { className: "text-[10px] text-brand-textSoft mt-1 leading-normal block", children: tpl.description })] })] }, tpl.id));
                        }) })] })), _jsxs("div", { className: "space-y-3", children: [_jsxs(Field, { label: "Ajan Adi *", icon: "smart_toy", children: [_jsx("input", { type: "text", required: true, disabled: isEditing, value: name, onChange: (e) => setName(e.target.value), placeholder: "orn. Kodcu Asistan", className: `${inputCls} ${isEditing ? 'opacity-65 cursor-not-allowed bg-brand-panelAlt/35 border-brand-border' : ''}` }), isEditing && (_jsx("span", { className: "text-[10px] text-brand-mutedSoft block mt-1", children: "* Ajan ismi kal\u0131c\u0131 bir kimliktir, sonradan de\u011Fi\u015Ftirilemez." }))] }), _jsx(Field, { label: "Rol / Unvan", icon: "badge", children: _jsx("input", { type: "text", value: role, onChange: (e) => setRole(e.target.value), placeholder: "orn. Senior Full-Stack Developer", className: inputCls }) }), _jsx(Field, { label: "Aciklama", icon: "description", children: _jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Bu ajanin temel gorevi nedir?", rows: 3, className: inputCls + ' resize-none' }) })] })] }));
}
