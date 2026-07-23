import React from 'react';
import { Sparkles, Layers, Zap, ShieldCheck } from 'lucide-react';

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
    <header className="h-20 border-b border-white/10 flex items-center justify-between px-4 sm:px-8 bg-[#0a0a0a] sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-6 sm:gap-8">
        <div className="flex items-center space-x-3">
          <h1 className="font-serif-studio text-2xl sm:text-3xl italic font-light tracking-wider text-white">
            FLARE<span className="font-semibold not-italic ml-1 text-xs sm:text-sm tracking-[0.3em] opacity-70">STUDIO</span>
          </h1>
          <span className="bg-white/10 text-white border border-white/20 text-[10px] uppercase font-mono px-2 py-0.5 tracking-widest hidden sm:inline-block">
            PRO 4K
          </span>
        </div>

        <nav className="hidden md:flex gap-6 text-[10px] uppercase tracking-[0.2em] opacity-60 font-semibold">
          <span className="opacity-100 border-b border-white pb-1 text-white">สตูดิโอ (Studio)</span>
          <span className="hover:opacity-100 border-b border-transparent hover:border-white pb-1 transition-all cursor-pointer">พรีเซ็ต (Presets)</span>
          <span className="hover:opacity-100 border-b border-transparent hover:border-white pb-1 transition-all cursor-pointer">ประมวลผลเป็นชุด (Batch Engine)</span>
        </nav>
      </div>

      <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest">
        {itemCount > 0 && (
          <div className="h-8 px-3.5 flex items-center bg-white/5 border border-white/10 rounded-full opacity-80 text-white gap-1.5">
            <Layers className="w-3.5 h-3.5 text-white" />
            <span>ภาพทั้งหมด: {itemCount}</span>
            {completedCount > 0 && (
              <span className="text-emerald-400 font-bold ml-1">(สำเร็จ {completedCount})</span>
            )}
          </div>
        )}

        <div className="hidden sm:flex h-8 px-3.5 items-center bg-white/5 border border-white/10 rounded-full opacity-80 text-white gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>Gemini 3.1 Flash Image</span>
        </div>

        <div className="h-8 px-4 flex items-center bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-none border border-white">
          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${hasApiKey ? 'bg-black' : 'bg-amber-600'}`} />
          {hasApiKey ? 'พร้อมใช้งาน (READY)' : 'เชื่อมต่อสำเร็จ (SECRETS OK)'}
        </div>
      </div>
    </header>
  );
};
