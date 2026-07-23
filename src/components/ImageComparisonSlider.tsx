import React, { useState, useRef, useCallback } from 'react';
import { Download, Maximize2, RefreshCw, Sparkles, SlidersHorizontal, Check } from 'lucide-react';

interface ImageComparisonSliderProps {
  originalUrl: string;
  resultUrl: string;
  title?: string;
  onOpenLightbox?: () => void;
  onDownload?: () => void;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  originalUrl,
  resultUrl,
  title,
  onOpenLightbox,
  onDownload,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let position = (x / rect.width) * 100;
    if (position < 0) position = 0;
    if (position > 100) position = 100;
    setSliderPosition(position);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  return (
    <div className="relative group bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none">
      {/* Compare Container */}
      <div
        ref={containerRef}
        onMouseDown={(e) => { setIsDragging(true); handleMove(e.clientX); }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative w-full aspect-square sm:aspect-[4/3] bg-slate-900 cursor-ew-resize overflow-hidden"
      >
        {/* Result Image (AI Generated Studio) - Bottom Layer */}
        <img
          src={resultUrl}
          alt="AI Studio Output"
          className="absolute inset-0 w-full h-full object-contain bg-slate-900"
        />

        {/* Original Image - Top Layer with Clip Path */}
        <div
          className="absolute inset-0 w-full h-full overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={originalUrl}
            alt="Original Product"
            className="absolute inset-0 w-full h-full object-contain bg-slate-950/90"
          />
        </div>

        {/* Divider Bar */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] z-10"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-400 text-slate-950 shadow-xl border-2 border-slate-950 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 rotate-90" />
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <span className="bg-slate-950/80 backdrop-blur-md text-slate-300 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-700/80">
            ภาพต้นแบบ (Original)
          </span>
        </div>

        <div className="absolute top-3 right-3 z-20 pointer-events-none">
          <span className="bg-amber-500 text-slate-950 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-lg shadow-amber-500/20 flex items-center space-x-1">
            <Sparkles className="w-3 h-3" />
            <span>AI Studio 4K</span>
          </span>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="truncate">
          <p className="text-xs font-semibold text-white truncate">{title || 'ภาพผลลัพธ์สตูดิโอ'}</p>
          <p className="text-[11px] text-slate-400">เลื่อนแถบเพื่อเปรียบเทียบความแตกต่าง</p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {onOpenLightbox && (
            <button
              type="button"
              onClick={onOpenLightbox}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 border border-slate-700 transition-colors cursor-pointer"
              title="ขยายใหญ่แบบละเอียด"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>โหลด HD</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
