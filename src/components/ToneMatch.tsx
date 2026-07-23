import React, { useRef, useState } from 'react';
import JSZip from 'jszip';
import { ProductImageItem } from '../types';
import { sanitizeFileName } from '../utils/filename';
import {
  Palette, Pipette, Wand2, Download, FileArchive, Trash2, Loader2,
  UploadCloud, ArrowRight, Check, Sparkles, X,
} from 'lucide-react';

/* ---------- color helpers ---------- */
type RGB = [number, number, number];
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const rgbToHex = (rgb: RGB) =>
  '#' + rgb.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const hexToRgb = (h: string): RGB | null => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('decode failed'));
    img.src = src;
  });

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = () => rej(new Error('read failed'));
    fr.onload = () => res(fr.result as string);
    fr.readAsDataURL(file);
  });

/** Median background colour sampled from the top corners + top-centre of the image. */
function detectBg(img: HTMLImageElement): RGB {
  const w = img.naturalWidth, h = img.naturalHeight;
  const p = Math.max(24, Math.round(Math.min(w, h) * 0.08));
  const c = document.createElement('canvas');
  c.width = w; c.height = Math.min(h, p);
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const rs: number[] = [], gs: number[] = [], bs: number[] = [];
  const zones: [number, number, number, number][] = [
    [0, 0, p, p],
    [w - p, 0, p, p],
    [Math.floor(w / 2 - p / 2), 0, p, p],
  ];
  for (const [x, y, zw, zh] of zones) {
    const sx = clamp(x, 0, w - 1);
    const d = ctx.getImageData(sx, y, Math.min(zw, w - sx), Math.min(zh, c.height)).data;
    for (let i = 0; i < d.length; i += 4 * 7) { rs.push(d[i]); gs.push(d[i + 1]); bs.push(d[i + 2]); }
  }
  const med = (a: number[]) => { a.sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
  return [med(rs), med(gs), med(bs)];
}

const PRESETS = [
  { name: 'Warm Studio', hex: '#F5F3F0' },
  { name: 'ขาวสะอาด', hex: '#FBFBFB' },
  { name: 'ครีมอุ่น', hex: '#F7F2EA' },
  { name: 'Cool Gray', hex: '#F3F4F6' },
];

interface ToneItem {
  id: string;
  name: string;
  originalUrl: string;
  bg: RGB;
  mimeType: string;
  processed: boolean;
  resultUrl?: string;
}

interface ToneMatchProps {
  completedItems: ProductImageItem[];
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ToneMatch: React.FC<ToneMatchProps> = ({ completedItems, onToast }) => {
  const [items, setItems] = useState<ToneItem[]>([]);
  const [target, setTarget] = useState<RGB>([245, 243, 240]);
  const [sampling, setSampling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const fileRef = useRef<HTMLInputElement>(null);

  const targetHex = rgbToHex(target);
  const doneCount = items.filter((i) => i.processed).length;
  const importable = completedItems.filter((i) => i.resultUrl).length;

  /* ---------- adding images ---------- */
  const addOne = async (name: string, dataUrl: string, mimeType: string) => {
    const img = await loadImage(dataUrl);
    const bg = detectBg(img);
    const id = 'tm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    imagesRef.current.set(id, img);
    setItems((prev) => [...prev, { id, name, originalUrl: dataUrl, bg, mimeType, processed: false }]);
  };

  const handleFiles = async (files: FileList | File[]) => {
    const imgs = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) { onToast('ไฟล์ที่เลือกไม่ใช่รูปภาพ', 'error'); return; }
    let ok = 0;
    for (const f of imgs) {
      try { await addOne(f.name, await fileToDataUrl(f), f.type || 'image/png'); ok++; }
      catch { onToast(`อ่านไฟล์ ${f.name} ไม่ได้`, 'error'); }
    }
    if (ok) onToast(`เพิ่ม ${ok} รูปแล้ว`, 'success');
  };

  const importFromStudio = async () => {
    const usable = completedItems.filter((i) => i.resultUrl);
    if (!usable.length) { onToast('ยังไม่มีรูปที่สร้างฉากหลังเสร็จในแท็บ AI Studio', 'info'); return; }
    const existing = new Set(items.map((i) => i.originalUrl));
    let ok = 0;
    for (const it of usable) {
      if (existing.has(it.resultUrl!)) continue;
      try { await addOne(it.name, it.resultUrl!, it.mimeType || 'image/png'); ok++; }
      catch { /* skip */ }
    }
    onToast(ok ? `ดึง ${ok} รูปจาก AI Studio มาแล้ว` : 'รูปจาก AI Studio ถูกดึงมาครบแล้ว', ok ? 'success' : 'info');
  };

  /* ---------- target colour ---------- */
  const applyTarget = (rgb: RGB | null) => {
    if (!rgb) return;
    setTarget(rgb);
    // any previously processed result no longer matches the new target
    setItems((prev) => prev.map((i) => (i.processed ? { ...i, processed: false, resultUrl: undefined } : i)));
  };

  const handleAuto = () => {
    if (!items.length) { onToast('เพิ่มรูปก่อนครับ', 'info'); return; }
    const med = (ch: number) => {
      const a = items.map((it) => it.bg[ch]).sort((x, y) => x - y);
      return a[Math.floor(a.length / 2)];
    };
    applyTarget([med(0), med(1), med(2)]);
    onToast('ตั้งค่ากลางจากพื้นหลังของทุกรูปแล้ว', 'success');
  };

  const handleSampleClick = (it: ToneItem, e: React.MouseEvent<HTMLImageElement>) => {
    if (!sampling) return;
    const img = imagesRef.current.get(it.id);
    if (!img) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // account for object-contain letterboxing
    const natRatio = img.naturalWidth / img.naturalHeight;
    const boxRatio = rect.width / rect.height;
    let dispW = rect.width, dispH = rect.height, offX = 0, offY = 0;
    if (natRatio > boxRatio) { dispH = rect.width / natRatio; offY = (rect.height - dispH) / 2; }
    else { dispW = rect.height * natRatio; offX = (rect.width - dispW) / 2; }
    const relX = (e.clientX - rect.left - offX) / dispW;
    const relY = (e.clientY - rect.top - offY) / dispH;
    if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return;
    const px = clamp(Math.round(relX * img.naturalWidth), 0, img.naturalWidth - 1);
    const py = clamp(Math.round(relY * img.naturalHeight), 0, img.naturalHeight - 1);
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(px, py, 1, 1).data;
    applyTarget([d[0], d[1], d[2]]);
    setSampling(false);
    onToast(`ดูดสีจาก ${it.name} → ${rgbToHex([d[0], d[1], d[2]])}`, 'success');
  };

  /* ---------- processing ---------- */
  const processAll = async () => {
    if (!items.length) return;
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 20)); // let the spinner paint
    const updated = await Promise.all(
      items.map(async (it) => {
        try {
          const img = imagesRef.current.get(it.id) || (await loadImage(it.originalUrl));
          const c = document.createElement('canvas');
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          const ctx = c.getContext('2d', { willReadFrequently: true })!;
          ctx.drawImage(img, 0, 0);
          const imd = ctx.getImageData(0, 0, c.width, c.height);
          const d = imd.data;
          const g: RGB = [
            target[0] / Math.max(1, it.bg[0]),
            target[1] / Math.max(1, it.bg[1]),
            target[2] / Math.max(1, it.bg[2]),
          ];
          for (let i = 0; i < d.length; i += 4) {
            d[i] = Math.min(255, d[i] * g[0]);
            d[i + 1] = Math.min(255, d[i + 1] * g[1]);
            d[i + 2] = Math.min(255, d[i + 2] * g[2]);
          }
          ctx.putImageData(imd, 0, 0);
          const mime = /jpe?g/i.test(it.mimeType) ? 'image/jpeg' : 'image/png';
          return { ...it, processed: true, resultUrl: c.toDataURL(mime, 0.97) };
        } catch {
          return it;
        }
      })
    );
    setItems(updated);
    setIsProcessing(false);
    onToast('ปรับโทนครบทุกรูปแล้ว ✓', 'success');
  };

  /* ---------- download ---------- */
  const outBase = (name: string) => sanitizeFileName(name.replace(/\.[^.]+$/, ''));
  const extOf = (url: string) => url.match(/^data:image\/([a-zA-Z]+);/)?.[1] || 'png';

  const downloadOne = (it: ToneItem) => {
    if (!it.resultUrl) return;
    const a = document.createElement('a');
    a.href = it.resultUrl;
    a.download = `${outBase(it.name)}_toned.${extOf(it.resultUrl)}`;
    a.click();
  };

  const downloadZip = async () => {
    const done = items.filter((i) => i.processed && i.resultUrl);
    if (!done.length) return;
    onToast('กำลังบีบอัดเป็น ZIP...', 'info');
    try {
      const zip = new JSZip();
      const folder = zip.folder('tone-matched');
      done.forEach((it, idx) => {
        const base64 = it.resultUrl!.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
        const suffix = done.length > 1 ? `_${idx + 1}` : '';
        folder?.file(`${outBase(it.name)}_toned${suffix}.${extOf(it.resultUrl!)}`, base64, { base64: true });
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `tone_matched_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      onToast('ดาวน์โหลด ZIP เรียบร้อยแล้ว!', 'success');
    } catch {
      onToast('สร้าง ZIP ไม่สำเร็จ', 'error');
    }
  };

  const removeItem = (id: string) => {
    imagesRef.current.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearAll = () => {
    imagesRef.current.clear();
    setItems([]);
    setSampling(false);
  };

  /* ---------- render ---------- */
  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="card p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gold/12 text-gold shrink-0">
            <Palette className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-[19px] font-semibold text-ink">ปรับโทนพื้นหลังให้ตรงกัน (Tone Match)</h2>
            <p className="text-[15px] text-muted leading-relaxed max-w-2xl mt-0.5">
              ทำให้พื้นหลังของทุกรูปเป็นโทนสีเดียวกันเหมือนถ่ายจากสตูดิโอเดียว — ประมวลผลในเครื่อง คงความละเอียดเดิม 100% (ไม่ใช้ AI/โควตา)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={importFromStudio}
          className="btn btn-primary text-[15px] px-5 py-3 shrink-0"
          title="ดึงรูปที่สร้างฉากหลังเสร็จจากแท็บ AI Studio"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          ดึงรูปจาก AI Studio{importable > 0 ? ` (${importable})` : ''}
        </button>
      </div>

      {/* Upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-7 text-center cursor-pointer transition-all ${
          isDragging ? 'border-gold bg-gold/5' : 'border-line bg-white hover:border-gold/50 hover:bg-cream-2/60'
        }`}
      >
        <input
          type="file"
          ref={fileRef}
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; }}
        />
        <div className="flex flex-col items-center gap-2">
          <span className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/25 flex items-center justify-center text-gold">
            <UploadCloud className="w-6 h-6" />
          </span>
          <span className="text-[15px] font-bold uppercase tracking-[0.15em] text-ink">อัปโหลดรูปเพิ่ม หรือลากมาวาง</span>
          <span className="text-[14px] text-muted">รองรับหลายรูป (PNG · JPG · WEBP) — หรือกด "ดึงรูปจาก AI Studio" ด้านบน</span>
        </div>
      </div>

      {/* Reference colour */}
      <div className="card p-6 space-y-4">
        <h3 className="text-[15px] uppercase tracking-[0.2em] font-bold text-muted">สีพื้นหลังอ้างอิง (REFERENCE TONE)</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div
            className="w-24 h-24 rounded-2xl border border-line shrink-0 shadow-studio"
            style={{ background: targetHex, boxShadow: 'inset 0 0 0 6px #fff, var(--tw-shadow, 0 12px 32px -16px rgba(28,25,23,.16))' }}
            title={targetHex}
          />
          <div className="flex-1 min-w-[260px] space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                value={targetHex}
                maxLength={7}
                spellCheck={false}
                onChange={(e) => { const rgb = hexToRgb(e.target.value); if (rgb) applyTarget(rgb); }}
                className="w-[130px] bg-white border border-line rounded-lg px-3 py-2 text-[16px] font-bold uppercase tracking-wider text-ink focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
              />
              <input
                type="color"
                value={targetHex}
                onChange={(e) => applyTarget(hexToRgb(e.target.value))}
                className="w-11 h-10 rounded-lg border border-line bg-white cursor-pointer p-1"
                title="เลือกสีจากจานสี"
              />
              <button type="button" onClick={handleAuto} className="btn btn-ghost text-[14px] px-3.5 py-2">
                <Wand2 className="w-4 h-4 text-gold" /> Auto จากทุกรูป
              </button>
              <button
                type="button"
                onClick={() => setSampling((s) => !s)}
                className={`btn text-[14px] px-3.5 py-2 ${sampling ? 'btn-primary' : 'btn-ghost'}`}
              >
                <Pipette className="w-4 h-4" /> {sampling ? 'คลิกที่พื้นหลังของรูป…' : 'จิ้มสีจากรูป'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.hex}
                  type="button"
                  onClick={() => applyTarget(hexToRgb(p.hex))}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-white hover:border-gold/40 px-3 py-1.5 text-[14px] text-ink transition-colors cursor-pointer"
                >
                  <span className="w-4 h-4 rounded-full border border-black/10" style={{ background: p.hex }} />
                  {p.name}
                </button>
              ))}
            </div>
            <p className="text-[14px] text-muted leading-relaxed">
              ใส่ HEX เอง เลือกจากจานสี กด <b>Auto</b> ให้ระบบหาค่ากลางจากทุกรูป หรือกด <b>จิ้มสีจากรูป</b> แล้วคลิกที่พื้นหลังของรูปด้านล่าง
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={processAll} disabled={isProcessing} className="btn btn-primary text-[15px] px-6 py-3">
            {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังปรับ…</> : <><Palette className="w-4 h-4" /> ปรับโทนทุกรูป ({items.length})</>}
          </button>
          <button type="button" onClick={downloadZip} disabled={!doneCount} className="btn text-[15px] px-4 py-3 bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 shadow-sm">
            <FileArchive className="w-4 h-4" /> ดาวน์โหลดทั้งหมด (ZIP)
          </button>
          <button type="button" onClick={clearAll} className="btn btn-ghost text-[15px] px-4 py-3">
            <Trash2 className="w-4 h-4" /> ล้างรายการ
          </button>
          <span className="text-[15px] text-muted ml-auto">
            {doneCount > 0 ? <>ปรับแล้ว <b className="text-emerald-600">{doneCount}</b> / {items.length} รูป</> : `${items.length} รูป — พร้อมปรับโทน`}
          </span>
        </div>
      )}

      {/* Grid */}
      {items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line p-10 text-center">
          <p className="text-[15px] text-muted">ยังไม่มีรูป — กด "ดึงรูปจาก AI Studio" หรืออัปโหลดรูปด้านบน</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => {
            const shownUrl = it.processed && it.resultUrl ? it.resultUrl : it.originalUrl;
            return (
              <div key={it.id} className="bg-surface rounded-2xl border border-line shadow-studio overflow-hidden flex flex-col">
                <div className={`relative aspect-square bg-cream-2 ${sampling ? 'ring-2 ring-gold ring-inset cursor-crosshair' : ''}`}>
                  <img
                    src={shownUrl}
                    alt={it.name}
                    onClick={(e) => handleSampleClick(it, e)}
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                  <span className={`absolute top-2 left-2 text-[13px] font-bold rounded-full px-2.5 py-1 ${
                    it.processed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white/90 text-muted border border-line'
                  }`}>
                    {it.processed ? '✓ ปรับแล้ว' : 'ต้นฉบับ'}
                  </span>
                </div>
                <div className="p-3.5 space-y-2.5">
                  <p className="text-[15px] font-semibold text-ink truncate" title={it.name}>{it.name}</p>
                  <div className="flex items-center gap-2 text-[13px] text-muted">
                    <span className="w-4 h-4 rounded border border-black/10 shrink-0" style={{ background: rgbToHex(it.bg) }} />
                    <span className="font-mono">{rgbToHex(it.bg)}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span className="w-4 h-4 rounded border border-black/10 shrink-0" style={{ background: targetHex }} />
                    <span className="font-mono">{targetHex}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => downloadOne(it)}
                      disabled={!it.processed}
                      className="btn btn-ghost text-[13px] flex-1 justify-center px-2 py-2 disabled:opacity-40"
                    >
                      <Download className="w-3.5 h-3.5" /> โหลด
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      className="p-2 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 border border-line hover:border-rose-200 transition-colors cursor-pointer"
                      title="ลบรูปนี้"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
