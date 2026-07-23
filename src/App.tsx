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
import { ProductImageItem, StudioConfig } from './types';
import { buildPrompt, STUDIO_PRESETS } from './data/presets';
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
  });

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
    const promptToUse = buildPrompt(
      currentConfig.selectedPresetId,
      currentConfig.customPrompt,
      currentConfig.isCustomPromptActive,
      item.productType || currentConfig.productType
    );

    const response = await fetch('/api/edit-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: item.originalUrl,
        mimeType: item.mimeType,
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

    setIsProcessingBatch(true);
    showToast(`กำลังเริ่มประมวลผล Batch สำหรับ ${pending.length} รูป...`, 'info');

    for (const item of pending) {
      // Mark current item as processing
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'processing', errorMessage: undefined } : i))
      );

      try {
        const result = await processItemApi(item, studioConfig);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, ...result } : i))
        );
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

    setIsProcessingBatch(false);
    showToast('ประมวลผลรูปภาพทั้งหมดในคิวเสร็จสิ้นแล้ว!', 'success');
  };

  const handleDownloadSingle = (item: ProductImageItem) => {
    if (!item.resultUrl) return;
    const a = document.createElement('a');
    a.href = item.resultUrl;
    a.download = `Studio_Product_${item.id}_${item.imageSize || '1K'}.png`;
    a.click();
    showToast(`ดาวน์โหลดรูปภาพ "${item.name}" สำเร็จ`, 'success');
  };

  const handleDownloadZip = async () => {
    const completedItems = items.filter((i) => i.status === 'completed' && i.resultUrl);
    if (completedItems.length === 0) return;

    showToast('กำลังบีบอัดไฟล์ภาพทั้งหมดเป็น ZIP...', 'info');

    try {
      const zip = new JSZip();
      const folder = zip.folder('ai-studio-products');

      completedItems.forEach((item, idx) => {
        if (!item.resultUrl) return;
        const base64Data = item.resultUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
        const ext = item.mimeType?.includes('png') ? 'png' : 'jpg';
        const cleanName = item.name.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
        const fileName = `${idx + 1}_${cleanName}_4K.${ext}`;
        folder?.file(fileName, base64Data, { base64: true });
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AI_Studio_Products_HD_${Date.now()}.zip`;
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

  const completedCount = items.filter((i) => i.status === 'completed').length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-white selection:text-black pb-20">
      {/* Top Header */}
      <Header
        itemCount={items.length}
        completedCount={completedCount}
        hasApiKey={hasApiKey}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Banner Guidance */}
        <div className="bg-[#0d0d0d] border border-white/10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="space-y-1.5 relative z-10">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <h2 className="font-serif-studio text-xl italic font-light tracking-wide text-white">
                FLARE STUDIO — <span className="not-italic font-semibold text-xs tracking-[0.2em] text-white/80 uppercase">Professional AI Photography & Background Replacement</span>
              </h2>
            </div>
            <p className="text-xs text-white/60 leading-relaxed max-w-3xl">
              ระบบเปลี่ยนฉากหลังให้สินค้าด้วยโมเดล Gemini 3.1 Flash Image โดยรักษารูปลักษณ์สินค้าต้นแบบไว้ 100% พร้อมสร้างฉากหลังสตูดิโอสีขาว แสงขาวอุ่น และเงาสะท้อนระดับช่างภาพมืออาชีพ
            </p>
          </div>

          <div className="shrink-0 flex items-center space-x-2 bg-white/5 border border-white/15 px-4 py-2 text-[10px] uppercase font-bold tracking-widest text-amber-300">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>PRODUCT PRESERVED</span>
          </div>
        </div>

        {/* Studio Preset & Config Panel */}
        <PresetSelector
          config={studioConfig}
          onChange={setStudioConfig}
        />

        {/* Image Dropzone & Sample Buttons */}
        <ImageUploader onAddImages={handleAddImages} />

        {/* Batch Image List */}
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
        />
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
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`flex items-center space-x-3 px-5 py-3.5 border backdrop-blur-md text-[11px] font-bold uppercase tracking-widest ${
            toast.type === 'success'
              ? 'bg-[#0d0d0d] border-emerald-500/60 text-emerald-300'
              : toast.type === 'error'
              ? 'bg-[#0d0d0d] border-rose-500/60 text-rose-300'
              : 'bg-[#0d0d0d] border-white/20 text-white'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-amber-300 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
