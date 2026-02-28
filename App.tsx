import React, { useState, useRef, useEffect } from 'react';
import { Gallery } from './components/Gallery';
import { DropArea } from './components/DropArea';
import { ShowcaseCarousel } from './components/ShowcaseCarousel';
import { ImageAsset, GenerationStatus } from './types';
import { generateStyledPottery, urlToBase64 } from './services/styleTransferService';
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { ExclamationCircleIcon, AdjustmentsHorizontalIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import html2canvas from 'html2canvas';

import { MOCK_DATABASE, MOCK_RESTORATIONS } from './constants';

function App() {
  // State for selections
  const [selectedStyle, setSelectedStyle] = useState<ImageAsset | null>(MOCK_DATABASE.find(item => item.id === 'CZZ_0851') || null);
  const [uploadedStyle, setUploadedStyle] = useState<string | null>(null);
  
  const [selectedContent, setSelectedContent] = useState<ImageAsset | null>(MOCK_DATABASE.find(item => item.id === '3264') || null);
  const [uploadedContent, setUploadedContent] = useState<string | null>(null);

  // State for generation
  const [status, setStatus] = useState<GenerationStatus>('success');
  const [resultImage, setResultImage] = useState<string | null>(MOCK_RESTORATIONS.find(item => item.id === 'res_3264')?.result || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExportingPoster, setIsExportingPoster] = useState(false);
  const [posterError, setPosterError] = useState<string | null>(null);

  // Advanced generation params
  const [ipAdapterWeight, setIpAdapterWeight] = useState(0.8);
  const [controlNetWeight, setControlNetWeight] = useState(0.6);
  const [denoisingStrength, setDenoisingStrength] = useState(0.75);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const resultRef = useRef<HTMLDivElement>(null);
  const workbenchRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  // File validation constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  // Helper to handle file uploads
  const handleFileUpload = (file: File, type: 'style' | 'content') => {
    // Validate file format
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('仅支持 JPG、PNG、WEBP 格式的图片');
      setTimeout(() => setUploadError(null), 4000);
      return;
    }
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`文件大小不能超过 5MB（当前 ${(file.size / 1024 / 1024).toFixed(1)}MB）`);
      setTimeout(() => setUploadError(null), 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'style') {
        setUploadedStyle(result);
        setSelectedStyle(null);
      } else {
        setUploadedContent(result);
        setSelectedContent(null);
      }
      // Auto scroll to workbench when interaction starts
      workbenchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    reader.readAsDataURL(file);
  };

  // Handle Gallery Selection
  const handleGallerySelect = (asset: ImageAsset) => {
    if (asset.type === 'fragment') {
      setSelectedStyle(asset);
      setUploadedStyle(null);
    } else {
      setSelectedContent(asset);
      setUploadedContent(null);
    }
    workbenchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Main Generation Logic
  const handleGenerate = async () => {
    const styleSource = uploadedStyle || selectedStyle?.url;
    const contentSource = uploadedContent || selectedContent?.url;

    if (!styleSource || !contentSource) return;

    setStatus('processing');
    setErrorMessage(null);
    setResultImage(null);

    try {
      // 1. Prepare Base64 Data
      let styleBase64 = '';
      if (uploadedStyle) {
        styleBase64 = uploadedStyle.split(',')[1];
      } else if (selectedStyle) {
        styleBase64 = (await urlToBase64(selectedStyle.url)).split(',')[1];
      }

      let contentBase64 = '';
      if (uploadedContent) {
        contentBase64 = uploadedContent.split(',')[1];
      } else if (selectedContent) {
        contentBase64 = (await urlToBase64(selectedContent.url)).split(',')[1];
      }

      // 2. Call Service
      const generatedImage = await generateStyledPottery(styleBase64, contentBase64, ipAdapterWeight, controlNetWeight, denoisingStrength);
      setResultImage(generatedImage);
      setStatus('success');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message || "生成图片失败，请重试。");
    }
  };

  // Scroll to result on success
  useEffect(() => {
    if (status === 'success' && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [status]);

  // Elapsed time counter during processing
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === 'processing') {
      setElapsedTime(0);
      interval = setInterval(() => setElapsedTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleExportPoster = async () => {
    if (!posterRef.current || !resultImage || isExportingPoster) return;

    setIsExportingPoster(true);
    setPosterError(null);

    try {
      const canvas = await html2canvas(posterRef.current, {
        backgroundColor: '#1f2126',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `porcelain-ai-poster-${Date.now()}.png`;
      link.click();
    } catch (error) {
      console.error(error);
      setPosterError('海报生成失败，请稍后重试。');
    } finally {
      setIsExportingPoster(false);
    }
  };

  const canGenerate = (uploadedStyle || selectedStyle) && (uploadedContent || selectedContent) && status !== 'processing';

  return (
    <div className="min-h-screen pb-20 relative">

      {/* Upload Error Toast */}
      {uploadError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 text-sm font-medium">
            <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
            {uploadError}
          </div>
        </div>
      )}

      {/* Decorative Top Border */}
      <div className="h-1 w-full bg-gradient-to-r from-clay-200 via-indigo-dye to-clay-200 sticky top-0 z-[60]"></div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-clay-200 sticky top-1 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <div className="w-10 h-10 bg-indigo-dye text-white font-serif text-xl flex items-center justify-center rounded-sm shadow-md transition-transform group-hover:rotate-3">
              P
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-serif text-clay-900 tracking-wide leading-none">Porcelain<span className="text-indigo-dye">AI</span></h1>
              <span className="text-[10px] uppercase tracking-[0.2em] text-clay-500 mt-1">AI 数字化修复</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-clay-600">
             <a href="#workbench" className="hover:text-indigo-dye transition-colors">工坊</a>
             <a href="#archive" className="hover:text-indigo-dye transition-colors">典藏</a>
          </nav>
        </div>
      </header>

      <main className="w-full space-y-0">
        
        {/* Hero / Intro */}
        <section className="relative pt-20 pb-12 text-center max-w-4xl mx-auto px-6">
          <h2 className="text-5xl md:text-7xl font-serif text-clay-900 leading-[1.1] mb-6">
            以想象力<br/>
            <span className="italic text-indigo-dye relative inline-block">
              重塑历史
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-indigo-light/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </span>
          </h2>
          <p className="text-xl text-clay-600 font-light max-w-2xl mx-auto leading-relaxed">
            让古老的碎片重获新生。
            <br className="hidden md:block" />
            将千年的神韵，无缝融入现代器型之中。
          </p>
        </section>

        {/* Showcase Carousel */}
        <section className="border-y border-clay-200 bg-white/50 backdrop-blur-sm mb-16">
          <ShowcaseCarousel />
        </section>

        {/* Workbench */}
        <div id="workbench" ref={workbenchRef} className="max-w-7xl mx-auto px-6 scroll-mt-24 mb-24">
          <div className="flex items-center gap-4 mb-8">
             <div className="h-px bg-clay-300 flex-grow"></div>
             <h3 className="text-2xl font-serif text-clay-900 italic">匠人工坊</h3>
             <div className="h-px bg-clay-300 flex-grow"></div>
          </div>

          <div className="bg-white rounded-sm shadow-xl shadow-clay-200/50 border border-clay-100 p-8 md:p-12 relative overflow-hidden">
            {/* Background seal decoration */}
            <div className="absolute top-0 right-0 opacity-5 pointer-events-none transform translate-x-1/3 -translate-y-1/3">
              <svg width="400" height="400" viewBox="0 0 200 200" fill="currentColor" className="text-indigo-dye">
                 <circle cx="100" cy="100" r="90" />
              </svg>
            </div>

            {/* Step Guide */}
            <div className="flex items-center justify-center gap-2 mb-8 relative z-10">
              <div className={`flex items-center gap-2 ${(selectedStyle || uploadedStyle) ? 'text-indigo-dye' : 'text-clay-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${(selectedStyle || uploadedStyle) ? 'bg-indigo-dye text-white border-indigo-dye' : 'border-clay-300 text-clay-400'}`}>1</div>
                <span className="text-sm font-medium hidden sm:inline">选择纹饰</span>
              </div>
              <div className={`w-8 md:w-16 h-px transition-colors ${(selectedStyle || uploadedStyle) ? 'bg-indigo-dye' : 'bg-clay-200'}`}></div>
              <div className={`flex items-center gap-2 ${(selectedContent || uploadedContent) ? 'text-indigo-dye' : 'text-clay-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${(selectedContent || uploadedContent) ? 'bg-indigo-dye text-white border-indigo-dye' : 'border-clay-300 text-clay-400'}`}>2</div>
                <span className="text-sm font-medium hidden sm:inline">选择器型</span>
              </div>
              <div className={`w-8 md:w-16 h-px transition-colors ${canGenerate ? 'bg-indigo-dye' : 'bg-clay-200'}`}></div>
              <div className={`flex items-center gap-2 ${status === 'success' ? 'text-indigo-dye' : 'text-clay-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${status === 'success' ? 'bg-indigo-dye text-white border-indigo-dye' : 'border-clay-300 text-clay-400'}`}>3</div>
                <span className="text-sm font-medium hidden sm:inline">开始铸造</span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch relative z-10">
              
              {/* Left: Style */}
              <DropArea 
                title="纹饰来源" 
                subtitle="选择碎片或纹理..."
                type="fragment"
                isActive={true}
                selectedAsset={selectedStyle}
                uploadedImage={uploadedStyle}
                onClear={() => { setSelectedStyle(null); setUploadedStyle(null); }}
                onUpload={(f) => handleFileUpload(f, 'style')}
              />

              {/* Center: Action */}
              <div className="flex flex-col items-center justify-center gap-6 min-w-[100px]">
                 <div className="h-px w-full bg-clay-200 lg:hidden"></div>
                 
                 <div className="relative">
                   <button
                     onClick={handleGenerate}
                     disabled={!canGenerate}
                     className={`
                        group relative flex items-center justify-center w-20 h-20 rounded-full shadow-lg transition-all duration-500
                        ${canGenerate 
                          ? 'bg-indigo-dye text-white hover:scale-105 hover:shadow-indigo-dye/40' 
                          : 'bg-clay-100 text-clay-300 border border-clay-200 cursor-not-allowed'
                        }
                     `}
                   >
                      {status === 'processing' ? (
                        <ArrowPathIcon className="w-8 h-8 animate-spin" />
                      ) : (
                        <SparklesIcon className="w-8 h-8" />
                      )}
                      
                      {/* Ripple effect rings when ready */}
                      {canGenerate && status !== 'processing' && (
                        <span className="absolute -inset-1 rounded-full border border-indigo-dye/30 animate-ping"></span>
                      )}
                   </button>
                 </div>
                 
                 <span className={`text-xs font-bold uppercase tracking-[0.2em] transition-colors ${canGenerate ? 'text-indigo-dye' : 'text-clay-300'}`}>
                   {status === 'processing' ? '锻造中...' : '开始铸造'}
                 </span>

                 {/* Advanced Settings Toggle */}
                 <button
                   onClick={() => setShowAdvanced(!showAdvanced)}
                   className="flex items-center gap-1 text-[10px] text-clay-500 hover:text-indigo-dye transition-colors uppercase tracking-widest"
                 >
                   <AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />
                   高级设置
                   <ChevronDownIcon className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                 </button>

                 <div className="h-px w-full bg-clay-200 lg:hidden"></div>
              </div>

              {/* Right: Content */}
              <DropArea 
                title="器型载体" 
                subtitle="选择器皿形态..."
                type="vessel"
                isActive={!!(selectedStyle || uploadedStyle)}
                selectedAsset={selectedContent}
                uploadedImage={uploadedContent}
                onClear={() => { setSelectedContent(null); setUploadedContent(null); }}
                onUpload={(f) => handleFileUpload(f, 'content')}
              />
            </div>

            {/* Advanced Settings Panel */}
            {showAdvanced && (
              <div className="mt-8 pt-6 border-t border-clay-200 relative z-10 animate-fade-in">
                <h4 className="text-sm font-serif text-clay-900 italic mb-4 text-center">高级参数调节</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-clay-600 font-medium">风格强度</label>
                      <span className="text-xs text-indigo-dye font-mono font-bold">{ipAdapterWeight.toFixed(2)}</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={ipAdapterWeight}
                      onChange={(e) => setIpAdapterWeight(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-clay-200 rounded-full appearance-none cursor-pointer accent-indigo-dye"
                    />
                    <p className="text-[10px] text-clay-400">控制纹饰纹理的迁移程度</p>
                    {(ipAdapterWeight < 0.5 || ipAdapterWeight > 0.9) && (
                      <p className="text-[10px] text-amber-600 font-medium">⚠ 推荐范围 0.50–0.90，当前值可能导致效果不佳</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-clay-600 font-medium">形态控制</label>
                      <span className="text-xs text-indigo-dye font-mono font-bold">{controlNetWeight.toFixed(2)}</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={controlNetWeight}
                      onChange={(e) => setControlNetWeight(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-clay-200 rounded-full appearance-none cursor-pointer accent-indigo-dye"
                    />
                    <p className="text-[10px] text-clay-400">控制器物轮廓的保持力度</p>
                    {(controlNetWeight < 0.4 || controlNetWeight > 0.8) && (
                      <p className="text-[10px] text-amber-600 font-medium">⚠ 推荐范围 0.40–0.80，当前值可能导致效果不佳</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-clay-600 font-medium">创意自由度</label>
                      <span className="text-xs text-indigo-dye font-mono font-bold">{denoisingStrength.toFixed(2)}</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={denoisingStrength}
                      onChange={(e) => setDenoisingStrength(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-clay-200 rounded-full appearance-none cursor-pointer accent-indigo-dye"
                    />
                    <p className="text-[10px] text-clay-400">越高越自由发挥，越低越保守</p>
                    {(denoisingStrength < 0.5 || denoisingStrength > 0.85) && (
                      <p className="text-[10px] text-amber-600 font-medium">⚠ 推荐范围 0.50–0.85，当前值可能导致效果不佳</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Result Section */}
        {(status === 'success' || status === 'error' || status === 'processing') && (
          <section ref={resultRef} className="max-w-6xl mx-auto px-6 mb-24 animate-fade-in scroll-mt-24">
            <div className="bg-clay-900 text-white rounded-sm overflow-hidden shadow-2xl relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
              
              <div className="p-8 md:p-12 text-center relative z-10">
                <div className="inline-flex items-center gap-2 mb-6 opacity-70">
                   <div className="w-8 h-px bg-white"></div>
                   <span className="text-xs uppercase tracking-[0.3em]">成品预览</span>
                   <div className="w-8 h-px bg-white"></div>
                </div>

                <h3 className="text-3xl md:text-4xl font-serif mb-10 text-white">
                  {status === 'processing' ? '窑火重燃中...' : 
                   status === 'error' ? '烧制失败' : 
                   '新器物已成型'}
                </h3>

                <div className="flex justify-center min-h-[300px] items-center">
                  {status === 'processing' && (
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative">
                        <div className="w-20 h-20 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-mono font-bold">{elapsedTime}s</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm font-light tracking-widest animate-pulse">正在融合纹理...</p>
                        <p className="text-xs text-white/50">预计需要 30–60 秒，请耐心等待</p>
                        {/* Progress bar */}
                        <div className="w-48 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-white/40 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(95, (elapsedTime / 60) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="bg-red-900/30 border border-red-500/30 p-8 rounded-sm max-w-md">
                      <ExclamationCircleIcon className="w-10 h-10 text-red-400 mx-auto mb-4" />
                      <p className="text-red-200">{errorMessage}</p>
                    </div>
                  )}

                  {status === 'success' && resultImage && (
                    <div>
                    <div ref={posterRef} className="flex flex-col lg:flex-row items-center justify-center gap-12 w-full p-10 bg-[#1f2126] rounded-sm">
                      {/* Left: Generated Image */}
                      <div className="relative group perspective-1000 flex-1 flex justify-center">
                        <div className="bg-white p-2 shadow-2xl transform transition-transform duration-700 hover:rotate-y-12">
                          <img 
                            src={resultImage} 
                            alt="Generated Pottery" 
                            className="max-h-[500px] max-w-full object-contain"
                          />
                        </div>
                      </div>

                      {/* Right: Digital Business Card */}
                      <div className="flex-1 w-full max-w-md">
                        <div className="bg-white text-clay-900 p-8 rounded-sm shadow-2xl relative overflow-hidden text-left">
                          {/* Card Background Decoration */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-clay-100 rounded-bl-full -z-10 opacity-50"></div>
                          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-50 rounded-tr-full -z-10 opacity-50"></div>
                          
                          <div className="border-b border-clay-200 pb-4 mb-6">
                            <p className="text-xs text-indigo-dye font-bold tracking-[0.3em] uppercase mb-2">AI 典藏名片</p>
                            <h4 className="text-2xl font-serif text-clay-900">
                              {selectedStyle?.title || '未知纹理'} 
                              <span className="mx-2 text-clay-300">×</span> 
                              {selectedContent?.title || '未知器型'}
                            </h4>
                          </div>

                          <div className="space-y-4 mb-8">
                            <div>
                              <p className="text-xs text-clay-400 uppercase tracking-widest mb-1">纹饰溯源</p>
                              <p className="text-sm font-medium">{selectedStyle?.title || '自定义上传纹理'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-clay-400 uppercase tracking-widest mb-1">器物形态</p>
                              <p className="text-sm font-medium">{selectedContent?.title || '自定义上传器型'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-clay-400 uppercase tracking-widest mb-1">AI 鉴赏</p>
                              <p className="text-sm text-clay-600 font-light leading-relaxed italic">
                                "跨越时空的对话。古老的纹理在现代器型上重新绽放，展现出独特的东方美学与数字艺术的完美交融。"
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-6 border-t border-clay-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-indigo-dye text-white font-serif text-xs flex items-center justify-center rounded-sm">P</div>
                              <span className="text-xs font-bold tracking-widest text-clay-900">PorcelainAI</span>
                            </div>
                            {/* Placeholder QR Code */}
                            <div className="w-12 h-12 bg-clay-100 p-1 rounded-sm">
                              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`} alt="QR Code" className="w-full h-full opacity-80 mix-blend-multiply" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-center gap-4">
                      <a 
                        href={resultImage} 
                        download="porcelain-ai-result.png"
                        className="bg-white text-clay-900 px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:bg-clay-200 transition-colors flex items-center gap-2 tracking-wide"
                      >
                        下载作品
                      </a>
                      <button 
                        type="button"
                        className="bg-indigo-dye text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:bg-indigo-900 transition-colors flex items-center gap-2 tracking-wide"
                        onClick={handleExportPoster}
                        disabled={isExportingPoster}
                      >
                        {isExportingPoster ? '生成海报中...' : '一键生成海报'}
                      </button>
                    </div>

                    {posterError && (
                      <p className="text-xs text-red-300 text-center mt-3">{posterError}</p>
                    )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Gallery */}
        <div id="archive" className="max-w-7xl mx-auto px-6 mb-24 scroll-mt-24">
          <Gallery 
            onSelect={handleGallerySelect} 
            selectedIds={[selectedStyle?.id, selectedContent?.id].filter(Boolean) as string[]}
          />
        </div>

      </main>
      
      <footer className="bg-white border-t border-clay-200">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-clay-900 text-white font-serif flex items-center justify-center rounded-sm">P</div>
             <span className="font-serif text-lg text-clay-900">PorcelainAI</span>
          </div>
          <p className="text-clay-500 text-sm font-light">
            © {new Date().getFullYear()} PorcelainAI Project. <br className="md:hidden"/>
            将传统遗产与现代 AI 融合。
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;