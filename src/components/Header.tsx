import React from 'react';
import { Layers, Zap } from 'lucide-react';

interface HeaderProps {
  itemCount: number;
  completedCount: number;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  itemCount,
  completedCount,
  hasApiKey,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 sm:gap-8">
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif-studio text-3xl sm:text-[32px] italic font-light tracking-wide text-ink">
              FLARE<span className="font-semibold not-italic ml-1.5 text-[17px] sm:text-[20px] tracking-[0.3em] text-muted">STUDIO</span>
            </h1>
            <span className="hidden sm:inline-flex items-center rounded-full bg-gold/12 text-gold-dark border border-gold/30 text-[15px] uppercase font-semibold px-2.5 py-0.5 tracking-widest">
              PRO 4K
            </span>
          </div>

          <nav className="hidden xl:flex gap-6 text-[15px] uppercase tracking-[0.2em] font-semibold">
            <span className="text-ink border-b-2 border-gold pb-1">สตูดิโอ (Studio)</span>
            <span className="text-muted hover:text-ink border-b-2 border-transparent hover:border-line pb-1 transition-all cursor-pointer">พรีเซ็ต (Presets)</span>
            <span className="text-muted hover:text-ink border-b-2 border-transparent hover:border-line pb-1 transition-all cursor-pointer">ประมวลผลเป็นชุด (Batch Engine)</span>
          </nav>
        </div>

        <div className="flex items-center gap-2.5 text-[15px] uppercase tracking-widest">
          {itemCount > 0 && (
            <div className="hidden lg:inline-flex h-8 px-3.5 items-center bg-white border border-line rounded-full text-ink gap-1.5 shadow-sm">
              <Layers className="w-3.5 h-3.5 text-muted" />
              <span>ภาพทั้งหมด: {itemCount}</span>
              {completedCount > 0 && (
                <span className="text-emerald-600 font-bold ml-0.5">(สำเร็จ {completedCount})</span>
              )}
            </div>
          )}

          <div className="hidden lg:inline-flex h-8 px-3.5 items-center bg-white border border-line rounded-full text-ink gap-1.5 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-gold" />
            <span>Gemini 3.1 Flash Image</span>
          </div>

          <div className={`inline-flex h-8 px-3.5 items-center rounded-full text-[15px] font-bold uppercase tracking-widest border gap-2 ${
            hasApiKey
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
            {hasApiKey ? 'พร้อมใช้งาน (READY)' : 'ไม่พบ API KEY (NO KEY)'}
          </div>
        </div>
      </div>
    </header>
  );
};
