/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { Header } from './components/Header';
import { PresetSelector } from './components/PresetSelector';
import { ImageUploader } from './components/ImageUploader';
import { BatchImageList } from './components/BatchImageList';
import { LightboxModal } from './components/LightboxModal';
import { Stepper, StepHeader, StepStatus } from './components/Steps';
import { ToneMatch } from './components/ToneMatch';
import { sanitizeFileName } from './utils/filename';
import { ProductImageItem, StudioConfig, StudioPreset } from './types';
import { buildPrompt, buildReferencePrompt, createUserPreset, STUDIO_PRESETS } from './data/presets';
import { Sparkles, AlertCircle, CheckCircle2, Info, Image as ImageIcon, Zap, ShieldCheck } from 'lucide-react';

export default function App() {
  const [hasApiKey, setHasApiKey] = useState(true);
  const [items, setItems] = useState<ProductImageItem[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<ProductImageItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Studio Configuration
  const [studioConfig, setStudioConfig] = useState<StudioConfig>({
    aspectRatio: '1:1',
    imageSize: '1K',
    selectedPresetId: 'studio-white-reflection', // User's requested default preset!
    productType: 'belt',
    customPrompt: '',
    isCustomPromptActive: false,
    referenceImage: undefined,
    referenceMimeType: undefined,
    isReferenceActive: false,
  });

  // User-saved presets (persisted in localStorage so they survive reloads)
  const [userPresets, setUserPresets] = useState<StudioPreset[]>(() => {
    try {
      const raw = localStorage.getItem('flare_user_presets');
      return raw ? (JSON.parse(raw) as StudioPreset[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('flare_user_presets', JSON.stringify(userPresets));
    } catch {
      /* ignore storage quota / private-mode errors */
    }
  }, [userPresets]);

  const allPresets = [...STUDIO_PRESETS, ...userPresets];

  // Product name used as the base for downloaded file names (numbered when many).
  const [productName, setProductName] = useState('');

  // Which top-level mode is showing: AI background studio, or the tone-match tool.
  const [view, setView] = useState<'studio' | 'tone'>('studio');

  // Check health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasApiKey !== undefined) {
          setHasApiKey(data.hasApiKey);
        }
      })
      .catch((err) => {
        console.warn('Health check warning:', err);
      });
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddImages = (newItems: Partial<ProductImageItem>[]) => {
    const formatted: ProductImageItem[] = newItems.map((item) => ({
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: item.name || 'รูปภาพสินค้า',
      originalUrl: item.originalUrl || '',
      mimeType: item.mimeType || 'image/png',
      status: 'idle',
      productType: item.productType || studioConfig.productType,
      createdAt: Date.now(),
    }));

    setItems((prev) => [...prev, ...formatted]);
    showToast(`เพิ่มรูปภาพสำเร็จ ${formatted.length} รูป`, 'success');
  };

  const processItemApi = async (item: ProductImageItem, currentConfig: StudioConfig): Promise<Partial<ProductImageItem>> => {
    const effectiveType = item.productType || currentConfig.productType;
    const useReference = Boolean(currentConfig.isReferenceActive && currentConfig.referenceImage);

    const promptToUse = useReference
      ? buildReferencePrompt(effectiveType)
      : buildPrompt(
          allPresets,
          currentConfig.selectedPresetId,
          currentConfig.customPrompt,
          currentConfig.isCustomPromptActive,
          effectiveType
        );

    const response = await fetch('/api/edit-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: item.originalUrl,
        mimeType: item.mimeType,
        referenceImageBase64: useReference ? currentConfig.referenceImage : undefined,
        referenceMimeType: useReference ? currentConfig.referenceMimeType : undefined,
        prompt: promptToUse,
        aspectRatio: currentConfig.aspectRatio,
        imageSize: currentConfig.imageSize,
        model: 'gemini-3.1-flash-image',
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'ไม่สามารถสร้างรูปภาพได้จาก AI');
    }

    return {
      status: 'completed',
      resultUrl: data.resultImage,
      textFeedback: data.textFeedback,
      promptUsed: promptToUse,
      aspectRatio: currentConfig.aspectRatio,
      imageSize: currentConfig.imageSize,
      completedAt: Date.now(),
    };
  };

  const handleProcessSingle = async (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;

    // Set processing status
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'processing', errorMessage: undefined } : i))
    );

    try {
      const result = await processItemApi(target, studioConfig);
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...result } : i))
      );
      showToast(`สร้างภาพสตูดิโอสำหรับ "${target.name}" เรียบร้อยแล้ว`, 'success');
    } catch (err: any) {
      console.error('Processing error:', err);
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, status: 'error', errorMessage: err?.message || 'เกิดข้อผิดพลาด' }
            : i
        )
      );
      showToast(`เกิดข้อผิดพลาดในการสร้างภาพ: ${err?.message || ''}`, 'error');
    }
  };

  const handleProcessAll = async () => {
    const pending = items.filter((i) => i.status === 'idle' || i.status === 'error');
    if (pending.length === 0) return;

    // Process several images at once, but cap concurrency so we don't slam the
    // Gemini image API and trigger 429 rate-limit errors. Raise this if your
    // Gemini quota is high (paid tier); lower it if you keep hitting rate limits.
    const CONCURRENCY = 15;

    setIsProcessingBatch(true);
    showToast(`กำลังประมวลผลพร้อมกันครั้งละ ${CONCURRENCY} รูป (ทั้งหมด ${pending.length} รูป)...`, 'info');

    // Mark every queued item as "processing" up front so the UI reflects it immediately.
    const pendingIds = new Set(pending.map((i) => i.id));
    setItems((prev) =>
      prev.map((i) => (pendingIds.has(i.id) ? { ...i, status: 'processing', errorMessage: undefined } : i))
    );

    // Shared queue drained by CONCURRENCY workers running in parallel.
    const queue = [...pending];
    const worker = async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;
        try {
          const result = await processItemApi(item, studioConfig);
          setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...result } : i)));
        } catch (err: any) {
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, status: 'error', errorMessage: err?.message || 'เกิดข้อผิดพลาด' }
                : i
            )
          );
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker())
    );

    setIsProcessingBatch(false);
    showToast('ประมวลผลรูปภาพทั้งหมดในคิวเสร็จสิ้นแล้ว!', 'success');
  };

  const handleDownloadSingle = (item: ProductImageItem) => {
    if (!item.resultUrl) return;
    const a = document.createElement('a');
    a.href = item.resultUrl;
    const ext = item.resultUrl.match(/^data:image\/([a-zA-Z]+);/)?.[1] || 'png';
    const base = productName.trim() ? sanitizeFileName(productName) : sanitizeFileName(item.name || 'Studio_Product');
    const position = items.findIndex((i) => i.id === item.id) + 1;
    const suffix = items.length > 1 ? `_${position}` : '';
    a.download = `${base}${suffix}.${ext}`;
    a.click();
    showToast(`ดาวน์โหลดรูปภาพ "${item.name}" สำเร็จ`, 'success');
  };

  const handleDownloadZip = async () => {
    const completedItems = items.filter((i) => i.status === 'completed' && i.resultUrl);
    if (completedItems.length === 0) return;

    showToast('กำลังบีบอัดไฟล์ภาพทั้งหมดเป็น ZIP...', 'info');

    try {
      const zip = new JSZip();
      const zipBase = productName.trim() ? sanitizeFileName(productName) : '';
      const folder = zip.folder(zipBase || 'ai-studio-products');

      completedItems.forEach((item, idx) => {
        if (!item.resultUrl) return;
        const base64Data = item.resultUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
        const ext = item.resultUrl.match(/^data:image\/([a-zA-Z]+);/)?.[1] || 'png';
        const base = zipBase || sanitizeFileName(item.name || 'product');
        const suffix = completedItems.length > 1 ? `_${idx + 1}` : '';
        const fileName = `${base}${suffix}.${ext}`;
        folder?.file(fileName, base64Data, { base64: true });
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipBase ? `${zipBase}.zip` : `AI_Studio_Products_HD_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      showToast('ดาวน์โหลดไฟล์ ZIP ทั้งหมดเรียบร้อยแล้ว!', 'success');
    } catch (err) {
      console.error('ZIP creation failed:', err);
      showToast('เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP', 'error');
    }
  };

  const handleRemoveSingle = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearAll = () => {
    if (confirm('คุณต้องการลบรูปภาพทั้งหมดออกจากรายการหรือไม่?')) {
      setItems([]);
      showToast('ล้างรายการรูปภาพทั้งหมดแล้ว', 'info');
    }
  };

  const handleSavePreset = (name: string) => {
    const preset = createUserPreset(name.trim() || 'พรีเซ็ตของฉัน', studioConfig.customPrompt);
    setUserPresets((prev) => [...prev, preset]);
    setStudioConfig((cfg) => ({
      ...cfg,
      selectedPresetId: preset.id,
      isCustomPromptActive: false,
      isReferenceActive: false,
    }));
    showToast(`บันทึกพรีเซ็ต "${preset.titleTh}" เรียบร้อยแล้ว`, 'success');
  };

  const handleDeletePreset = (id: string) => {
    setUserPresets((prev) => prev.filter((p) => p.id !== id));
    setStudioConfig((cfg) =>
      cfg.selectedPresetId === id ? { ...cfg, selectedPresetId: STUDIO_PRESETS[0].id } : cfg
    );
    showToast('ลบพรีเซ็ตแล้ว', 'info');
  };

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const completedItemsList = items.filter((i) => i.status === 'completed' && !!i.resultUrl);

  // Step progress: style always has a default, so step 1 is done; step 2 done
  // once images are queued; step 3 done once at least one render completes.
  const stepDones = [true, items.length > 0, completedCount > 0];
  const firstTodo = stepDones.findIndex((d) => !d);
  const stepStatuses = stepDones.map((d, i) =>
    d ? 'done' : i === firstTodo ? 'active' : 'todo'
  ) as StepStatus[];

  return (
    <div className="min-h-screen text-ink selection:bg-gold/20 selection:text-ink pb-24">
      {/* Top Header */}
      <Header
        itemCount={items.length}
        completedCount={completedCount}
        hasApiKey={hasApiKey}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Mode Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 bg-white border border-line rounded-full p-1 shadow-sm">
            {([
              { id: 'studio', label: '✨ สร้างฉากหลัง AI' },
              { id: 'tone', label: '🎨 ปรับโทนพื้นหลัง' },
            ] as const).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setView(t.id)}
                className={`px-5 py-2.5 rounded-full text-[15px] font-semibold transition-all cursor-pointer ${
                  view === t.id ? 'bg-ink text-cream shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== STUDIO VIEW ===== */}
        <div className={view === 'studio' ? 'space-y-8' : 'hidden'}>
        {/* Banner Guidance */}
        <div className="card p-6 md:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden animate-rise">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 w-56 h-56 rounded-full bg-gold/10 blur-3xl" />
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gold/12 text-gold">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="font-serif-studio text-3xl italic font-light tracking-wide text-ink">
                FLARE STUDIO — <span className="not-italic font-semibold text-[16px] tracking-[0.2em] text-muted uppercase">Professional AI Photography &amp; Background Replacement</span>
              </h2>
            </div>
            <p className="text-[18px] text-muted leading-relaxed max-w-3xl">
              ระบบเปลี่ยนฉากหลังให้สินค้าด้วยโมเดล Gemini 3.1 Flash Image โดยรักษารูปลักษณ์สินค้าต้นแบบไว้ 100% พร้อมสร้างฉากหลังสตูดิโอสีขาว แสงขาวอุ่น และเงาสะท้อนระดับช่างภาพมืออาชีพ
            </p>
          </div>

          <div className="relative z-10 shrink-0 inline-flex items-center gap-2 rounded-full bg-gold/10 border border-gold/30 px-4 py-2 text-[15px] uppercase font-bold tracking-widest text-gold-dark">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PRODUCT PRESERVED</span>
          </div>
        </div>

        {/* Progress Stepper */}
        <Stepper statuses={stepStatuses} />

        {/* STEP 1 — Studio Preset & Config Panel */}
        <section className="space-y-4">
          <StepHeader
            step={1}
            title="เลือกสไตล์ฉากหลัง & ตั้งค่าสตูดิโอ"
            subtitle="เลือกพรีเซ็ต หรืออัปโหลดรูปอ้างอิง แล้วตั้งความละเอียดและสัดส่วนภาพ"
          />
          <PresetSelector
            config={studioConfig}
            onChange={setStudioConfig}
            presets={allPresets}
            onSavePreset={handleSavePreset}
            onDeletePreset={handleDeletePreset}
          />
        </section>

        {/* STEP 2 — Image Dropzone & Sample Buttons */}
        <section className="space-y-4">
          <StepHeader
            step={2}
            title="อัปโหลดรูปภาพสินค้า"
            subtitle="ลากวางหรือเลือกไฟล์ อัปโหลดได้หลายรูปพร้อมกัน (PNG, JPG, WEBP)"
          />
          <ImageUploader onAddImages={handleAddImages} />
        </section>

        {/* STEP 3 — Batch Image List */}
        <section className="space-y-4">
          <StepHeader
            step={3}
            title="ประมวลผล & ดาวน์โหลด"
            subtitle="กดเปลี่ยนฉากหลังทีละรูปหรือทั้งชุด แล้วดาวน์โหลดผลลัพธ์ความละเอียดสูง"
          />
          <BatchImageList
            items={items}
            isProcessingBatch={isProcessingBatch}
            onProcessSingle={handleProcessSingle}
            onProcessAll={handleProcessAll}
            onDownloadSingle={handleDownloadSingle}
            onDownloadZip={handleDownloadZip}
            onRemoveSingle={handleRemoveSingle}
            onClearAll={handleClearAll}
            onOpenLightbox={(item) => setLightboxItem(item)}
            productName={productName}
            onProductNameChange={setProductName}
          />
          {items.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-line p-8 text-center">
              <p className="text-[17px] text-muted">
                ยังไม่มีรูปในคิว — อัปโหลดรูปในขั้นตอนที่ 2 ก่อน แล้วผลลัพธ์จะแสดงที่นี่
              </p>
            </div>
          )}
        </section>
        </div>

        {/* ===== TONE MATCH VIEW ===== */}
        <div className={view === 'tone' ? '' : 'hidden'}>
          <ToneMatch completedItems={completedItemsList} onToast={showToast} />
        </div>
      </main>

      {/* Lightbox High-Res Inspection Modal */}
      {lightboxItem && (
        <LightboxModal
          item={lightboxItem}
          onClose={() => setLightboxItem(null)}
          onDownload={handleDownloadSingle}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-rise">
          <div className={`flex items-center gap-3 rounded-xl px-5 py-3.5 border bg-white shadow-studio-lg text-[17px] font-semibold tracking-wide ${
            toast.type === 'success'
              ? 'border-emerald-200 text-emerald-700'
              : toast.type === 'error'
              ? 'border-rose-200 text-rose-700'
              : 'border-line text-ink'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-gold shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
