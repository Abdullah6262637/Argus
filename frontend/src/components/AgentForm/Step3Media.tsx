import { Icon } from '../Icon';
import { StepHeading, inputCls } from './FormComponents';
import type { MediaCapabilityInput } from '@/types';

export const IMAGE_MODEL_HINTS = ['dall-e-3', 'gpt-image-1', 'flux-pro', 'stable-diffusion-3'];
export const VIDEO_MODEL_HINTS = ['sora-1', 'veo-2', 'runway-gen3', 'kling-1.5'];
export const AUDIO_MODEL_HINTS = ['whisper-1', 'tts-1', 'tts-1-hd', 'elevenlabs-multilingual-v2'];

export function Step3Media({
  image,
  setImage,
  video,
  setVideo,
  audio,
  setAudio,
  isEditing,
  initialImageMask,
  initialVideoMask,
  initialAudioMask
}: {
  image: MediaCapabilityInput;
  setImage: (v: MediaCapabilityInput) => void;
  video: MediaCapabilityInput;
  setVideo: (v: MediaCapabilityInput) => void;
  audio: MediaCapabilityInput;
  setAudio: (v: MediaCapabilityInput) => void;
  isEditing: boolean;
  initialImageMask?: string | null;
  initialVideoMask?: string | null;
  initialAudioMask?: string | null;
}) {
  return (
    <div className="space-y-3 max-w-xl mx-auto animate-step-in">
      <StepHeading
        title="Medya yetenekleri (opsiyonel)"
        desc="Ajanina gorsel/video/ses uretim veya anlama yetenegi eklemek istersen doldur. Hepsi opsiyonel — bos birakabilirsin."
      />

      <MediaCapabilityBlock
        title="Gorsel"
        iconName="image"
        placeholder="orn. dall-e-3, flux-pro"
        modelHints={IMAGE_MODEL_HINTS}
        value={image}
        onChange={setImage}
        isEditing={isEditing}
        existingMask={initialImageMask}
      />
      <MediaCapabilityBlock
        title="Video"
        iconName="movie"
        placeholder="orn. sora-1, veo-2"
        modelHints={VIDEO_MODEL_HINTS}
        value={video}
        onChange={setVideo}
        isEditing={isEditing}
        existingMask={initialVideoMask}
      />
      <MediaCapabilityBlock
        title="Ses"
        iconName="graphic_eq"
        placeholder="orn. whisper-1, tts-1-hd"
        modelHints={AUDIO_MODEL_HINTS}
        value={audio}
        onChange={setAudio}
        isEditing={isEditing}
        existingMask={initialAudioMask}
      />
    </div>
  );
}

function MediaCapabilityBlock({
  title,
  iconName,
  placeholder,
  modelHints,
  value,
  onChange,
  isEditing,
  existingMask
}: {
  title: string;
  iconName: string;
  placeholder: string;
  modelHints: string[];
  value: MediaCapabilityInput;
  onChange: (v: MediaCapabilityInput) => void;
  isEditing: boolean;
  existingMask?: string | null;
}) {
  const listId = `media-${title.toLowerCase()}-models`;
  const update = (patch: Partial<MediaCapabilityInput>) => onChange({ ...value, ...patch });
  return (
    <div
      className={`rounded border p-3 transition ${
        value.enabled
          ? 'border-brand-accent/40 bg-brand-panelAlt'
          : 'border-brand-border bg-brand-bg/30'
      }`}
    >
      <label className="flex items-center justify-between gap-2 cursor-pointer">
        <span className="flex items-center gap-2 text-brand-accent">
          <Icon name={iconName} size={18} />
          <span className="text-sm font-semibold text-brand-text">{title}</span>
        </span>
        <div className="relative flex items-center">
          <input
            type="checkbox"
            checked={!!value.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            className="sr-only"
            id={`toggle-${title}`}
          />
          <div
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${
              value.enabled ? 'bg-brand-accent' : 'bg-brand-borderStrong'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-brand-bg shadow-md transform transition-transform duration-300 ${
                value.enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </div>
      </label>
      {value.enabled && (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={value.provider ?? ''}
              onChange={(e) => update({ provider: e.target.value })}
              placeholder="Saglayici (opsiyonel)"
              className={inputCls}
            />
            <input
              type="text"
              value={value.model ?? ''}
              onChange={(e) => update({ model: e.target.value })}
              list={listId}
              placeholder={placeholder}
              className={inputCls}
            />
            <datalist id={listId}>
              {modelHints.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          <input
            type="text"
            value={value.base_url ?? ''}
            onChange={(e) => update({ base_url: e.target.value })}
            placeholder="Base URL (opsiyonel)"
            className={inputCls}
          />
          <div>
            <input
              type="password"
              value={value.api_key ?? ''}
              onChange={(e) => update({ api_key: e.target.value })}
              placeholder={
                isEditing && existingMask
                  ? `API Key (mevcut: ${existingMask})`
                  : 'API Key (opsiyonel, bos birakabilirsin)'
              }
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
        </div>
      )}
    </div>
  );
}
