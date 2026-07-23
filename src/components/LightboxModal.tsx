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

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#0d0d0d] border border-white/10 max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-[#0a0a0a]">
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{item.name}</span>
            </h3>
            <p className="text-[10px] font-mono text-white/50 uppercase mt-0.5">
              RESOLUTION: {item.imageSize || '1K'} | ASPECT: {item.aspectRatio || '1:1'}
            </p>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center space-x-1 bg-black p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('slider')}
              className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'slider' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>แถบเปรียบเทียบ (SLIDER)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'side-by-side' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>แสดงคู่กัน (SIDE-BY-SIDE)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('result-only')}
              className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'result-only' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>เฉพาะผลลัพธ์ (RESULT ONLY)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/15 text-white border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Image Viewer */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-black">
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
              <div className="bg-[#0d0d0d] border border-white/10 p-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 block text-center">ภาพต้นฉบับ (ORIGINAL PLATE)</span>
                <div className="aspect-square bg-black flex items-center justify-center border border-white/5">
                  <img src={item.originalUrl} alt="Original" className="max-h-full max-w-full object-contain" />
                </div>
              </div>

              <div className="bg-[#0d0d0d] border border-white/20 p-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white block text-center flex items-center justify-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>ภาพผลลัพธ์สตูดิโอ (AI RESULT)</span>
                </span>
                <div className="aspect-square bg-black flex items-center justify-center border border-white/10">
                  <img src={item.resultUrl} alt="AI Result" className="max-h-full max-w-full object-contain" />
                </div>
              </div>
            </div>
          )}

          {viewMode === 'result-only' && item.resultUrl && (
            <div className="max-w-2xl mx-auto bg-[#0d0d0d] border border-white/10 p-4 space-y-3">
              <div className="aspect-square bg-black flex items-center justify-center border border-white/10">
                <img src={item.resultUrl} alt="AI Result High Res" className="max-h-full max-w-full object-contain" />
              </div>
            </div>
          )}

          {/* Prompt Information Section */}
          {item.promptUsed && (
            <div className="bg-[#0d0d0d] border border-white/10 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/70">คำสั่ง AI PROMPT ที่ใช้:</span>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="flex items-center space-x-1 text-[10px] uppercase tracking-widest text-amber-300 hover:underline cursor-pointer"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrompt ? 'คัดลอกแล้ว!' : 'คัดลอก PROMPT'}</span>
                </button>
              </div>
              <p className="text-xs font-mono text-white/80 bg-black p-3.5 border border-white/10 leading-relaxed whitespace-pre-wrap">
                {item.promptUsed}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0a0a0a] border-t border-white/10 flex items-center justify-between gap-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40 hidden sm:block">
            ไฟล์ภาพเรนเดอร์ความละเอียดสูงพร้อมสำหรับการดาวน์โหลด
          </p>

          <div className="flex items-center space-x-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง (CLOSE)
            </button>

            {item.resultUrl && (
              <button
                type="button"
                onClick={() => onDownload(item)}
                className="flex items-center space-x-2 bg-white text-black font-bold text-[10px] uppercase tracking-widest px-6 py-2.5 hover:bg-zinc-200 transition-colors cursor-pointer"
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
