import React, { useEffect, useRef, useState } from 'react';
import {
  UploadCloud, Sparkles, Loader2, Copy, Check, Download, Save, Trash2, X,
  AlertTriangle, FolderOpen, FileText,
} from 'lucide-react';

/* ================= types ================= */
interface UploadFile { id: number; name: string; mime: string; dataURL: string; b64: string; }
interface Extracted { i?: number; cn: string; th: string; en: string; }
interface Attr { k: string; v: string; }
interface NameIdea { en: string; th: string; }
interface Overlay { label: string; text: string; }
interface ListingResult {
  productCode: string; brand: string; weight: string; dimsStr: string;
  shippingOption: string; cod: string;
  basics: { product_name: string; category: string; attributes: Attr[]; warnings: string[]; };
  names: NameIdea[];
  tiktok: { caption: string; hashtagsStr: string; overlays: Overlay[]; };
  extracted: Extracted[];
  description: string; // initial HTML (current value read from the editor ref)
}
interface SavedEntry { id: string; sku: string; name: string; savedAt: number; data: ListingResult; }

interface ListingStudioProps {
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const BATCH = 2;
const SAVED_KEY = 'lamsang_listings';

/* ================= helpers ================= */
function parseJSON(txt: string): any {
  let t = (txt || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const s = t.search(/[[{]/);
  const e = Math.max(t.lastIndexOf(']'), t.lastIndexOf('}'));
  if (s >= 0 && e > s) t = t.slice(s, e + 1);
  return JSON.parse(t);
}

function htmlToText(html: string): string {
  const s = (html || '')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/(h1|h2|h3|h4|p|li|div|ul)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
  return s.replace(/\n{3,}/g, '\n\n').trim();
}

async function callGemini(images: { data: string; mimeType: string }[], prompt: string): Promise<string> {
  const res = await fetch('/api/listing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images, prompt }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'เรียก AI ไม่สำเร็จ');
  return data.text as string;
}

function loadSaved(): SavedEntry[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch { return []; }
}
function persistSaved(list: SavedEntry[]) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

/* ================= small editable field ================= */
const CopyBtn: React.FC<{ getValue: () => string }> = ({ getValue }) => {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard?.writeText(getValue()); setDone(true); setTimeout(() => setDone(false), 1500); }}
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[13px] font-semibold transition-colors cursor-pointer ${
        done ? 'bg-emerald-600 text-white' : 'bg-gold/12 text-gold-dark hover:bg-gold/20'
      }`}
    >
      {done ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {done ? 'คัดลอกแล้ว' : 'คัดลอก'}
    </button>
  );
};

const EditableField: React.FC<{
  label: string; value: string; onChange?: (v: string) => void;
  multiline?: boolean; max?: number;
}> = ({ label, value, onChange, multiline, max }) => {
  const over = max != null && value.length > max;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] font-semibold text-muted">
          {label}
          {max != null && <span className={`ml-2 text-[13px] ${over ? 'text-rose-600' : 'text-subtle'}`}>{value.length}/{max}</span>}
        </span>
        <CopyBtn getValue={() => value} />
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          rows={2}
          className="w-full bg-cream-2/50 border border-line rounded-xl px-3.5 py-2.5 text-[15px] text-ink leading-relaxed focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 resize-y"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full bg-cream-2/50 border border-line rounded-xl px-3.5 py-2.5 text-[15px] text-ink focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
        />
      )}
    </div>
  );
};

const SectionCard: React.FC<{ tag: string; title: string; children: React.ReactNode }> = ({ tag, title, children }) => (
  <div className="card p-5 space-y-4">
    <div className="flex items-center gap-2.5">
      <span className="text-[12px] font-bold uppercase tracking-wider text-gold-dark bg-gold/12 border border-gold/25 rounded-full px-2.5 py-1">{tag}</span>
      <h3 className="text-[17px] font-semibold text-ink">{title}</h3>
    </div>
    {children}
  </div>
);

/* ================= main component ================= */
export const ListingStudio: React.FC<ListingStudioProps> = ({ onToast }) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [productCode, setProductCode] = useState('');
  const [brand, setBrand] = useState('LAMSANG');
  const [weight, setWeight] = useState('300');
  const [dimW, setDimW] = useState('15');
  const [dimL, setDimL] = useState('15');
  const [dimH, setDimH] = useState('5');

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ListingResult | null>(null);
  const [saved, setSaved] = useState<SavedEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const uidRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSaved(loadSaved()); }, []);
  // seed the rich description editor whenever a new result loads
  useEffect(() => { if (descRef.current && result) descRef.current.innerHTML = result.description || ''; }, [result]);

  /* ---------- uploads ---------- */
  const addFiles = (list: FileList | File[]) => {
    const imgs = Array.from(list).filter((f) => f.type.startsWith('image/'));
    imgs.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataURL = reader.result as string;
        setFiles((prev) => [...prev, { id: ++uidRef.current, name: f.name, mime: f.type || 'image/jpeg', dataURL, b64: dataURL.split(',')[1] }]);
      };
      reader.readAsDataURL(f);
    });
  };
  const removeFile = (id: number) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const patch = (fn: (r: ListingResult) => ListingResult) => setResult((r) => (r ? fn(r) : r));

  /* ---------- generation pipeline ---------- */
  const generate = async () => {
    if (!files.length) return;
    setError(''); setResult(null); setGenerating(true);
    try {
      const code = productCode.trim().toUpperCase();
      const br = brand.trim() || 'LAMSANG';
      const STEPS = 4;
      const batches = Math.ceil(files.length / BATCH);

      // ----- Phase 1: OCR + translate (batched) -----
      const extracted: Extracted[] = [];
      for (let b = 0; b < batches; b++) {
        const slice = files.slice(b * BATCH, (b + 1) * BATCH);
        const start = b * BATCH + 1;
        setProgress({ pct: Math.round((b / (batches + STEPS)) * 100), label: `กำลังอ่านและแปลรูปที่ ${start}–${start + slice.length - 1} จาก ${files.length}…` });
        const imgs = slice.map((f) => ({ data: f.b64, mimeType: f.mime }));
        const prompt =
`You are an OCR + translation engine for a Thai e-commerce seller (women's fashion belts & apparel).
${slice.length} product listing image(s) are provided, in order, numbered ${start} to ${start + slice.length - 1}.
For EACH image, extract only the meaningful marketing/spec Chinese text (ignore decorative English watermarks and platform logos).
Return ONLY a JSON array, no markdown, no commentary:
[{"i":<image number>,"cn":"<original chinese, joined by ' / '>","th":"<natural Thai translation>","en":"<concise English>"}]
If an image has no meaningful text, use "cn":"","th":"","en":"". Keep translations tight and natural for product listings.`;
        try {
          const raw = await callGemini(imgs, prompt);
          const arr = parseJSON(raw);
          if (Array.isArray(arr)) arr.forEach((x: Extracted) => extracted.push(x));
        } catch { /* skip failed batch */ }
      }
      extracted.sort((a, b) => (a.i || 0) - (b.i || 0));
      const withText = extracted.filter((x) => x.th && x.th.trim());
      const digest = withText.map((x) => `• ${x.th}`).join('\n');

      // ----- Phase 2a: basics -----
      setProgress({ pct: Math.round((batches / (batches + STEPS)) * 100), label: 'กำลังจัดข้อมูลพื้นฐาน (ชื่อ/หมวดหมู่/คุณลักษณะ)…' });
      const basicsRaw = await callGemini([],
`You are a Thai marketplace listing assistant for "Lamsang Store" (brand: ${br}).
Product SKU: ${code || '(none)'}
Product info extracted from listing images (Thai):
${digest}

Produce the structured fields a Thai seller pastes into Shopee/TikTok Shop. Base every value on the info above; don't invent specs. Write all Thai labels/values in natural, correct Thai — rephrased, not a word-for-word translation. Check for CONTRADICTIONS (e.g. two different widths/lengths) and list them.
Return ONLY this JSON, no markdown:
{"product_name":"<'${br} ${code} <English model name> <Thai product word> <material> ขนาด <W>x<L> cm.', <=255 chars, real size from info>","category":"<Thai category path>","attributes":[{"k":"<Thai label>","v":"<Thai value>"}],"warnings":["<Thai note>"]}
Include 4-7 attributes relevant to this product type.`);
      let basics: ListingResult['basics'];
      try { basics = parseJSON(basicsRaw); } catch { basics = { product_name: '', category: '', attributes: [], warnings: [] }; }
      basics.attributes = basics.attributes || [];
      basics.warnings = basics.warnings || [];

      // ----- Phase 2b: description (HTML) -----
      setProgress({ pct: Math.round(((batches + 1) / (batches + STEPS)) * 100), label: 'กำลังเขียนคำอธิบายสินค้า…' });
      const descRaw = await callGemini([],
`You are a top Thai e-commerce copywriter for "Lamsang Store" (brand: ${br}).
Product SKU: ${code || '(none)'}
Source product info (Thai, extracted from the images):
${digest}

STYLE (very important):
- Do NOT translate the source literally. REWRITE it into fresh, persuasive Thai sales copy.
- Sound like a real, experienced Thai online seller — warm, confident, natural; never robotic or machine-translated.
- Concise and punchy: short sentences, no filler, no repetition.
- Sell the benefit and the look/feeling it gives the buyer, not just raw specs.
- Use correct, clear, natural Thai (proper spelling and word choice).

Write the description for Shopee/TikTok Shop as an HTML fragment (rich-text). Rules:
- Return ONLY the HTML fragment. NO markdown, NO code fences, NO JSON, no commentary.
- <h2> once for a catchy title: ${br} ${code} <English model name> – <short Thai hook>
- <p> a 1-2 sentence hook that makes the buyer want it.
- <h3>จุดเด่นของสินค้า</h3> then <ul> with 4-5 <li>, each '<strong>ประโยชน์สั้นๆ</strong>: ขยายความ 1 ประโยคกระชับ' — lead with the benefit, not the spec.
- <h3>รายละเอียดสินค้า</h3> then <ul> with <li> for รหัสสินค้า (${code}), วัสดุ, ขนาด, สี, and other known specs (factual).
- A few tasteful emoji OK. Keep the whole thing tight.`);
      const description = (descRaw || '').replace(/```html/gi, '').replace(/```/g, '').trim();

      // ----- Phase 2c: tiktok + overlays -----
      setProgress({ pct: Math.round(((batches + 2) / (batches + STEPS)) * 100), label: 'กำลังร่างแคปชั่น TikTok และข้อความบนภาพ…' });
      const tiktokRaw = await callGemini([],
`You are a top Thai social-commerce copywriter for "Lamsang Store" (women's fashion).
Source product info (Thai):
${digest}

STYLE: Don't translate literally — write fresh, human, persuasive Thai that sounds like a real Thai creator. Short, punchy, natural, correct Thai. Hook first, benefit-driven.

Return ONLY this JSON, no markdown:
{"caption":"<short punchy Thai TikTok caption: strong hook + benefit + 1-2 emoji>","hashtags":["<10-12 relevant Thai/English hashtags, each starting with #>"],"overlays":[{"label":"<short role e.g. Hook / จุดขาย 1 / สเปก>","text":"<very short benefit-driven Thai on-image text>"}]}
Provide 4-6 overlay suggestions: an attention-grabbing hook headline, key selling points, and a spec caption.`);
      let tiktok: { caption: string; hashtags: string[]; overlays: Overlay[] };
      try { tiktok = parseJSON(tiktokRaw); } catch { tiktok = { caption: tiktokRaw, hashtags: [], overlays: [] }; }

      // ----- Phase 2d: english names -----
      setProgress({ pct: Math.round(((batches + 3) / (batches + STEPS)) * 100), label: 'กำลังคิดชื่อสินค้าภาษาอังกฤษ…' });
      const namesRaw = await callGemini([],
`You are a brand naming specialist for "Lamsang Store" (Thai women's fashion).
Product info (Thai):
${digest}

Suggest 6 distinct English product names for this women's fashion item, suitable as a listing/model name. Vary the mood: elegant, minimal, trendy, soft-luxury, classic, playful. Each 1-3 words, easy to pronounce, NOT an existing famous luxury brand.
Return ONLY this JSON, no markdown:
{"names":[{"en":"<English name>","th":"<สื่อความหมาย/อารมณ์ของชื่อ สั้นๆ เป็นภาษาไทย>"}]}`);
      let names: NameIdea[];
      try { names = parseJSON(namesRaw).names || []; } catch { names = []; }

      setProgress({ pct: 100, label: 'เสร็จแล้ว ✓' });
      setTimeout(() => setProgress(null), 600);

      setResult({
        productCode: code, brand: br, weight: weight.trim() || '300',
        dimsStr: `${dimW || '15'} x ${dimL || '15'} x ${dimH || '5'}`,
        shippingOption: 'ค่าเริ่มต้น', cod: 'เปิด',
        basics,
        names,
        tiktok: { caption: tiktok.caption || '', hashtagsStr: (tiktok.hashtags || []).join(' '), overlays: tiktok.overlays || [] },
        extracted: withText,
        description,
      });
      onToast('สร้างก็อปปี้เรียบร้อยแล้ว ✓', 'success');
    } catch (e: any) {
      setProgress(null);
      setError('เกิดข้อผิดพลาด: ' + (e?.message || e) + ' — ลองกดสร้างอีกครั้ง หรือลดจำนวนรูปต่อครั้ง');
    } finally {
      setGenerating(false);
    }
  };

  /* ---------- export / save ---------- */
  const buildExport = (r: ListingResult): string => {
    const descText = htmlToText(descRef.current?.innerHTML || r.description);
    let t = '=== LAMSANG LISTING ===\n';
    if (r.productCode) t += 'รหัสสินค้า (SKU): ' + r.productCode + '\n';
    t += '\n';
    if (r.basics.warnings.length) t += '[ ต้องเช็ค ]\n' + r.basics.warnings.map((x) => '- ' + x).join('\n') + '\n\n';
    t += '[ ข้อมูลพื้นฐาน ]\n';
    t += 'ชื่อสินค้า: ' + (r.basics.product_name || '-') + '\n';
    t += 'หมวดหมู่: ' + (r.basics.category || '-') + '\n';
    t += 'แบรนด์: ' + r.brand + '\n';
    if (r.basics.attributes.length) t += 'คุณลักษณะ:\n' + r.basics.attributes.map((a) => `  - ${a.k}: ${a.v}`).join('\n') + '\n';
    t += '\n';
    if (r.names.length) t += '[ ชื่ออังกฤษ (ตัวเลือกอื่น) ]\n' + r.names.map((n) => `- ${n.en} — ${n.th}`).join('\n') + '\n\n';
    t += '[ รายละเอียดสินค้า ]\n' + (descText || '-') + '\n\n';
    t += '[ การจัดส่ง ]\n';
    t += 'น้ำหนัก: ' + r.weight + ' ก.\n';
    t += 'ขนาดพัสดุ: ' + r.dimsStr + ' ซม.\n';
    t += 'ตัวเลือกการจัดส่ง: ' + r.shippingOption + '\n';
    t += 'เก็บเงินปลายทาง (COD): ' + r.cod + '\n\n';
    t += '[ TIKTOK ]\nแคปชั่น: ' + (r.tiktok.caption || '-') + '\n\nแฮชแท็ก: ' + r.tiktok.hashtagsStr + '\n\n';
    if (r.tiktok.overlays.length) t += '[ ข้อความบนภาพ ]\n' + r.tiktok.overlays.map((o) => `(${o.label}) ${o.text}`).join('\n') + '\n\n';
    t += '[ ข้อความที่แกะได้ ]\n' + r.extracted.map((x) => `จีน: ${x.cn}\nไทย: ${x.th}\nEN: ${x.en}\n`).join('\n');
    return t;
  };

  const downloadTxt = () => {
    if (!result) return;
    const fname = 'lamsang-' + ((result.productCode || 'listing').replace(/[^\w-]/g, '') || 'listing') + '.txt';
    const blob = new Blob([buildExport(result)], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = fname; a.click();
    URL.revokeObjectURL(a.href);
  };

  const saveListing = () => {
    if (!result) return;
    const current: ListingResult = { ...result, description: descRef.current?.innerHTML || result.description };
    const id = current.productCode || 'LS' + Date.now();
    const entry: SavedEntry = { id, sku: current.productCode, name: current.basics.product_name || id, savedAt: Date.now(), data: current };
    const next = [entry, ...saved.filter((s) => s.id !== id)];
    setSaved(next); persistSaved(next);
    onToast('บันทึกรายการแล้ว', 'success');
  };

  const openSaved = (entry: SavedEntry) => {
    const d = entry.data;
    setProductCode(d.productCode); setBrand(d.brand); setWeight(d.weight);
    const dims = (d.dimsStr || '').split(/x|×/i).map((s) => s.trim());
    setDimW(dims[0] || '15'); setDimL(dims[1] || '15'); setDimH(dims[2] || '5');
    setResult(d);
    onToast(`เปิด "${entry.sku || entry.id}" แล้ว`, 'info');
  };

  const deleteSaved = (id: string) => {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next); persistSaved(next);
  };

  /* ---------- render ---------- */
  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="card p-6 md:p-7">
        <h2 className="text-[22px] font-bold text-ink leading-tight">
          ลากรูปสินค้าลงไป <span className="text-gold-dark">แล้วปล่อยให้ AI เขียนให้</span>
        </h2>
        <p className="text-[15px] text-muted leading-relaxed max-w-3xl mt-2">
          อัปโหลดรูปรายละเอียดสินค้า (ภาษาจีน) ของสินค้า 1 ตัว — ระบบจะแกะข้อความ แปลไทย+อังกฤษ เตือนถ้าสเปกขัดกัน แล้วร่างชื่อ/รายละเอียด แคปชั่น แฮชแท็ก และข้อความวางบนภาพให้ครบ (ใช้ Gemini)
        </p>
      </div>

      {/* Input panel */}
      <div className="card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[14px] font-semibold text-muted">รหัสสินค้า (SKU) <span className="text-subtle">— ใส่ก่อนอัปโหลด</span></label>
            <input value={productCode} onChange={(e) => setProductCode(e.target.value)} placeholder="เช่น B22, P08" spellCheck={false}
              className="w-full bg-cream-2/50 border border-line rounded-xl px-3.5 py-2.5 text-[16px] font-bold uppercase tracking-wide text-ink focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[14px] font-semibold text-muted">แบรนด์</label>
            <input value={brand} onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-cream-2/50 border border-line rounded-xl px-3.5 py-2.5 text-[15px] text-ink focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[14px] font-semibold text-muted">น้ำหนัก (ก.)</label>
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-cream-2/50 border border-line rounded-xl px-3.5 py-2.5 text-[15px] text-ink focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[14px] font-semibold text-muted">ขนาดพัสดุ ก×ย×ส (ซม.)</label>
          <div className="flex items-center gap-2 max-w-xs">
            {[[dimW, setDimW], [dimL, setDimL], [dimH, setDimH]].map(([v, set], i) => (
              <React.Fragment key={i}>
                <input type="number" value={v as string} onChange={(e) => (set as (s: string) => void)(e.target.value)}
                  className="w-full text-center bg-cream-2/50 border border-line rounded-xl px-2 py-2.5 text-[15px] text-ink focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15" />
                {i < 2 && <span className="text-muted font-bold">×</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed p-7 text-center cursor-pointer transition-all ${
            isDragging ? 'border-gold bg-gold/5' : 'border-line bg-cream-2/40 hover:border-gold/50 hover:bg-gold/5'
          }`}
        >
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }} />
          <span className="inline-flex w-12 h-12 rounded-2xl bg-gold/10 border border-gold/25 items-center justify-center text-gold mb-2">
            <UploadCloud className="w-6 h-6" />
          </span>
          <p className="text-[16px] font-bold text-ink">ลากรูปมาวาง หรือคลิกเพื่อเลือก</p>
          <p className="text-[14px] text-muted mt-1">รองรับหลายรูป (JPG / PNG) — ใส่เฉพาะรูปของสินค้าตัวเดียว</p>
        </div>

        {/* Thumbnails */}
        {files.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5">
            {files.map((f, i) => (
              <div key={f.id} className="relative aspect-square rounded-xl overflow-hidden border border-line bg-cream-2">
                <img src={f.dataURL} alt="" className="w-full h-full object-cover" />
                <span className="absolute left-1 top-1 bg-ink/70 text-white text-[12px] font-bold px-1.5 rounded-full">{i + 1}</span>
                <button type="button" onClick={() => removeFile(f.id)}
                  className="absolute right-1 top-1 w-5 h-5 rounded-full bg-ink/70 text-white flex items-center justify-center hover:bg-rose-500 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={generate} disabled={!files.length || generating} className="btn btn-primary text-[15px] px-6 py-3">
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังสร้าง…</> : <><Sparkles className="w-4 h-4 fill-white" /> สร้างก็อปปี้ทั้งชุด</>}
          </button>
          {files.length > 0 && (
            <button type="button" onClick={() => { setFiles([]); setResult(null); setError(''); setProductCode(''); }} className="btn btn-ghost text-[15px] px-4 py-3">
              เริ่มสินค้าใหม่
            </button>
          )}
          <span className="text-[14px] text-muted ml-auto">{files.length ? `${files.length} รูป` : 'ยังไม่มีรูป'}</span>
        </div>

        {progress && (
          <div className="space-y-2">
            <div className="h-2 rounded-full bg-cream-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gold to-[#d9a85f] transition-all" style={{ width: `${progress.pct}%` }} />
            </div>
            <div className="flex items-center gap-2 text-[14px] text-muted">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />{progress.label}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-[14px] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{error}
          </div>
        )}
      </div>

      {/* Saved listings */}
      {saved.length > 0 && (
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-ink flex items-center gap-2"><FolderOpen className="w-4 h-4 text-gold" /> รายการที่บันทึกไว้</h3>
            <span className="text-[14px] text-muted">{saved.length} รายการ</span>
          </div>
          <div className="space-y-2">
            {saved.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-cream-2/40 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-gold-dark truncate">{s.sku || s.id}</p>
                  <p className="text-[14px] text-ink truncate">{s.name}</p>
                  <p className="text-[13px] text-subtle">{new Date(s.savedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" onClick={() => openSaved(s)} className="btn btn-ghost text-[13px] px-3 py-1.5"><FolderOpen className="w-3.5 h-3.5" /> เปิด</button>
                  <button type="button" onClick={() => deleteSaved(s.id)} className="p-2 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 border border-line hover:border-rose-200 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {result.productCode && (
            <div className="inline-flex items-center gap-2 rounded-full bg-gold/12 border border-gold/25 text-gold-dark text-[14px] font-bold px-4 py-1.5">
              รหัสสินค้า: {result.productCode}
            </div>
          )}

          {result.basics.warnings.length > 0 && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <h4 className="text-[15px] font-bold text-amber-800 flex items-center gap-2 mb-1.5"><AlertTriangle className="w-4 h-4" /> จุดที่ต้องเช็คก่อนปล่อยขาย</h4>
              <ul className="list-disc pl-5 text-[14px] text-amber-800 space-y-1">
                {result.basics.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <SectionCard tag="BASIC" title="ข้อมูลพื้นฐาน">
            <EditableField label="ชื่อสินค้า" value={result.basics.product_name} max={255} onChange={(v) => patch((r) => ({ ...r, basics: { ...r.basics, product_name: v } }))} multiline />
            <EditableField label="หมวดหมู่" value={result.basics.category} onChange={(v) => patch((r) => ({ ...r, basics: { ...r.basics, category: v } }))} />
            <EditableField label="แบรนด์" value={result.brand} onChange={(v) => patch((r) => ({ ...r, brand: v }))} />
            {result.basics.attributes.length > 0 && (
              <div className="space-y-3 pt-1">
                <p className="text-[13px] uppercase tracking-wider font-bold text-subtle">คุณลักษณะ</p>
                {result.basics.attributes.map((a, i) => (
                  <EditableField key={i} label={a.k} value={a.v} onChange={(v) => patch((r) => { const attrs = [...r.basics.attributes]; attrs[i] = { ...attrs[i], v }; return { ...r, basics: { ...r.basics, attributes: attrs } }; })} />
                ))}
              </div>
            )}
          </SectionCard>

          {result.names.length > 0 && (
            <SectionCard tag="NAME" title="ชื่อสินค้าอังกฤษ (ตัวเลือกอื่น)">
              {result.names.map((n, i) => (
                <EditableField key={i} label={n.th || 'ชื่อ'} value={n.en} onChange={(v) => patch((r) => { const names = [...r.names]; names[i] = { ...names[i], en: v }; return { ...r, names }; })} />
              ))}
            </SectionCard>
          )}

          <SectionCard tag="DETAILS" title="รายละเอียดสินค้า">
            <div className="flex items-center justify-end">
              <CopyBtn getValue={() => htmlToText(descRef.current?.innerHTML || result.description)} />
            </div>
            <div
              ref={descRef}
              contentEditable
              suppressContentEditableWarning
              className="listing-rich w-full bg-cream-2/50 border border-line rounded-xl px-4 py-3.5 text-[15px] text-ink leading-relaxed focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
            />
          </SectionCard>

          <SectionCard tag="SHIPPING" title="การจัดส่ง">
            <EditableField label="น้ำหนักพัสดุ (ก.)" value={result.weight} onChange={(v) => patch((r) => ({ ...r, weight: v }))} />
            <EditableField label="ขนาดพัสดุ ก×ย×ส (ซม.)" value={result.dimsStr} onChange={(v) => patch((r) => ({ ...r, dimsStr: v }))} />
            <EditableField label="ตัวเลือกการจัดส่ง" value={result.shippingOption} onChange={(v) => patch((r) => ({ ...r, shippingOption: v }))} />
            <EditableField label="เก็บเงินปลายทาง (COD)" value={result.cod} onChange={(v) => patch((r) => ({ ...r, cod: v }))} />
          </SectionCard>

          <SectionCard tag="TIKTOK" title="TikTok">
            <EditableField label="แคปชั่น (Caption)" value={result.tiktok.caption} multiline onChange={(v) => patch((r) => ({ ...r, tiktok: { ...r.tiktok, caption: v } }))} />
            <EditableField label="แฮชแท็ก (Hashtags)" value={result.tiktok.hashtagsStr} multiline onChange={(v) => patch((r) => ({ ...r, tiktok: { ...r.tiktok, hashtagsStr: v } }))} />
          </SectionCard>

          {result.tiktok.overlays.length > 0 && (
            <SectionCard tag="ON-IMAGE" title="ข้อความสำหรับวางบนภาพ">
              {result.tiktok.overlays.map((o, i) => (
                <EditableField key={i} label={o.label || 'ข้อความ'} value={o.text} multiline onChange={(v) => patch((r) => { const ov = [...r.tiktok.overlays]; ov[i] = { ...ov[i], text: v }; return { ...r, tiktok: { ...r.tiktok, overlays: ov } }; })} />
              ))}
            </SectionCard>
          )}

          {result.extracted.length > 0 && (
            <SectionCard tag="OCR" title="ข้อความที่แกะได้ (จีน / ไทย / อังกฤษ)">
              <div className="overflow-x-auto">
                <table className="w-full text-[14px] border-collapse">
                  <thead>
                    <tr className="text-left text-[12px] uppercase tracking-wide text-subtle">
                      <th className="py-2 pr-3 border-b-2 border-line">จีน</th>
                      <th className="py-2 pr-3 border-b-2 border-line">ไทย</th>
                      <th className="py-2 border-b-2 border-line">English</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.extracted.map((x, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-3 border-b border-line text-muted align-top w-1/3">{x.cn}</td>
                        <td className="py-2 pr-3 border-b border-line align-top">{x.th}</td>
                        <td className="py-2 border-b border-line align-top">{x.en}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Footer actions */}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={saveListing} className="btn text-[15px] px-5 py-3 bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"><Save className="w-4 h-4" /> บันทึก</button>
            <button type="button" onClick={() => { navigator.clipboard?.writeText(buildExport(result)); onToast('คัดลอกทั้งหมดแล้ว', 'success'); }} className="btn btn-ghost text-[15px] px-5 py-3"><FileText className="w-4 h-4" /> คัดลอกทั้งหมด</button>
            <button type="button" onClick={downloadTxt} className="btn btn-primary text-[15px] px-5 py-3"><Download className="w-4 h-4" /> ดาวน์โหลด .txt</button>
          </div>
        </div>
      )}
    </div>
  );
};
