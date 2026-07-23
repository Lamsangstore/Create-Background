import React from 'react';
import { ProductImageItem } from '../types';
import { Download, Trash2, RefreshCw, Eye, Sparkles, CheckCircle2, AlertTriangle, FileArchive, Loader2 } from 'lucide-react';
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
      <div className="card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-ink flex items-center gap-2">
            <span>รายการรูปภาพสินค้าในคิว (BATCH QUEUE)</span>
            <span className="bg-cream-2 border border-line text-muted text-[10px] font-mono px-2 py-0.5 rounded-full">
              {items.length} รายการ
            </span>
          </h3>
          <p className="text-[12px] text-muted mt-1">
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
              className="btn text-[10px] uppercase tracking-widest px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
            >
              <FileArchive className="w-3.5 h-3.5" />
              <span>ดาวน์โหลดทั้งหมด (ZIP)</span>
            </button>
          )}

          {idleItems.length > 0 && (
            <button
              type="button"
              disabled={isProcessingBatch}
              onClick={onProcessAll}
              className="btn btn-primary text-[10px] uppercase tracking-widest px-5 py-2.5"
            >
              {isProcessingBatch ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังเรนเดอร์...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-white" />
                  <span>เปลี่ยนฉากหลังทั้งหมด ({idleItems.length})</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onClearAll}
            className="p-2.5 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
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
            className={`bg-surface rounded-2xl border p-5 space-y-4 transition-all ${
              item.status === 'processing'
                ? 'border-gold ring-2 ring-gold/20'
                : item.status === 'completed'
                ? 'border-line shadow-studio hover:border-gold/40'
                : item.status === 'error'
                ? 'border-rose-200 bg-rose-50/40'
                : 'border-line hover:border-gold/40 hover:shadow-studio'
            }`}
          >
            {/* Top Info Bar */}
            <div className="flex items-center justify-between gap-2">
              <div className="truncate">
                <p className="text-xs font-semibold text-ink truncate tracking-wide">{item.name}</p>
                <span className="text-[9px] text-subtle font-mono uppercase tracking-widest">
                  {item.mimeType.replace('image/', '')}
                </span>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {item.status === 'processing' && (
                  <span className="bg-gold/12 text-gold-dark text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-gold/30 flex items-center gap-1.5 font-bold">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>กำลังประมวลผล...</span>
                  </span>
                )}

                {item.status === 'completed' && (
                  <span className="bg-emerald-50 text-emerald-700 text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>สำเร็จ (SUCCESS)</span>
                  </span>
                )}

                {item.status === 'error' && (
                  <span className="bg-rose-50 text-rose-700 text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3 h-3" />
                    <span>ล้มเหลว (FAILED)</span>
                  </span>
                )}

                {item.status === 'idle' && (
                  <span className="bg-cream-2 text-muted text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-line">
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
              <div className="relative aspect-square sm:aspect-[4/3] bg-cream-2 rounded-xl border border-gold/30 flex flex-col items-center justify-center p-6 text-center gap-3 overflow-hidden">
                <img
                  src={item.originalUrl}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-cover opacity-25 blur-sm"
                />
                <div className="relative z-10 w-12 h-12 rounded-xl bg-gold text-white flex items-center justify-center animate-pulse shadow-lg">
                  <Sparkles className="w-6 h-6 fill-white" />
                </div>
                <div className="relative z-10 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-ink">กำลังสร้างฉากหลังสตูดิโอ...</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted">Gemini 3.1 Flash Image Engine</p>
                </div>
              </div>
            ) : item.status === 'error' ? (
              <div className="aspect-square sm:aspect-[4/3] bg-rose-50/60 rounded-xl border border-rose-200 p-5 flex flex-col items-center justify-center text-center gap-3">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
                <p className="text-xs text-rose-700 font-medium">
                  {item.errorMessage || 'ไม่สามารถสร้างภาพได้ กรุณาตรวจสอบการเชื่อมต่อ'}
                </p>
                <button
                  type="button"
                  onClick={() => onProcessSingle(item.id)}
                  className="btn btn-ink text-[10px] uppercase tracking-widest px-4 py-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>ลองใหม่อีกครั้ง (RETRY)</span>
                </button>
              </div>
            ) : (
              /* Idle original preview */
              <div className="relative aspect-square sm:aspect-[4/3] bg-cream-2 rounded-xl border border-line overflow-hidden flex items-center justify-center group">
                <img
                  src={item.originalUrl}
                  alt="Original Product"
                  className="max-h-full max-w-full object-contain p-2"
                />
                <div className="absolute inset-0 bg-ink/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => onProcessSingle(item.id)}
                    className="btn btn-primary text-[10px] uppercase tracking-widest px-5 py-2.5 scale-95 group-hover:scale-100"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-white" />
                    <span>เปลี่ยนฉากหลัง AI</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Card Footer Actions */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-line">
              <span className="text-[10px] font-mono text-subtle uppercase pt-2">
                {item.completedAt ? `TIME: ${new Date(item.completedAt).toLocaleTimeString('th-TH')}` : 'STATUS: READY'}
              </span>

              <div className="flex items-center gap-1.5 pt-2">
                {item.status === 'completed' && (
                  <button
                    type="button"
                    onClick={() => onOpenLightbox(item)}
                    className="p-2 rounded-lg text-muted hover:text-ink hover:bg-cream-2 border border-transparent hover:border-line transition-colors cursor-pointer"
                    title="ขยายดูความละเอียดสูง"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}

                {item.status !== 'processing' && (
                  <button
                    type="button"
                    onClick={() => onProcessSingle(item.id)}
                    className="p-2 rounded-lg text-muted hover:text-ink hover:bg-cream-2 border border-transparent hover:border-line transition-colors cursor-pointer"
                    title="สร้างใหม่อีกครั้ง"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onRemoveSingle(item.id)}
                  className="p-2 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
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
