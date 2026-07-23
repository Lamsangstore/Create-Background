import React, { useRef, useState } from 'react';
import { StudioConfig, AspectRatio, ImageSize, ProductType } from '../types';
import { STUDIO_PRESETS, PRODUCT_TYPES, buildPrompt, buildReferencePrompt } from '../data/presets';
import { Sliders, Check, ChevronDown, ChevronUp, Ratio, Monitor, Tag, Edit3, RotateCcw, ImagePlus, X } from 'lucide-react';

interface PresetSelectorProps {
  config: StudioConfig;
  onChange: (newConfig: StudioConfig) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  config,
  onChange,
}) => {
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const selectedPreset = STUDIO_PRESETS.find(p => p.id === config.selectedPresetId) || STUDIO_PRESETS[0];

  const handlePresetSelect = (presetId: string) => {
    onChange({ ...config, selectedPresetId: presetId, isCustomPromptActive: false, isReferenceActive: false });
  };

  const handleProductTypeChange = (type: ProductType) => {
    onChange({ ...config, productType: type });
  };

  const handleAspectRatioChange = (ratio: AspectRatio) => {
    onChange({ ...config, aspectRatio: ratio });
  };

  const handleImageSizeChange = (size: ImageSize) => {
    onChange({ ...config, imageSize: size });
  };

  const handleCustomPromptChange = (val: string) => {
    onChange({
      ...config,
      customPrompt: val,
      isCustomPromptActive: true,
      isReferenceActive: false,
    });
  };

  const handleResetToPreset = () => {
    onChange({
      ...config,
      isCustomPromptActive: false,
      customPrompt: '',
    });
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      if (base64) {
        onChange({
          ...config,
          referenceImage: base64,
          referenceMimeType: file.type || 'image/png',
          isReferenceActive: true,
          isCustomPromptActive: false,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveReference = () => {
    onChange({ ...config, referenceImage: undefined, referenceMimeType: undefined, isReferenceActive: false });
  };

  const handleActivateReference = () => {
    onChange({ ...config, isReferenceActive: true, isCustomPromptActive: false });
  };

  const activePromptText = config.isReferenceActive
    ? buildReferencePrompt(config.productType)
    : buildPrompt(
        config.selectedPresetId,
        config.customPrompt,
        config.isCustomPromptActive,
        config.productType
      );

  const activeModeLabel = config.isReferenceActive
    ? 'กำลังใช้รูปอ้างอิง (REFERENCE ACTIVE)'
    : config.isCustomPromptActive
    ? 'กำลังใช้คำสั่งกำหนดเอง (CUSTOM ACTIVE)'
    : selectedPreset.titleTh;

  const sizeButtonLabel = (size: ImageSize) =>
    size === '1K' ? '1K (Std)' : size === '2K' ? '2K (HD)' : size === '4K' ? '4K (Ultra)' : '512px';

  return (
    <div className="card p-6 space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gold/10 border border-gold/25 text-gold">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-ink">ตั้งค่าฉากหลังสตูดิโอ &amp; AI DIRECTIVE</h2>
            <p className="text-[12px] text-muted mt-0.5">เลือกสไตล์สตูดิโอ ประเภทสินค้า สัดส่วนภาพ และความละเอียดเรนเดอร์</p>
          </div>
        </div>

        {/* Product Type Selection */}
        <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-full border border-line shadow-sm">
          <Tag className="w-3.5 h-3.5 text-gold" />
          <span className="text-[10px] uppercase tracking-widest text-muted">ประเภทสินค้า:</span>
          <select
            value={config.productType}
            onChange={(e) => handleProductTypeChange(e.target.value as ProductType)}
            className="bg-transparent text-xs text-ink font-medium focus:outline-none cursor-pointer"
          >
            {PRODUCT_TYPES.map((type) => (
              <option key={type.id} value={type.id} className="bg-white text-ink">
                {type.labelTh}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preset Cards Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted block">
            สไตล์จัดแสงและฉากหลังสตูดิโอ (STUDIO PRESETS)
          </label>
          <span className="text-[10px] uppercase tracking-widest text-gold-dark bg-gold/10 border border-gold/30 rounded-full px-2.5 py-0.5">
            {activeModeLabel}
          </span>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 transition-opacity ${config.isReferenceActive ? 'opacity-45' : ''}`}>
          {STUDIO_PRESETS.map((preset) => {
            const isSelected = !config.isCustomPromptActive && !config.isReferenceActive && config.selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset.id)}
                className={`group relative text-left rounded-2xl border p-3 transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-gold ring-2 ring-gold/25 bg-white shadow-studio'
                    : 'border-line bg-white hover:border-gold/40 hover:shadow-studio'
                }`}
              >
                <div>
                  {/* Style preview thumbnail */}
                  <div className="aspect-[16/10] mb-3 overflow-hidden rounded-xl border border-line">
                    <img
                      src={preset.previewImage}
                      alt={preset.titleEn}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold tracking-wide text-ink">
                      {preset.titleTh}
                    </span>
                    <span className={`text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${
                      isSelected ? 'bg-gold/12 text-gold-dark border-gold/30' : 'bg-cream-2 text-muted border-line'
                    }`}>
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[11px] line-clamp-2 leading-relaxed text-muted">
                    {preset.descriptionTh}
                  </p>
                </div>

                {isSelected && (
                  <div className="mt-3 flex items-center justify-end">
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest bg-gold text-white rounded-full px-2.5 py-0.5">
                      <Check className="w-3 h-3" /> ACTIVE PRESET
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reference Image — clone background & lighting from an uploaded sample */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-3">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted flex items-center gap-1.5">
            <ImagePlus className="w-3.5 h-3.5 text-gold" />
            <span>อ้างอิงฉากหลัง &amp; แสงจากรูปตัวอย่าง (REFERENCE)</span>
          </label>
          {config.isReferenceActive && (
            <span className="text-[10px] uppercase tracking-widest text-gold-dark bg-gold/10 border border-gold/30 rounded-full px-2.5 py-0.5 shrink-0">
              กำลังใช้งาน (ACTIVE)
            </span>
          )}
        </div>

        <p className="text-[12px] text-muted leading-relaxed">
          อัปโหลดรูปที่มีฉากหลังและการจัดแสงที่คุณต้องการ AI จะเลียนแบบฉากหลัง สี และทิศทางแสงจากรูปนั้นมาใส่ให้สินค้าของคุณ โดยคงตัวสินค้าไว้ 100%
        </p>

        {!config.referenceImage ? (
          <button
            type="button"
            onClick={() => referenceInputRef.current?.click()}
            className="w-full rounded-2xl border-2 border-dashed border-line bg-cream-2/40 hover:border-gold/50 hover:bg-gold/5 p-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
              <ImagePlus className="w-5 h-5" />
            </span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-ink">อัปโหลดรูป Reference</span>
            <span className="text-[10px] text-subtle uppercase tracking-widest">PNG, JPG, WEBP</span>
          </button>
        ) : (
          <div className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${
            config.isReferenceActive ? 'border-gold/50 bg-gold/5' : 'border-line bg-cream-2/40'
          }`}>
            <img
              src={config.referenceImage}
              alt="Reference"
              className="w-20 h-20 object-cover rounded-xl border border-line shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <p className="text-xs font-semibold text-ink">รูปอ้างอิงพร้อมใช้งาน</p>
                <p className="text-[11px] text-muted">AI จะจับคู่ฉากหลังและการจัดแสงจากรูปนี้</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {config.isReferenceActive ? (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-emerald-600">
                    <Check className="w-3.5 h-3.5" /> กำลังใช้งาน
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleActivateReference}
                    className="btn btn-primary text-[10px] uppercase tracking-widest px-3.5 py-1.5"
                  >
                    ใช้รูปนี้ (USE)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => referenceInputRef.current?.click()}
                  className="btn btn-ghost text-[10px] uppercase tracking-widest px-3.5 py-1.5"
                >
                  เปลี่ยนรูป
                </button>
                <button
                  type="button"
                  onClick={handleRemoveReference}
                  className="inline-flex items-center gap-1 rounded-lg text-[10px] uppercase tracking-widest text-muted hover:text-rose-600 border border-line hover:border-rose-200 px-3.5 py-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> ลบ
                </button>
              </div>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={referenceInputRef}
          onChange={handleReferenceUpload}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* Resolution & Aspect Ratio Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5 border-t border-line">
        {/* Output Resolution */}
        <div className="space-y-2.5">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-gold" />
            <span>RESOLUTION OUTPUT</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['512px', '1K', '2K', '4K'] as ImageSize[]).map((size) => {
              const active = config.imageSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleImageSizeChange(size)}
                  className={`py-2 text-center text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all cursor-pointer ${
                    active
                      ? 'bg-ink text-cream border-ink shadow-sm'
                      : 'bg-white text-muted border-line hover:border-gold/40 hover:text-ink'
                  }`}
                >
                  {sizeButtonLabel(size)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2.5">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted flex items-center gap-1.5">
            <Ratio className="w-3.5 h-3.5 text-gold" />
            <span>ASPECT RATIO</span>
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {(['1:1', '3:4', '4:3', '9:16', '16:9'] as AspectRatio[]).map((ratio) => {
              const active = config.aspectRatio === ratio;
              const [rw, rh] = ratio.split(':').map(Number);
              const MAX = 16;
              const boxW = rw >= rh ? MAX : Math.round(MAX * (rw / rh));
              const boxH = rh >= rw ? MAX : Math.round(MAX * (rh / rw));
              const orientation = rw === rh ? 'จัตุรัส' : rw > rh ? 'แนวนอน' : 'แนวตั้ง';
              return (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => handleAspectRatioChange(ratio)}
                  title={`${ratio} · ${orientation}`}
                  className={`flex flex-col items-center justify-center gap-1.5 py-2.5 text-center text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all cursor-pointer ${
                    active
                      ? 'bg-ink text-cream border-ink shadow-sm'
                      : 'bg-white text-muted border-line hover:border-gold/40 hover:text-ink'
                  }`}
                >
                  <span className="flex items-center justify-center h-4">
                    <span
                      aria-hidden
                      className="block border-[1.5px] border-current rounded-[2px]"
                      style={{ width: `${boxW}px`, height: `${boxH}px` }}
                    />
                  </span>
                  <span>{ratio}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Prompt Text Accordion & Editor */}
      <div className="pt-5 border-t border-line">
        <button
          type="button"
          onClick={() => setShowPromptDetails(!showPromptDetails)}
          className="w-full flex items-center justify-between py-1 text-xs font-medium text-ink/80 hover:text-ink transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-gold" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">
              AI DIRECTIVE PROMPT ({config.isReferenceActive ? 'REFERENCE ACTIVE' : config.isCustomPromptActive ? 'CUSTOM ACTIVE' : 'PRESET ACTIVE'})
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted">
            <span>{showPromptDetails ? 'HIDE DIRECTIVE' : 'INSPECT PROMPT'}</span>
            {showPromptDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showPromptDetails && (
          <div className="mt-3 space-y-3 bg-cream-2/50 p-4 rounded-2xl border border-line">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] uppercase tracking-widest text-muted">
                {config.isReferenceActive
                  ? 'Reference prompt sent with BOTH images to Gemini:'
                  : 'Exact English Prompt sent to Gemini API:'}
              </span>
              {config.isCustomPromptActive && (
                <button
                  type="button"
                  onClick={handleResetToPreset}
                  className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-gold-dark hover:underline cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESTORE DEFAULT PRESET</span>
                </button>
              )}
            </div>

            <textarea
              rows={6}
              readOnly={config.isReferenceActive}
              value={config.isCustomPromptActive ? config.customPrompt : activePromptText}
              onChange={(e) => handleCustomPromptChange(e.target.value)}
              placeholder="Enter custom AI prompt instructions..."
              className="w-full bg-white border border-line rounded-xl p-3.5 text-xs font-mono text-ink focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 leading-relaxed resize-none read-only:text-muted read-only:bg-cream-2/60"
            />

            <p className="text-[11px] text-subtle italic">
              {config.isReferenceActive
                ? '* กำลังใช้รูปอ้างอิง — AI จะเลียนแบบฉากหลังและการจัดแสงจากรูปที่อัปโหลด (คำสั่งนี้แก้ไขไม่ได้ในโหมด Reference)'
                : '* คำสั่งนี้นำเสนอภาพต้นฉบับอย่างสมบูรณ์ ไม่ดัดแปลงสินค้า และสร้างฉากหลังพร้อมเงาสะท้อนระดับสตูดิโอ'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
