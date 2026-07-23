import React from 'react';
import { ProductImageItem } from '../types';
import { Play, Download, Trash2, RefreshCw, Eye, Sparkles, CheckCircle2, AlertTriangle, FileArchive, Loader2 } from 'lucide-react';
import { ImageComparisonSlider } from './ImageComparisonSlider';

interface BatchImageListProps {
  items: ProductImageItem[];
  isProcessingBatch: boolean;
  onProcessSingle: (id: string) => void;
  onProcessAll: () => void;
  onDownloadSingle: (item: ProductImageItem) => void;
  onDownloadZip: () => void;
  onRemoveSingle: (id: string) => void;
  onClearAll: () => void;
  onOpenLightbox: (item: ProductImageItem) => void;
}

export const BatchImageList: React.FC<BatchImageListProps> = ({
  items,
  isProcessingBatch,
  onProcessSingle,
  onProcessAll,
  onDownloadSingle,
  onDownloadZip,
  onRemoveSingle,
  onClearAll,
  onOpenLightbox,
}) => {
  if (items.length === 0) return null;

  const completedItems = items.filter(i => i.status === 'completed');
  const idleItems = items.filter(i => i.status === 'idle' || i.status === 'error');

  return (
    <div className="space-y-5">
      {/* Batch Header Controls */}
      <div className="bg-[#0d0d0d] border border-white/10 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-white flex items-center gap-2">
            <span>รายการรูปภาพสินค้าในคิว (BATCH QUEUE)</span>
            <span className="bg-white/10 border border-white/20 text-white text-[10px] font-mono px-2 py-0.5">
              {items.length} รายการ
            </span>
          </h3>
          <p className="text-[11px] text-white/50 mt-1">
            {completedItems.length > 0 
              ? `เรนเดอร์สำเร็จแล้ว ${completedItems.length} จาก ${items.length} รายการ`
              : 'กดปุ่ม "เปลี่ยนฉากหลังรูปทั้งหมด" เพื่อเริ่มประมวลผล AI'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {completedItems.length > 0 && (
            <button
              type="button"
              onClick={onDownloadZip}
              className="flex items-center space-x-1.5 bg-emerald-500 text-black font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 border border-emerald-400 hover:bg-emerald-400 transition-all cursor-pointer"
            >
              <FileArchive className="w-3.5 h-3.5" />
              <span>ดาวน์โหลดทั้งหมด (DOWNLOAD ZIP)</span>
            </button>
          )}

          {idleItems.length > 0 && (
            <button
              type="button"
              disabled={isProcessingBatch}
              onClick={onProcessAll}
              className="flex items-center space-x-1.5 bg-white disabled:bg-zinc-800 text-black disabled:text-zinc-500 font-bold text-[10px] uppercase tracking-widest px-5 py-2.5 border border-white hover:bg-zinc-200 transition-all cursor-pointer"
            >
              {isProcessingBatch ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังเรนเดอร์...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-black" />
                  <span>เปลี่ยนฉากหลังทั้งหมด ({idleItems.length})</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onClearAll}
            className="p-2.5 text-white/40 hover:text-rose-400 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
            title="ลบรูปภาพทั้งหมด"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Items List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((item) => (
          <div
            key={item.id}
            className={`bg-[#0d0d0d] border p-5 space-y-4 transition-all ${
              item.status === 'processing'
                ? 'border-white animate-pulse'
                : item.status === 'completed'
                ? 'border-white/20 hover:border-white/40'
                : item.status === 'error'
                ? 'border-rose-500/50 bg-rose-950/10'
                : 'border-white/10 hover:border-white/30'
            }`}
          >
            {/* Top Info Bar */}
            <div className="flex items-center justify-between gap-2">
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate tracking-wide">{item.name}</p>
                <span className="text-[9px] text-white/50 font-mono uppercase tracking-widest">
                  {item.mimeType.replace('image/', '')}
                </span>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {item.status === 'processing' && (
                  <span className="bg-amber-500/20 text-amber-300 text-[9px] uppercase tracking-widest px-2.5 py-1 border border-amber-500/40 flex items-center space-x-1.5 font-bold">
                    <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
                    <span>กำลังประมวลผล...</span>
                  </span>
                )}

                {item.status === 'completed' && (
                  <span className="bg-white text-black text-[9px] uppercase tracking-widest px-2.5 py-1 font-bold flex items-center space-x-1 border border-white">
                    <CheckCircle2 className="w-3 h-3 text-black" />
                    <span>สำเร็จ (SUCCESS)</span>
                  </span>
                )}

                {item.status === 'error' && (
                  <span className="bg-rose-500/20 text-rose-300 text-[9px] uppercase tracking-widest px-2.5 py-1 border border-rose-500/40 flex items-center space-x-1 font-bold">
                    <AlertTriangle className="w-3 h-3 text-rose-300" />
                    <span>ล้มเหลว (FAILED)</span>
                  </span>
                )}

                {item.status === 'idle' && (
                  <span className="bg-white/5 text-white/60 text-[9px] uppercase tracking-widest px-2.5 py-1 border border-white/10">
                    รอประมวลผล (QUEUED)
                  </span>
                )}
              </div>
            </div>

            {/* Main Visual Display */}
            {item.status === 'completed' && item.resultUrl ? (
              <ImageComparisonSlider
                originalUrl={item.originalUrl}
                resultUrl={item.resultUrl}
                title={item.name}
                onOpenLightbox={() => onOpenLightbox(item)}
                onDownload={() => onDownloadSingle(item)}
              />
            ) : item.status === 'processing' ? (
              <div className="relative aspect-square sm:aspect-[4/3] bg-black border border-white/20 flex flex-col items-center justify-center p-6 text-center space-y-3 overflow-hidden">
                <img
                  src={item.originalUrl}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm"
                />
                <div className="relative z-10 w-12 h-12 bg-white text-black flex items-center justify-center animate-pulse">
                  <Sparkles className="w-6 h-6 fill-black" />
                </div>
                <div className="relative z-10 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-white">กำลังสร้างฉากหลังสตูดิโอ...</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/50">Gemini 3.1 Flash Image Engine</p>
                </div>
              </div>
            ) : item.status === 'error' ? (
              <div className="aspect-square sm:aspect-[4/3] bg-black border border-rose-500/30 p-5 flex flex-col items-center justify-center text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-rose-400" />
                <p className="text-xs text-rose-300 font-medium">
                  {item.errorMessage || 'ไม่สามารถสร้างภาพได้ กรุณาตรวจสอบการเชื่อมต่อ'}
                </p>
                <button
                  type="button"
                  onClick={() => onProcessSingle(item.id)}
                  className="flex items-center space-x-1.5 bg-white text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>ลองใหม่อีกครั้ง (RETRY)</span>
                </button>
              </div>
            ) : (
              /* Idle original preview */
              <div className="relative aspect-square sm:aspect-[4/3] bg-black border border-white/10 overflow-hidden flex items-center justify-center group">
                <img
                  src={item.originalUrl}
                  alt="Original Product"
                  className="max-h-full max-w-full object-contain p-2"
                />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => onProcessSingle(item.id)}
                    className="flex items-center space-x-1.5 bg-white text-black font-bold text-[10px] uppercase tracking-widest px-5 py-2.5 transition-transform scale-95 group-hover:scale-100 cursor-pointer hover:bg-zinc-200"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-black" />
                    <span>เปลี่ยนฉากหลัง AI</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Card Footer Actions */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
              <span className="text-[10px] font-mono text-white/40 uppercase">
                {item.completedAt ? `TIME: ${new Date(item.completedAt).toLocaleTimeString('th-TH')}` : 'STATUS: READY'}
              </span>

              <div className="flex items-center space-x-2">
                {item.status === 'completed' && (
                  <button
                    type="button"
                    onClick={() => onOpenLightbox(item)}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-colors cursor-pointer"
                    title="ขยายดูความละเอียดสูง"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}

                {item.status !== 'processing' && (
                  <button
                    type="button"
                    onClick={() => onProcessSingle(item.id)}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-colors cursor-pointer"
                    title="สร้างใหม่อีกครั้ง"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onRemoveSingle(item.id)}
                  className="p-2 text-white/40 hover:text-rose-400 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
                  title="ลบภาพนี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
