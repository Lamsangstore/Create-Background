import React, { useState } from 'react';
import { ProductImageItem } from '../types';
import { X, Download, SlidersHorizontal, Columns, Image as ImageIcon, Sparkles, Copy, Check } from 'lucide-react';
import { ImageComparisonSlider } from './ImageComparisonSlider';

interface LightboxModalProps {
  item: ProductImageItem;
  onClose: () => void;
  onDownload: (item: ProductImageItem) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  item,
  onClose,
  onDownload,
}) => {
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'result-only'>('slider');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleCopyPrompt = () => {
    if (item.promptUsed) {
      navigator.clipboard.writeText(item.promptUsed);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const viewTab = (mode: typeof viewMode, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setViewMode(mode)}
      className={`px-3 py-1.5 rounded-lg text-[14px] uppercase font-bold tracking-widest flex items-center gap-1.5 transition-all cursor-pointer ${
        viewMode === mode ? 'bg-ink text-cream' : 'text-muted hover:text-ink'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-rise">
      <div className="bg-surface rounded-2xl border border-line max-w-5xl w-full overflow-hidden shadow-studio-lg flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-line flex flex-wrap items-center justify-between gap-4 bg-cream/70">
          <div>
            <h3 className="text-[15px] uppercase tracking-[0.2em] font-bold text-ink flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              <span>{item.name}</span>
            </h3>
            <p className="text-[14px] font-mono text-muted uppercase mt-0.5">
              RESOLUTION: {item.imageSize || '1K'} | ASPECT: {item.aspectRatio || '1:1'}
            </p>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center gap-1 bg-cream-2 p-1 rounded-xl border border-line">
            {viewTab('slider', <SlidersHorizontal className="w-3.5 h-3.5" />, 'SLIDER')}
            {viewTab('side-by-side', <Columns className="w-3.5 h-3.5" />, 'คู่กัน')}
            {viewTab('result-only', <ImageIcon className="w-3.5 h-3.5" />, 'ผลลัพธ์')}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-white hover:bg-cream-2 text-ink border border-line transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Image Viewer */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-cream-2/40">
          {viewMode === 'slider' && item.resultUrl && (
            <div className="max-w-3xl mx-auto">
              <ImageComparisonSlider
                originalUrl={item.originalUrl}
                resultUrl={item.resultUrl}
                title={item.name}
              />
            </div>
          )}

          {viewMode === 'side-by-side' && item.resultUrl && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-line p-3 space-y-2">
                <span className="text-[14px] font-bold uppercase tracking-widest text-muted block text-center">ภาพต้นฉบับ (ORIGINAL PLATE)</span>
                <div className="aspect-square bg-cream-2 rounded-xl flex items-center justify-center border border-line">
                  <img src={item.originalUrl} alt="Original" className="max-h-full max-w-full object-contain" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gold/40 p-3 space-y-2">
                <span className="text-[14px] font-bold uppercase tracking-widest text-ink text-center flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  <span>ภาพผลลัพธ์สตูดิโอ (AI RESULT)</span>
                </span>
                <div className="aspect-square bg-cream-2 rounded-xl flex items-center justify-center border border-line">
                  <img src={item.resultUrl} alt="AI Result" className="max-h-full max-w-full object-contain" />
                </div>
              </div>
            </div>
          )}

          {viewMode === 'result-only' && item.resultUrl && (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-line p-4 space-y-3">
              <div className="aspect-square bg-cream-2 rounded-xl flex items-center justify-center border border-line">
                <img src={item.resultUrl} alt="AI Result High Res" className="max-h-full max-w-full object-contain" />
              </div>
            </div>
          )}

          {/* Prompt Information Section */}
          {item.promptUsed && (
            <div className="bg-white rounded-2xl border border-line p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[14px] uppercase tracking-widest font-bold text-muted">คำสั่ง AI PROMPT ที่ใช้:</span>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1 text-[14px] uppercase tracking-widest text-gold-dark hover:underline cursor-pointer shrink-0"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrompt ? 'คัดลอกแล้ว!' : 'คัดลอก PROMPT'}</span>
                </button>
              </div>
              <p className="text-[15px] font-mono text-ink/80 bg-cream-2/60 p-3.5 rounded-xl border border-line leading-relaxed whitespace-pre-wrap">
                {item.promptUsed}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-cream/70 border-t border-line flex items-center justify-between gap-4">
          <p className="text-[14px] uppercase tracking-widest text-subtle hidden sm:block">
            ไฟล์ภาพเรนเดอร์ความละเอียดสูงพร้อมสำหรับการดาวน์โหลด
          </p>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost px-4 py-2.5 text-[14px] uppercase tracking-widest"
            >
              ปิดหน้าต่าง (CLOSE)
            </button>

            {item.resultUrl && (
              <button
                type="button"
                onClick={() => onDownload(item)}
                className="btn btn-primary px-6 py-2.5 text-[14px] uppercase tracking-widest"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดภาพความละเอียดสูง</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
