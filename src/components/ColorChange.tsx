import React, { useRef, useState } from 'react';
import JSZip from 'jszip';
import { ProductType, AspectRatio, ImageSize } from '../types';
import { PRODUCT_TYPES, buildColorChangePrompt } from '../data/presets';
import { sanitizeFileName } from '../utils/filename';
import {
  Palette, Tag, UploadCloud, ImagePlus, Sparkles, Loader2, RotateCcw,
  FileArchive, Trash2, RefreshCw, X, Download, Droplet, AlertTriangle,
} from 'lucide-react';

interface ColorChangeProps {
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface ImgAsset { id: string; name: string; url: string; mime: string; }
interface Job {
  key: string; productId: string; colorId: string;
  status: 'processing' | 'completed' | 'error';
  resultUrl?: string; error?: string;
}

const CONCURRENCY = 6;
const jobKey = (productId: string, colorId: string) => `${productId}::${colorId}`;

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = () => rej(new Error('read failed'));
    fr.onload = () => res(fr.result as string);
    fr.readAsDataURL(file);
  });

export const ColorChange: React.FC<ColorChangeProps> = ({ onToast }) => {
  const [productType, setProductType] = useState<ProductType>('belt');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isCustomActive, setIsCustomActive] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [products, setProducts] = useState<ImgAsset[]>([]);
  const [colors, setColors] = useState<ImgAsset[]>([]);
  const [jobs, setJobs] = useState<Record<string, Job>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const productInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const activePrompt = buildColorChangePrompt(productType, customPrompt, isCustomActive);
  const totalCombos = products.length * colors.length;
  const completedCount = Object.keys(jobs).filter((k) => jobs[k].status === 'completed').length;

  /* ---------- product type & prompt ---------- */
  const handleTypeChange = (t: ProductType) => { setProductType(t); if (!isCustomActive) setCustomPrompt(''); };
  const handlePromptChange = (v: string) => { setCustomPrompt(v); setIsCustomActive(true); };
  const resetPrompt = () => { setIsCustomActive(false); setCustomPrompt(''); };

  /* ---------- uploads ---------- */
  const readAssets = async (list: FileList | File[]): Promise<ImgAsset[]> => {
    const imgs = Array.from(list).filter((f) => f.type.startsWith('image/'));
    const out: ImgAsset[] = [];
    for (const f of imgs) {
      out.push({ id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: f.name, url: await fileToDataUrl(f), mime: f.type || 'image/png' });
    }
    return out;
  };
  const addProducts = async (list: FileList | File[]) => {
    const a = await readAssets(list);
    if (!a.length) { onToast('ไฟล์ที่เลือกไม่ใช่รูปภาพ', 'error'); return; }
    setProducts((p) => [...p, ...a]); onToast(`เพิ่มสินค้า ${a.length} รูป`, 'success');
  };
  const addColors = async (list: FileList | File[]) => {
    const a = await readAssets(list);
    if (!a.length) { onToast('ไฟล์ที่เลือกไม่ใช่รูปภาพ', 'error'); return; }
    setColors((c) => [...c, ...a]); onToast(`เพิ่มสีอ้างอิง ${a.length} สี`, 'success');
  };
  const removeProduct = (id: string) => {
    setProducts((p) => p.filter((x) => x.id !== id));
    setJobs((prev) => {
      const n: Record<string, Job> = {};
      for (const k of Object.keys(prev)) if (prev[k].productId !== id) n[k] = prev[k];
      return n;
    });
  };
  const removeColor = (id: string) => {
    setColors((c) => c.filter((x) => x.id !== id));
    setJobs((prev) => {
      const n: Record<string, Job> = {};
      for (const k of Object.keys(prev)) if (prev[k].colorId !== id) n[k] = prev[k];
      return n;
    });
  };

  /* ---------- processing ---------- */
  const processPair = async (product: ImgAsset, color: ImgAsset): Promise<string> => {
    const res = await fetch('/api/edit-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: product.url,
        mimeType: product.mime,
        referenceImageBase64: color.url,
        referenceMimeType: color.mime,
        prompt: activePrompt,
        aspectRatio,
        imageSize,
        model: 'gemini-3.1-flash-image',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'ไม่สามารถเปลี่ยนสีได้จาก AI');
    return data.resultImage as string;
  };

  const runPairs = async (pairs: { product: ImgAsset; color: ImgAsset }[]) => {
    if (!pairs.length) return;
    setIsProcessing(true);
    setJobs((prev) => {
      const n = { ...prev };
      for (const { product, color } of pairs) {
        const key = jobKey(product.id, color.id);
        n[key] = { key, productId: product.id, colorId: color.id, status: 'processing', error: undefined };
      }
      return n;
    });
    const queue = [...pairs];
    const worker = async () => {
      while (queue.length > 0) {
        const pair = queue.shift();
        if (!pair) break;
        const key = jobKey(pair.product.id, pair.color.id);
        try {
          const resultUrl = await processPair(pair.product, pair.color);
          setJobs((prev) => ({ ...prev, [key]: { ...prev[key], status: 'completed', resultUrl } }));
        } catch (err: any) {
          setJobs((prev) => ({ ...prev, [key]: { ...prev[key], status: 'error', error: err?.message || 'เกิดข้อผิดพลาด' } }));
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker()));
    setIsProcessing(false);
  };

  const generateAll = async () => {
    if (!products.length) { onToast('อัปโหลดรูปสินค้าก่อนครับ', 'info'); return; }
    if (!colors.length) { onToast('อัปโหลดรูปสีอ้างอิงก่อนครับ', 'info'); return; }
    const pairs: { product: ImgAsset; color: ImgAsset }[] = [];
    for (const product of products) for (const color of colors) {
      const j = jobs[jobKey(product.id, color.id)];
      if (!j || j.status === 'error') pairs.push({ product, color }); // skip already-done
    }
    if (!pairs.length) { onToast('ทุกคู่สร้างเสร็จแล้ว', 'info'); return; }
    onToast(`กำลังสร้าง ${pairs.length} รูป (${products.length} สินค้า × ${colors.length} สี)…`, 'info');
    await runPairs(pairs);
    onToast('สร้างครบทุกคู่แล้ว!', 'success');
  };

  const retryOne = (product: ImgAsset, color: ImgAsset) => runPairs([{ product, color }]);

  /* ---------- downloads ---------- */
  const extOf = (url: string) => url.match(/^data:image\/([a-zA-Z]+);/)?.[1] || 'png';
  const outName = (product: ImgAsset, colorIdx: number, ext: string) =>
    `${sanitizeFileName(product.name.replace(/\.[^.]+$/, ''))}_color${colorIdx + 1}.${ext}`;

  const downloadOne = (product: ImgAsset, color: ImgAsset, colorIdx: number) => {
    const job = jobs[jobKey(product.id, color.id)];
    if (!job?.resultUrl) return;
    const a = document.createElement('a');
    a.href = job.resultUrl;
    a.download = outName(product, colorIdx, extOf(job.resultUrl));
    a.click();
  };

  const downloadZip = async () => {
    const done = Object.keys(jobs).filter((k) => jobs[k].status === 'completed' && jobs[k].resultUrl);
    if (!done.length) return;
    onToast('กำลังบีบอัดเป็น ZIP...', 'info');
    try {
      const zip = new JSZip();
      products.forEach((product) => {
        const folder = zip.folder(sanitizeFileName(product.name.replace(/\.[^.]+$/, '')) || 'product');
        colors.forEach((color, ci) => {
          const job = jobs[jobKey(product.id, color.id)];
          if (job?.status === 'completed' && job.resultUrl) {
            const base64 = job.resultUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
            folder?.file(outName(product, ci, extOf(job.resultUrl)), base64, { base64: true });
          }
        });
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `recolored_${Date.now()}.zip`; a.click();
      URL.revokeObjectURL(a.href);
      onToast('ดาวน์โหลด ZIP เรียบร้อยแล้ว!', 'success');
    } catch { onToast('สร้าง ZIP ไม่สำเร็จ', 'error'); }
  };

  /* ---------- render ---------- */
  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="card p-6 md:p-7 flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gold/12 text-gold shrink-0"><Palette className="w-5 h-5" /></span>
        <div>
          <h2 className="text-[19px] font-semibold text-ink">เปลี่ยนสีสินค้าจากรูปสีอ้างอิง</h2>
          <p className="text-[15px] text-muted leading-relaxed max-w-3xl mt-0.5">
            ใส่ได้ <b>หลายสี × หลายสินค้า</b> — ระบบจะสร้างครบทุกคู่ (เช่น 8 สี × 2 สินค้า = 16 รูป) โดยย้ายโทนสี/วัสดุจากรูปสีมาใส่สินค้า และคงรูปทรง ลายเย็บ ชิ้นส่วนที่ไม่ควรเปลี่ยน (เช่น หัวเข็มขัด) ไว้ครบ
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

      {/* Color references (multiple) */}
      <div className="card p-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[15px] uppercase tracking-[0.2em] font-bold text-muted flex items-center gap-2"><Droplet className="w-4 h-4 text-gold" /> รูปสีอ้างอิง (ใส่ได้หลายสี)</h3>
          {colors.length > 0 && <span className="text-[14px] text-muted">{colors.length} สี</span>}
        </div>
        <input ref={colorInputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => { if (e.target.files?.length) addColors(e.target.files); e.target.value = ''; }} />
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2.5">
          {colors.map((c, i) => (
            <div key={c.id} className="relative aspect-square rounded-xl overflow-hidden border border-line bg-cream-2">
              <img src={c.url} alt="" className="w-full h-full object-cover" />
              <span className="absolute left-1 top-1 bg-ink/70 text-white text-[12px] font-bold px-1.5 rounded-full">{i + 1}</span>
              <button type="button" onClick={() => removeColor(c.id)} className="absolute right-1 top-1 w-5 h-5 rounded-full bg-ink/70 text-white flex items-center justify-center hover:bg-rose-500 cursor-pointer"><X className="w-3 h-3" /></button>
            </div>
          ))}
          <button type="button" onClick={() => colorInputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-line hover:border-gold/50 hover:bg-gold/5 flex flex-col items-center justify-center gap-1 text-gold transition-all cursor-pointer">
            <ImagePlus className="w-5 h-5" />
            <span className="text-[12px] font-bold text-ink">เพิ่มสี</span>
          </button>
        </div>
        <p className="text-[13px] text-subtle">อัปโหลดรูปที่มีสี/วัสดุที่อยากได้ (เช่น หนังสีน้ำตาล, สีดำเงา) — ใส่กี่สีก็ได้</p>
      </div>

      {/* Product images (multiple) */}
      <div className="card p-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[15px] uppercase tracking-[0.2em] font-bold text-muted flex items-center gap-2"><Sparkles className="w-4 h-4 text-gold" /> รูปสินค้า (ใส่ได้หลายชิ้น)</h3>
          {products.length > 0 && <span className="text-[14px] text-muted">{products.length} สินค้า</span>}
        </div>
        <input ref={productInputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => { if (e.target.files?.length) addProducts(e.target.files); e.target.value = ''; }} />
        {products.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2.5">
            {products.map((p, i) => (
              <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden border border-line bg-cream-2">
                <img src={p.url} alt="" className="w-full h-full object-cover" />
                <span className="absolute left-1 top-1 bg-ink/70 text-white text-[12px] font-bold px-1.5 rounded-full">{i + 1}</span>
                <button type="button" onClick={() => removeProduct(p.id)} className="absolute right-1 top-1 w-5 h-5 rounded-full bg-ink/70 text-white flex items-center justify-center hover:bg-rose-500 cursor-pointer"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length) addProducts(e.dataTransfer.files); }}
          onClick={() => productInputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${isDragging ? 'border-gold bg-gold/5' : 'border-line bg-cream-2/40 hover:border-gold/50 hover:bg-gold/5'}`}
        >
          <span className="inline-flex w-11 h-11 rounded-2xl bg-gold/10 border border-gold/25 items-center justify-center text-gold mb-1.5"><UploadCloud className="w-5 h-5" /></span>
          <p className="text-[14px] font-bold uppercase tracking-[0.1em] text-ink">อัปโหลดรูปสินค้า — ลากมาวางได้</p>
          <p className="text-[13px] text-muted mt-0.5">รองรับหลายรูป (PNG · JPG · WEBP)</p>
        </div>
      </div>

      {/* Generate bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={generateAll} disabled={isProcessing || !totalCombos} className="btn btn-primary text-[15px] px-6 py-3">
          {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังสร้าง…</> : <><Sparkles className="w-4 h-4 fill-white" /> สร้างทั้งหมด{totalCombos > 0 ? ` (${totalCombos} รูป)` : ''}</>}
        </button>
        {completedCount > 0 && (
          <button type="button" onClick={downloadZip} className="btn text-[15px] px-4 py-3 bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"><FileArchive className="w-4 h-4" /> ดาวน์โหลดทั้งหมด (ZIP)</button>
        )}
        {(products.length > 0 || colors.length > 0) && (
          <button type="button" onClick={() => { setProducts([]); setColors([]); setJobs({}); }} className="btn btn-ghost text-[15px] px-4 py-3"><Trash2 className="w-4 h-4" /> ล้างทั้งหมด</button>
        )}
        <span className="text-[14px] text-muted ml-auto">
          {totalCombos > 0
            ? <><b className="text-ink">{products.length}</b> สินค้า × <b className="text-ink">{colors.length}</b> สี = <b className="text-gold-dark">{totalCombos}</b> รูป{completedCount > 0 ? ` · เสร็จ ${completedCount}` : ''}</>
            : 'ใส่รูปสินค้าและรูปสีอ้างอิงก่อน'}
        </span>
      </div>

      {/* Results grouped by product */}
      {totalCombos > 0 && Object.keys(jobs).length > 0 && (
        <div className="space-y-5">
          {products.map((product) => (
            <div key={product.id} className="card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <img src={product.url} alt="" className="w-14 h-14 rounded-xl object-cover border border-line shrink-0" />
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-ink truncate">{product.name}</p>
                  <p className="text-[13px] text-muted">{colors.length} เฉดสี</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {colors.map((color, ci) => {
                  const job = jobs[jobKey(product.id, color.id)];
                  return (
                    <div key={color.id} className="rounded-xl border border-line bg-surface overflow-hidden">
                      <div className="relative aspect-square bg-cream-2 flex items-center justify-center">
                        {job?.status === 'completed' && job.resultUrl ? (
                          <img src={job.resultUrl} alt="" className="w-full h-full object-contain" />
                        ) : job?.status === 'processing' ? (
                          <Loader2 className="w-6 h-6 text-gold animate-spin" />
                        ) : job?.status === 'error' ? (
                          <div className="flex flex-col items-center gap-1.5 p-2 text-center">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                            <button type="button" onClick={() => retryOne(product, color)} className="text-[12px] text-gold-dark hover:underline flex items-center gap-1"><RefreshCw className="w-3 h-3" /> ลองใหม่</button>
                          </div>
                        ) : (
                          <img src={product.url} alt="" className="w-full h-full object-contain opacity-30" />
                        )}
                        {/* color swatch */}
                        <img src={color.url} alt="" className="absolute bottom-1.5 left-1.5 w-7 h-7 rounded-md object-cover border-2 border-white shadow" title={`สี ${ci + 1}`} />
                        <span className="absolute top-1.5 left-1.5 bg-ink/70 text-white text-[11px] font-bold px-1.5 rounded-full">สี {ci + 1}</span>
                      </div>
                      {job?.status === 'completed' && (
                        <button type="button" onClick={() => downloadOne(product, color, ci)} className="w-full flex items-center justify-center gap-1.5 py-2 text-[13px] text-muted hover:text-gold hover:bg-cream-2 border-t border-line transition-colors cursor-pointer">
                          <Download className="w-3.5 h-3.5" /> โหลด
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
