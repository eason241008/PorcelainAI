import React, { useRef } from 'react';
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ImageAsset } from '../types';

interface DropAreaProps {
  title: string;
  subtitle: string;
  selectedAsset: ImageAsset | null;
  uploadedImage: string | null;
  onClear: () => void;
  onUpload: (file: File) => void;
  isActive: boolean;
  type: 'fragment' | 'vessel';
}

export const DropArea: React.FC<DropAreaProps> = ({ 
  title, 
  subtitle, 
  selectedAsset, 
  uploadedImage, 
  onClear, 
  onUpload,
  isActive,
  type
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const imageSrc = uploadedImage || selectedAsset?.url;
  const displayTitle = selectedAsset?.title || (uploadedImage ? "自定义上传" : null);

  return (
    <div className={`flex-1 flex flex-col h-full transition-all duration-500 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2 hover:opacity-80'}`}>
      <div className="flex justify-between items-baseline mb-4 px-2">
        <h3 className="text-2xl font-serif text-clay-900 italic">{title}</h3>
        <span className="text-[10px] font-bold text-indigo-light uppercase tracking-[0.2em] border border-indigo-light/30 px-2 py-1 rounded-full">{type}</span>
      </div>
      
      <div 
        className={`
          relative flex-grow min-h-[360px] rounded-sm transition-all duration-500 group overflow-hidden
          ${imageSrc 
            ? 'bg-white shadow-md' 
            : 'bg-clay-100/30 border border-dashed border-clay-300 hover:border-indigo-dye/40 hover:bg-clay-100/50'
          }
        `}
      >
        {imageSrc ? (
          <>
            <div className="absolute inset-0 p-4 pb-16">
               <img src={imageSrc} alt="Selected" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            
            <button 
              onClick={onClear}
              className="absolute top-4 right-4 bg-white/80 backdrop-blur text-clay-900 p-2 rounded-full shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors z-20"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 border-t border-clay-100 z-10">
              <p className="font-serif text-lg text-clay-900 text-center">{displayTitle}</p>
              {selectedAsset && <p className="text-xs text-center text-clay-500 mt-1 font-light tracking-wide">{selectedAsset.description}</p>}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            
            {/* Decorative corners for empty state */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-clay-300"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-clay-300"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-clay-300"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-clay-300"></div>

            <div 
              className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-6 cursor-pointer hover:scale-105 hover:shadow-md transition-all duration-300 text-clay-400 hover:text-indigo-dye group-hover:bg-indigo-dye group-hover:text-white"
              onClick={() => fileInputRef.current?.click()}
            >
              <ArrowUpTrayIcon className="w-8 h-8" />
            </div>
            
            <p className="text-clay-900 font-serif text-lg mb-2">上传图片</p>
            <p className="text-clay-500 text-xs uppercase tracking-widest mb-6">JPG • PNG • WEBP</p>
            
            <div className="flex items-center gap-3 w-full max-w-[200px] mb-6">
              <div className="h-px bg-clay-300 flex-1"></div>
              <span className="text-[10px] text-clay-400 font-serif italic">或</span>
              <div className="h-px bg-clay-300 flex-1"></div>
            </div>
            
            <p className="text-sm text-clay-500 font-light leading-relaxed max-w-[80%]">
              从下方的 <br/> <span className="font-medium text-indigo-light">典藏</span> 中选择
            </p>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};