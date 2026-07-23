import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Plus } from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../utils/sampleGenerator';
import { ProductImageItem, ProductType } from '../types';

interface ImageUploaderProps {
  onAddImages: (newItems: Partial<ProductImageItem>[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onAddImages }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (base64) {
          let guessedType: ProductType = 'general';
          const nameLower = file.name.toLowerCase();
          if (nameLower.includes('belt') || nameLower.includes('เข็มขัด')) guessedType = 'belt';
          else if (nameLower.includes('watch') || nameLower.includes('นาฬิกา')) guessedType = 'watch';
          else if (nameLower.includes('bag') || nameLower.includes('กระเป๋า')) guessedType = 'bag';
          else if (nameLower.includes('shoe') || nameLower.includes('รองเท้า')) guessedType = 'shoes';

          onAddImages([{
            name: file.name,
            mimeType: file.type || 'image/png',
            originalUrl: base64,
            productType: guessedType,
          }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleAddSample = (sample: Partial<ProductImageItem>) => {
    onAddImages([{
      name: sample.name,
      mimeType: sample.mimeType,
      originalUrl: sample.originalUrl,
      productType: sample.productType,
    }]);
  };

  return (
    <div className="space-y-4">
      {/* File Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-9 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-gold bg-gold/5 scale-[1.01]'
            : 'border-line bg-white hover:border-gold/50 hover:bg-cream-2/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          multiple
          accept="image/*"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/25 flex items-center justify-center text-gold">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-[17px] font-bold uppercase tracking-[0.2em] text-ink">
              อัปโหลดรูปภาพสินค้า — ลากและวางไฟล์ที่นี่ (DRAG &amp; DROP)
            </h3>
            <p className="text-[17px] text-muted mt-1.5">
              รองรับไฟล์หลายรูปพร้อมกัน (PNG, JPG, WEBP) สำหรับประมวลผลเปลี่ยนฉากหลัง AI เป็นชุด
            </p>
          </div>

          <button
            type="button"
            className="btn btn-ink text-[15px] uppercase tracking-widest px-6 py-2.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เลือกรูปภาพจากคอมพิวเตอร์ (SELECT FILES)</span>
          </button>
        </div>
      </div>

      {/* Quick Sample Photos */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span className="text-[15px] uppercase tracking-widest text-muted font-semibold">
            TEST SAMPLES (รูปสินค้าตัวอย่าง):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_PRODUCTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddSample(sample)}
              className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-cream-2 border border-line hover:border-gold/40 px-3.5 py-1.5 text-[15px] uppercase tracking-widest text-ink transition-all cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-gold" />
              <span>{sample.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
