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
    const newItems: Partial<ProductImageItem>[] = [];

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
        className={`relative border border-dashed p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-white bg-white/10'
            : 'border-white/20 bg-[#0d0d0d] hover:border-white/40 hover:bg-white/5'
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
          <div className="w-14 h-14 bg-white/5 border border-white/20 flex items-center justify-center text-white">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
              อัปโหลดรูปภาพสินค้า — ลากและวางไฟล์ที่นี่ (DRAG & DROP)
            </h3>
            <p className="text-[11px] text-white/50 mt-1">
              รองรับไฟล์หลายรูปพร้อมกัน (PNG, JPG, WEBP) สำหรับประมวลผลเปลี่ยนฉากหลัง AI เป็นชุด
            </p>
          </div>

          <button
            type="button"
            className="bg-white text-black text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 hover:bg-zinc-200 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เลือกรูปภาพจากคอมพิวเตอร์ (SELECT FILES)</span>
          </button>
        </div>
      </div>

      {/* Quick Sample Photos */}
      <div className="bg-[#0d0d0d] border border-white/10 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span className="text-[10px] uppercase tracking-widest text-white/70">
            TEST SAMPLES (รูปสินค้าตัวอย่าง):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_PRODUCTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddSample(sample)}
              className="flex items-center space-x-2 bg-white/5 hover:bg-white/15 border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-widest text-white hover:text-amber-200 transition-all cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
              <span>{sample.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
