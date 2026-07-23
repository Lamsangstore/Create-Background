import React, { useState } from 'react';
import { StudioConfig, AspectRatio, ImageSize, ProductType } from '../types';
import { STUDIO_PRESETS, PRODUCT_TYPES, buildPrompt } from '../data/presets';
import { Sliders, Sparkles, Check, ChevronDown, ChevronUp, Ratio, Monitor, Tag, Edit3, RotateCcw } from 'lucide-react';

interface PresetSelectorProps {
  config: StudioConfig;
  onChange: (newConfig: StudioConfig) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  config,
  onChange,
}) => {
  const [showPromptDetails, setShowPromptDetails] = useState(false);

  const selectedPreset = STUDIO_PRESETS.find(p => p.id === config.selectedPresetId) || STUDIO_PRESETS[0];

  const handlePresetSelect = (presetId: string) => {
    const updated = { ...config, selectedPresetId: presetId, isCustomPromptActive: false };
    onChange(updated);
  };

  const handleProductTypeChange = (type: ProductType) => {
    const updated = { ...config, productType: type };
    onChange(updated);
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
    });
  };

  const handleResetToPreset = () => {
    onChange({
      ...config,
      isCustomPromptActive: false,
      customPrompt: '',
    });
  };

  const activePromptText = buildPrompt(
    config.selectedPresetId,
    config.customPrompt,
    config.isCustomPromptActive,
    config.productType
  );

  return (
    <div className="bg-[#0d0d0d] border border-white/10 p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/20 text-white">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-white">ตั้งค่าฉากหลังสตูดิโอ & AI DIRECTIVE</h2>
            <p className="text-[11px] text-white/50 mt-0.5">เลือกสไตล์สตูดิโอ ประเภทสินค้า สัดส่วนภาพ และความละเอียดเรนเดอร์</p>
          </div>
        </div>

        {/* Product Type Selection */}
        <div className="flex items-center space-x-2.5 bg-white/5 px-3 py-1.5 border border-white/10">
          <Tag className="w-3.5 h-3.5 text-amber-300" />
          <span className="text-[10px] uppercase tracking-widest text-white/60">ประเภทสินค้า:</span>
          <select
            value={config.productType}
            onChange={(e) => handleProductTypeChange(e.target.value as ProductType)}
            className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
          >
            {PRODUCT_TYPES.map((type) => (
              <option key={type.id} value={type.id} className="bg-[#0d0d0d] text-white">
                {type.labelTh}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preset Cards Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/60 block">
            สไตล์จัดแสงและฉากหลังสตูดิโอ (STUDIO PRESETS)
          </label>
          <span className="text-[10px] uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5">
            {config.isCustomPromptActive ? 'กำลังใช้คำสั่งกำหนดเอง (CUSTOM ACTIVE)' : selectedPreset.titleTh}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STUDIO_PRESETS.map((preset) => {
            const isSelected = !config.isCustomPromptActive && config.selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset.id)}
                className={`relative text-left p-4 border transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-white text-black border-white shadow-xl'
                    : 'bg-white/5 text-white border-white/10 hover:border-white/30 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold tracking-wide">
                      {preset.titleTh}
                    </span>
                    <span className={`text-[9px] uppercase font-mono tracking-widest px-1.5 py-0.5 border ${
                      isSelected ? 'bg-black text-white border-black' : 'bg-white/10 text-white/70 border-white/10'
                    }`}>
                      {preset.badge}
                    </span>
                  </div>
                  <p className={`text-[11px] line-clamp-2 leading-relaxed ${isSelected ? 'text-zinc-700' : 'text-white/60'}`}>
                    {preset.descriptionTh}
                  </p>
                </div>

                {isSelected && (
                  <div className="mt-3 flex items-center justify-end">
                    <span className="text-[9px] uppercase font-bold tracking-widest bg-black text-white px-2 py-0.5">
                      ACTIVE PRESET
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Resolution & Aspect Ratio Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-white/10">
        {/* Output Resolution */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/60 flex items-center space-x-1.5">
            <Monitor className="w-3.5 h-3.5 text-white/80" />
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
                  className={`py-2 text-center text-[10px] font-bold uppercase tracking-widest border transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-black border-white shadow-md'
                      : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {size === '1K' ? '1K (Std)' : size === '2K' ? '2K (HD)' : size === '4K' ? '4K (Ultra)' : '512px'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/60 flex items-center space-x-1.5">
            <Ratio className="w-3.5 h-3.5 text-white/80" />
            <span>ASPECT RATIO</span>
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {(['1:1', '3:4', '4:3', '9:16', '16:9'] as AspectRatio[]).map((ratio) => {
              const active = config.aspectRatio === ratio;
              return (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => handleAspectRatioChange(ratio)}
                  className={`py-2 text-center text-[10px] font-bold uppercase tracking-widest border transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-black border-white shadow-md'
                      : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {ratio}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Prompt Text Accordion & Editor */}
      <div className="pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={() => setShowPromptDetails(!showPromptDetails)}
          className="w-full flex items-center justify-between py-1 text-xs font-medium text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Edit3 className="w-4 h-4 text-amber-300" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">
              AI DIRECTIVE PROMPT PROPELLER ({config.isCustomPromptActive ? 'CUSTOM ACTIVE' : 'PRESET ACTIVE'})
            </span>
          </div>
          <div className="flex items-center space-x-1 text-[10px] uppercase tracking-widest opacity-60">
            <span>{showPromptDetails ? 'HIDE DIRECTIVE' : 'INSPECT PROMPT'}</span>
            {showPromptDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showPromptDetails && (
          <div className="mt-3 space-y-3 bg-black/60 p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-white/50">
                Exact English Prompt sent to Gemini API:
              </span>
              {config.isCustomPromptActive && (
                <button
                  type="button"
                  onClick={handleResetToPreset}
                  className="flex items-center space-x-1 text-[10px] uppercase tracking-widest text-amber-300 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESTORE DEFAULT PRESET</span>
                </button>
              )}
            </div>

            <textarea
              rows={6}
              value={config.isCustomPromptActive ? config.customPrompt : activePromptText}
              onChange={(e) => handleCustomPromptChange(e.target.value)}
              placeholder="Enter custom AI prompt instructions..."
              className="w-full bg-white/5 border border-white/20 p-3.5 text-xs font-mono text-white focus:outline-none focus:border-white/50 leading-relaxed"
            />
            
            <p className="text-[11px] text-white/40 italic">
              * คำสั่งนี้นำเสนอภาพต้นฉบับอย่างสมบูรณ์ ไม่ดัดแปลงสินค้า และสร้างฉากหลังพร้อมเงาสะท้อนระดับสตูดิโอ
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
