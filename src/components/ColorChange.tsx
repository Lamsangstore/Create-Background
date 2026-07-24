import React, { useRef, useState } from 'react';
import JSZip from 'jszip';
import { ProductImageItem, ProductType, AspectRatio, ImageSize } from '../types';
import { PRODUCT_TYPES, buildColorChangePrompt } from '../data/presets';
import { ImageComparisonSlider } from './ImageComparisonSlider';
import { sanitizeFileName } from '../utils/filename';
import {
  Palette, Tag, UploadCloud, ImagePlus, Sparkles, Loader2, RotateCcw,
  FileArchive, Trash2, RefreshCw, X, Download, Droplet,
} from 'lucide-react';

interface ColorChangeProps {
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const CONCURRENCY = 6;

export const ColorChange: React.FC<ColorChangeProps> = ({ onToast }) => {
  const [productType, setProductType] = useState<ProductType>('belt');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isCustomActive, setIsCustomActive] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [colorRef, setColorRef] = useState<{ url: string; mime: string } | null>(null);
  const [items, setItems] = useState<ProductImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const baseInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const activePrompt = buildColorChangePrompt(productType, customPrompt, isCustomActive);
  const completedItems = items.filter((i) => i.status === 'completed');
  const pendingItems = items.filter((i) => i.status === 'idle' || i.status === 'error');

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onerror = () => rej(new Error('read failed'));
      fr.onload = () => res(fr.result as string);
      fr.readAsDataURL(file);
    });

  /* ---------- product type & prompt ---------- */
  const handleTypeChange = (t: ProductType) => {
    setProductType(t);
    if (!isCustomActive) setCustomPrompt(''); // keep showing the fresh per-type prompt
  };
  const handlePromptChange = (v: string) => { setCustomPrompt(v); setIsCustomActive(true); };
  const resetPrompt = () => { setIsCustomActive(false); setCustomPrompt(''); };

  /* ---------- uploads ---------- */
  const addBaseFiles = async (list: FileList | File[]) => {
    const imgs = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) { onToast('ไฟล์ที่เลือกไม่ใช่รูปภาพ', 'error'); return; }
    const added: ProductImageItem[] = [];
    for (const f of imgs) {
      const url = await fileToDataUrl(f);
      added.push({
        id: `cc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: f.name, originalUrl: url, mimeType: f.type || 'image/png',
        status: 'idle', productType, createdAt: Date.now(),
      });
    }
    setItems((prev) => [...prev, ...added]);
    onToast(`เพิ่ม ${added.length} รูปแล้ว`, 'success');
  };

  const setColorReference = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setColorRef({ url: await fileToDataUrl(file), mime: file.type || 'image/png' });
  };

  /* ---------- processing ---------- */
  const processItem = async (item: ProductImageItem): Promise<Partial<ProductImageItem>> => {
    const res = await fetch('/api/edit-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: item.originalUrl,
        mimeType: item.mimeType,
        referenceImageBase64: colorRef!.url,
        referenceMimeType: colorRef!.mime,
        prompt: activePrompt,
        aspectRatio,
        imageSize,
        model: 'gemini-3.1-flash-image',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'ไม่สามารถเปลี่ยนสีได้จาก AI');
    return { status: 'completed', resultUrl: data.resultImage, completedAt: Date.now() };
  };

  const runOne = async (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target || !colorRef) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'processing', errorMessage: undefined } : i)));
    try {
      const r = await processItem(target);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...r } : i)));
    } catch (err: any) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'error', errorMessage: err?.message || 'เกิดข้อผิดพลาด' } : i)));
    }
  };

  const processAll = async () => {
    if (!colorRef) { onToast('กรุณาอัปโหลดรูปสีอ้างอิงก่อน', 'info'); return; }
    const pending = items.filter((i) => i.status === 'idle' || i.status === 'error');
    if (!pending.length) return;
    setIsProcessing(true);
    const pendingIds = new Set(pending.map((i) => i.id));
    setItems((prev) => prev.map((i) => (pendingIds.has(i.id) ? { ...i, status: 'processing', errorMessage: undefined } : i)));

    const queue = [...pending];
    const worker = async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;
        try {
          const r = await processItem(item);
          setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...r } : i)));
        } catch (err: any) {
          setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'error', errorMessage: err?.message || 'เกิดข้อผิดพลาด' } : i)));
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker()));
    setIsProcessing(false);
    onToast('เปลี่ยนสีครบทุกรูปแล้ว!', 'success');
  };

  /* ---------- downloads ---------- */
  const extOf = (url: string) => url.match(/^data:image\/([a-zA-Z]+);/)?.[1] || 'png';
  const downloadOne = (item: ProductImageItem) => {
    if (!item.resultUrl) return;
    const a = document.createElement('a');
    a.href = item.resultUrl;
    a.download = `${sanitizeFileName(item.name.replace(/\.[^.]+$/, ''))}_recolored.${extOf(item.resultUrl)}`;
    a.click();
  };
  const downloadZip = async () => {
    if (!completedItems.length) return;
    onToast('กำลังบีบอัดเป็น ZIP...', 'info');
    try {
      const zip = new JSZip();
      const folder = zip.folder('recolored');
      completedItems.forEach((it, idx) => {
        const base64 = it.resultUrl!.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
        const suffix = completedItems.length > 1 ? `_${idx + 1}` : '';
        folder?.file(`${sanitizeFileName(it.name.replace(/\.[^.]+$/, ''))}_recolored${suffix}.${extOf(it.resultUrl!)}`, base64, { base64: true });
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `recolored_${Date.now()}.zip`; a.click();
      URL.revokeObjectURL(a.href);
      onToast('ดาวน์โหลด ZIP เรียบร้อยแล้ว!', 'success');
    } catch { onToast('สร้าง ZIP ไม่สำเร็จ', 'error'); }
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  /* ---------- render ---------- */
  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="card p-6 md:p-7 flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gold/12 text-gold shrink-0"><Palette className="w-5 h-5" /></span>
        <div>
          <h2 className="text-[19px] font-semibold text-ink">เปลี่ยนสีสินค้าจากรูปสีอ้างอิง</h2>
          <p className="text-[15px] text-muted leading-relaxed max-w-3xl mt-0.5">
            อัปโหลดรูปสินค้า + รูป "สีที่ต้องการ" — AI จะย้ายโทนสี/วัสดุจากรูปสีมาใส่สินค้า โดยคงรูปทรง ลายเย็บ และชิ้นส่วนที่ไม่ควรเปลี่ยน (เช่น หัวเข็มขัด) ไว้ครบ
          </p>
        </div>
      </div>

      {/* Config: type + prompt */}
      <div className="card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[15px] uppercase tracking-[0.2em] font-bold text-muted">ประเภทสินค้า &amp; คำสั่ง AI</h3>
          <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-full border border-line shadow-sm">
            <Tag className="w-3.5 h-3.5 text-gold" />
            <span className="text-[14px] uppercase tracking-widest text-muted">ประเภท:</span>
            <select value={productType} onChange={(e) => handleTypeChange(e.target.value as ProductType)}
              className="bg-transparent text-[15px] text-ink font-medium focus:outline-none cursor-pointer">
              {PRODUCT_TYPES.map((t) => <option key={t.id} value={t.id} className="bg-white text-ink">{t.labelTh}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-muted">คำสั่งเปลี่ยนสี ({isCustomActive ? 'แก้ไขเอง' : 'อัตโนมัติตามประเภท'})</span>
            {isCustomActive && (
              <button type="button" onClick={resetPrompt} className="flex items-center gap-1 text-[13px] uppercase tracking-widest text-gold-dark hover:underline cursor-pointer">
                <RotateCcw className="w-3 h-3" /> คืนค่าตามประเภท
              </button>
            )}
          </div>
          <textarea rows={5} value={isCustomActive ? customPrompt : activePrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            className="w-full bg-cream-2/50 border border-line rounded-xl p-3.5 text-[13px] font-mono text-ink leading-relaxed focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 resize-y" />
        </div>

        {/* resolution + aspect */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
          <div className="space-y-2">
            <span className="text-[14px] uppercase tracking-[0.15em] font-bold text-muted">ความละเอียด</span>
            <div className="grid grid-cols-4 gap-2">
              {(['512px', '1K', '2K', '4K'] as ImageSize[]).map((s) => (
                <button key={s} type="button" onClick={() => setImageSize(s)}
                  className={`py-2 text-[13px] font-bold uppercase tracking-widest rounded-lg border transition-all cursor-pointer ${imageSize === s ? 'bg-ink text-cream border-ink' : 'bg-white text-muted border-line hover:border-gold/40 hover:text-ink'}`}>
                  {s === '1K' ? '1K' : s === '2K' ? '2K' : s === '4K' ? '4K' : '512'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[14px] uppercase tracking-[0.15em] font-bold text-muted">สัดส่วนภาพ</span>
            <div className="grid grid-cols-5 gap-1.5">
              {(['1:1', '3:4', '4:3', '9:16', '16:9'] as AspectRatio[]).map((r) => (
                <button key={r} type="button" onClick={() => setAspectRatio(r)}
                  className={`py-2 text-[13px] font-bold uppercase tracking-widest rounded-lg border transition-all cursor-pointer ${aspectRatio === r ? 'bg-ink text-cream border-ink' : 'bg-white text-muted border-line hover:border-gold/40 hover:text-ink'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Color reference */}
      <div className="card p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Droplet className="w-4 h-4 text-gold" />
          <h3 className="text-[15px] uppercase tracking-[0.2em] font-bold text-muted">รูปสีอ้างอิง (สีที่ต้องการ)</h3>
        </div>
        <input ref={colorInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setColorReference(f); e.target.value = ''; }} />
        {!colorRef ? (
          <button type="button" onClick={() => colorInputRef.current?.click()}
            className="w-full rounded-2xl border-2 border-dashed border-line bg-cream-2/40 hover:border-gold/50 hover:bg-gold/5 p-6 flex flex-col items-center gap-2 transition-all cursor-pointer">
            <span className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold"><ImagePlus className="w-5 h-5" /></span>
            <span className="text-[14px] uppercase tracking-widest font-bold text-ink">อัปโหลดรูปสีอ้างอิง</span>
            <span className="text-[13px] text-subtle">รูปที่มีสี/วัสดุที่อยากได้ (เช่น หนังสีน้ำตาล)</span>
          </button>
        ) : (
          <div className="flex items-center gap-4 p-3 rounded-2xl border border-gold/40 bg-gold/5">
            <img src={colorRef.url} alt="Color reference" className="w-20 h-20 object-cover rounded-xl border border-line shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-ink">รูปสีอ้างอิงพร้อมใช้งาน</p>
              <p className="text-[13px] text-muted">AI จะดึงโทนสีและวัสดุจากรูปนี้มาใส่สินค้า</p>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => colorInputRef.current?.click()} className="btn btn-ghost text-[13px] px-3 py-1.5">เปลี่ยนรูป</button>
                <button type="button" onClick={() => setColorRef(null)} className="inline-flex items-center gap-1 rounded-lg text-[13px] text-muted hover:text-rose-600 border border-line hover:border-rose-200 px-3 py-1.5 cursor-pointer"><X className="w-3.5 h-3.5" /> ลบ</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Base images uploader */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length) addBaseFiles(e.dataTransfer.files); }}
        onClick={() => baseInputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-7 text-center cursor-pointer transition-all ${isDragging ? 'border-gold bg-gold/5' : 'border-line bg-white hover:border-gold/50 hover:bg-cream-2/60'}`}
      >
        <input ref={baseInputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => { if (e.target.files?.length) addBaseFiles(e.target.files); e.target.value = ''; }} />
        <span className="inline-flex w-12 h-12 rounded-2xl bg-gold/10 border border-gold/25 items-center justify-center text-gold mb-2"><UploadCloud className="w-6 h-6" /></span>
        <p className="text-[15px] font-bold uppercase tracking-[0.12em] text-ink">อัปโหลดรูปสินค้า — ลากมาวางได้</p>
        <p className="text-[14px] text-muted mt-1">รองรับหลายรูป (PNG · JPG · WEBP)</p>
      </div>

      {/* Actions */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={processAll} disabled={isProcessing || !colorRef} className="btn btn-primary text-[15px] px-6 py-3">
            {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังเปลี่ยนสี…</> : <><Sparkles className="w-4 h-4 fill-white" /> เปลี่ยนสีทุกรูป ({pendingItems.length})</>}
          </button>
          <button type="button" onClick={downloadZip} disabled={!completedItems.length} className="btn text-[15px] px-4 py-3 bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 shadow-sm"><FileArchive className="w-4 h-4" /> ดาวน์โหลดทั้งหมด (ZIP)</button>
          <button type="button" onClick={() => setItems([])} className="btn btn-ghost text-[15px] px-4 py-3"><Trash2 className="w-4 h-4" /> ล้างรายการ</button>
          <span className="text-[14px] text-muted ml-auto">{completedItems.length > 0 ? <>เปลี่ยนแล้ว <b className="text-emerald-600">{completedItems.length}</b> / {items.length} รูป</> : `${items.length} รูป`}</span>
          {!colorRef && <span className="text-[13px] text-gold-dark">⚠ ยังไม่ได้ใส่รูปสีอ้างอิง</span>}
        </div>
      )}

      {/* Grid */}
      {items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line p-10 text-center">
          <p className="text-[15px] text-muted">ยังไม่มีรูปสินค้า — อัปโหลดด้านบน แล้วใส่รูปสีอ้างอิง จากนั้นกด "เปลี่ยนสีทุกรูป"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((item) => (
            <div key={item.id} className={`bg-surface rounded-2xl border p-5 space-y-4 transition-all ${
              item.status === 'processing' ? 'border-gold ring-2 ring-gold/20'
              : item.status === 'completed' ? 'border-line shadow-studio'
              : item.status === 'error' ? 'border-rose-200 bg-rose-50/40' : 'border-line'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[15px] font-semibold text-ink truncate">{item.name}</p>
                <button type="button" onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              {item.status === 'completed' && item.resultUrl ? (
                <ImageComparisonSlider originalUrl={item.originalUrl} resultUrl={item.resultUrl} title={item.name} onDownload={() => downloadOne(item)} />
              ) : item.status === 'processing' ? (
                <div className="relative aspect-square sm:aspect-[4/3] bg-cream-2 rounded-xl border border-gold/30 flex flex-col items-center justify-center gap-3 overflow-hidden">
                  <img src={item.originalUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 blur-sm" />
                  <div className="relative z-10 w-12 h-12 rounded-xl bg-gold text-white flex items-center justify-center animate-pulse"><Palette className="w-6 h-6" /></div>
                  <p className="relative z-10 text-[14px] font-bold uppercase tracking-widest text-ink">กำลังเปลี่ยนสี...</p>
                </div>
              ) : item.status === 'error' ? (
                <div className="aspect-square sm:aspect-[4/3] bg-rose-50/60 rounded-xl border border-rose-200 flex flex-col items-center justify-center text-center gap-3 p-5">
                  <p className="text-[14px] text-rose-700">{item.errorMessage || 'ไม่สำเร็จ'}</p>
                  <button type="button" onClick={() => runOne(item.id)} className="btn btn-ink text-[13px] px-4 py-2"><RefreshCw className="w-3.5 h-3.5" /> ลองใหม่</button>
                </div>
              ) : (
                <div className="relative aspect-square sm:aspect-[4/3] bg-cream-2 rounded-xl border border-line overflow-hidden flex items-center justify-center group">
                  <img src={item.originalUrl} alt="" className="max-h-full max-w-full object-contain p-2" />
                  <div className="absolute inset-0 bg-ink/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => runOne(item.id)} disabled={!colorRef} className="btn btn-primary text-[13px] px-5 py-2.5 disabled:opacity-60"><Sparkles className="w-3.5 h-3.5 fill-white" /> เปลี่ยนสีรูปนี้</button>
                  </div>
                </div>
              )}

              {item.status === 'completed' && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => downloadOne(item)} className="btn btn-ghost text-[13px] px-4 py-2"><Download className="w-3.5 h-3.5" /> ดาวน์โหลด</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
