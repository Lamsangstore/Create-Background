import React, { useRef, useState } from 'react';
import { StudioConfig, AspectRatio, ImageSize, ProductType, StudioPreset } from '../types';
import { PRODUCT_TYPES, buildPrompt, buildReferencePrompt } from '../data/presets';
import { Sliders, Check, ChevronDown, ChevronUp, Ratio, Monitor, Tag, Edit3, RotateCcw, ImagePlus, X, RefreshCw, Save } from 'lucide-react';

interface PresetSelectorProps {
  config: StudioConfig;
  onChange: (newConfig: StudioConfig) => void;
  presets: StudioPreset[];
  onSavePreset: (name: string) => void;
  onDeletePreset: (id: string) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  config,
  onChange,
  presets,
  onSavePreset,
  onDeletePreset,
}) => {
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const selectedPreset = presets.find(p => p.id === config.selectedPresetId) || presets[0];

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

  const handleConfirmSavePreset = () => {
    onSavePreset(newPresetName);
    setNewPresetName('');
    setIsSavingPreset(false);
  };

  const activateOnKey = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };

  const activePromptText = config.isReferenceActive
    ? buildReferencePrompt(config.productType)
    : buildPrompt(
        presets,
        config.selectedPresetId,
        config.customPrompt,
        config.isCustomPromptActive,
        config.productType
      );

  const activeModeLabel = config.isReferenceActive
    ? 'กำลังใช้รูปอ้างอิง (REFERENCE ACTIVE)'
    : config.isCustomPromptActive
    ? 'กำลังใช้คำสั่งกำหนดเอง (CUSTOM ACTIVE)'
    : selectedPreset?.titleTh;

  const canSavePreset = config.isCustomPromptActive && config.customPrompt.trim().length > 0;

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
            <h2 className="text-[17px] uppercase tracking-[0.2em] font-bold text-ink">ตั้งค่าฉากหลังสตูดิโอ &amp; AI DIRECTIVE</h2>
            <p className="text-[17px] text-muted mt-0.5">เลือกสไตล์สตูดิโอ ประเภทสินค้า สัดส่วนภาพ และความละเอียดเรนเดอร์</p>
          </div>
        </div>

        {/* Product Type Selection */}
        <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-full border border-line shadow-sm">
          <Tag className="w-3.5 h-3.5 text-gold" />
          <span className="text-[15px] uppercase tracking-widest text-muted">ประเภทสินค้า:</span>
          <select
            value={config.productType}
            onChange={(e) => handleProductTypeChange(e.target.value as ProductType)}
            className="bg-transparent text-[17px] text-ink font-medium focus:outline-none cursor-pointer"
          >
            {PRODUCT_TYPES.map((type) => (
              <option key={type.id} value={type.id} className="bg-white text-ink">
                {type.labelTh}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preset Cards Selection (reference upload is the last card) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="text-[15px] uppercase tracking-[0.2em] font-bold text-muted block">
            สไตล์จัดแสงและฉากหลังสตูดิโอ (STUDIO PRESETS)
          </label>
          <span className="text-[15px] uppercase tracking-widest text-gold-dark bg-gold/10 border border-gold/30 rounded-full px-2.5 py-0.5">
            {activeModeLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {presets.map((preset) => {
            const isSelected = !config.isCustomPromptActive && !config.isReferenceActive && config.selectedPresetId === preset.id;
            return (
              <div
                key={preset.id}
                role="button"
                tabIndex={0}
                onClick={() => handlePresetSelect(preset.id)}
                onKeyDown={activateOnKey(() => handlePresetSelect(preset.id))}
                className={`group relative text-left rounded-2xl border p-3 transition-all flex flex-col justify-between cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 ${
                  isSelected
                    ? 'border-gold ring-2 ring-gold/25 bg-white shadow-studio'
                    : 'border-line bg-white hover:border-gold/40 hover:shadow-studio'
                }`}
              >
                {preset.isUser && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDeletePreset(preset.id); }}
                    className="absolute top-2 right-2 z-10 w-6 h-6 rounded-md bg-white/90 border border-line flex items-center justify-center text-muted hover:text-rose-600 hover:border-rose-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="ลบพรีเซ็ตนี้"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

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
                    <span className="text-[17px] font-semibold tracking-wide text-ink truncate">
                      {preset.titleTh}
                    </span>
                    <span className={`text-[14px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${
                      preset.isUser
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isSelected ? 'bg-gold/12 text-gold-dark border-gold/30' : 'bg-cream-2 text-muted border-line'
                    }`}>
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[16px] line-clamp-2 leading-relaxed text-muted">
                    {preset.descriptionTh}
                  </p>
                </div>

                {isSelected && (
                  <div className="mt-3 flex items-center justify-end">
                    <span className="inline-flex items-center gap-1 text-[14px] uppercase font-bold tracking-widest bg-gold text-white rounded-full px-2.5 py-0.5">
                      <Check className="w-3 h-3" /> ACTIVE PRESET
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Reference upload — always the last card in the grid */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => (config.referenceImage ? handleActivateReference() : referenceInputRef.current?.click())}
            onKeyDown={activateOnKey(() => (config.referenceImage ? handleActivateReference() : referenceInputRef.current?.click()))}
            className={`group relative text-left rounded-2xl border p-3 transition-all flex flex-col justify-between cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 ${
              config.isReferenceActive
                ? 'border-gold ring-2 ring-gold/25 bg-white shadow-studio'
                : 'border-line bg-white hover:border-gold/40 hover:shadow-studio'
            }`}
          >
            <div>
              {/* Preview / upload dropzone */}
              <div className={`aspect-[16/10] mb-3 overflow-hidden rounded-xl relative ${config.referenceImage ? 'border border-line' : 'border-2 border-dashed border-gold/40'}`}>
                {config.referenceImage ? (
                  <>
                    <img src={config.referenceImage} alt="Reference" className="w-full h-full object-cover" />
                    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); referenceInputRef.current?.click(); }}
                        className="w-6 h-6 rounded-md bg-white/90 border border-line flex items-center justify-center text-muted hover:text-ink cursor-pointer"
                        title="เปลี่ยนรูป"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveReference(); }}
                        className="w-6 h-6 rounded-md bg-white/90 border border-line flex items-center justify-center text-muted hover:text-rose-600 cursor-pointer"
                        title="ลบรูป"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-cream-2/50 text-gold">
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-[14px] uppercase tracking-widest font-bold text-ink">อัปโหลดรูป</span>
                    <span className="text-[14px] text-subtle uppercase tracking-widest">PNG · JPG · WEBP</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[17px] font-semibold tracking-wide text-ink">รูปอ้างอิง (Reference)</span>
                <span className="text-[14px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full border shrink-0 bg-gold/12 text-gold-dark border-gold/30">
                  REFERENCE
                </span>
              </div>
              <p className="text-[16px] line-clamp-2 leading-relaxed text-muted">
                {config.referenceImage
                  ? 'ให้ AI เลียนแบบฉากหลังและการจัดแสงจากรูปนี้'
                  : 'อัปโหลดรูปที่มีฉากหลัง/แสงที่ต้องการ ให้ AI เลียนแบบมาใส่สินค้า'}
              </p>
            </div>

            {config.isReferenceActive && (
              <div className="mt-3 flex items-center justify-end">
                <span className="inline-flex items-center gap-1 text-[14px] uppercase font-bold tracking-widest bg-gold text-white rounded-full px-2.5 py-0.5">
                  <Check className="w-3 h-3" /> ACTIVE
                </span>
              </div>
            )}
          </div>
        </div>

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
          <label className="text-[15px] uppercase tracking-[0.2em] font-bold text-muted flex items-center gap-1.5">
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
                  className={`py-2 text-center text-[15px] font-bold uppercase tracking-widest rounded-lg border transition-all cursor-pointer ${
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
          <label className="text-[15px] uppercase tracking-[0.2em] font-bold text-muted flex items-center gap-1.5">
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
                  className={`flex flex-col items-center justify-center gap-1.5 py-2.5 text-center text-[15px] font-bold uppercase tracking-widest rounded-lg border transition-all cursor-pointer ${
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
          className="w-full flex items-center justify-between py-1 text-[17px] font-medium text-ink/80 hover:text-ink transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-gold" />
            <span className="text-[15px] uppercase tracking-[0.2em] font-bold">
              AI DIRECTIVE PROMPT ({config.isReferenceActive ? 'REFERENCE ACTIVE' : config.isCustomPromptActive ? 'CUSTOM ACTIVE' : 'PRESET ACTIVE'})
            </span>
          </div>
          <div className="flex items-center gap-1 text-[15px] uppercase tracking-widest text-muted">
            <span>{showPromptDetails ? 'HIDE DIRECTIVE' : 'INSPECT / EDIT PROMPT'}</span>
            {showPromptDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showPromptDetails && (
          <div className="mt-3 space-y-3 bg-cream-2/50 p-4 rounded-2xl border border-line">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[15px] uppercase tracking-widest text-muted">
                {config.isReferenceActive
                  ? 'Reference prompt sent with BOTH images to Gemini:'
                  : 'Exact English Prompt sent to Gemini API:'}
              </span>
              {config.isCustomPromptActive && (
                <button
                  type="button"
                  onClick={handleResetToPreset}
                  className="flex items-center gap-1 text-[15px] uppercase tracking-widest text-gold-dark hover:underline cursor-pointer shrink-0"
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
              className="w-full bg-white border border-line rounded-xl p-3.5 text-[17px] font-mono text-ink focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 leading-relaxed resize-none read-only:text-muted read-only:bg-cream-2/60"
            />

            {/* Save custom prompt as a new preset */}
            {canSavePreset && (
              isSavingPreset ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    autoFocus
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmSavePreset(); if (e.key === 'Escape') setIsSavingPreset(false); }}
                    placeholder="ตั้งชื่อพรีเซ็ต เช่น สตูดิโอสีฟ้า..."
                    className="flex-1 min-w-[180px] bg-white border border-line rounded-lg px-3 py-2 text-[17px] text-ink focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmSavePreset}
                    className="btn btn-primary text-[15px] uppercase tracking-widest px-3.5 py-2"
                  >
                    <Save className="w-3.5 h-3.5" /> บันทึก
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsSavingPreset(false); setNewPresetName(''); }}
                    className="btn btn-ghost text-[15px] uppercase tracking-widest px-3.5 py-2"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSavingPreset(true)}
                  className="btn btn-ghost text-[15px] uppercase tracking-widest px-3.5 py-2"
                >
                  <Save className="w-3.5 h-3.5 text-gold" /> บันทึกพรอมนี้เป็นพรีเซ็ต
                </button>
              )
            )}

            <p className="text-[16px] text-subtle italic">
              {config.isReferenceActive
                ? '* กำลังใช้รูปอ้างอิง — AI จะเลียนแบบฉากหลังและการจัดแสงจากรูปที่อัปโหลด (คำสั่งนี้แก้ไขไม่ได้ในโหมด Reference)'
                : '* พิมพ์แก้คำสั่งได้ตามต้องการ แล้วกด "บันทึกเป็นพรีเซ็ต" เพื่อเก็บไว้ใช้ซ้ำ (พรีเซ็ตจะไปโผล่ในกริดด้านบน)'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
