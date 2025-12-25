import React, { useState, useRef, useEffect } from 'react';
import { Gallery } from './components/Gallery';
import { DropArea } from './components/DropArea';
import { ShowcaseCarousel } from './components/ShowcaseCarousel';
import { ImageAsset, GenerationStatus } from './types';
import { generateStyledPottery, urlToBase64 } from './services/styleTransferService';
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

function App() {
  // State for selections
  const [selectedStyle, setSelectedStyle] = useState<ImageAsset | null>(null);
  const [uploadedStyle, setUploadedStyle] = useState<string | null>(null);
  
  const [selectedContent, setSelectedContent] = useState<ImageAsset | null>(null);
  const [uploadedContent, setUploadedContent] = useState<string | null>(null);

  // State for generation
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);
  const workbenchRef = useRef<HTMLDivElement>(null);

  // Helper to handle file uploads
  const handleFileUpload = (file: File, type: 'style' | 'content') => {
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
        styleBase64 = await urlToBase64(selectedStyle.url);
      }

      let contentBase64 = '';
      if (uploadedContent) {
        contentBase64 = uploadedContent.split(',')[1];
      } else if (selectedContent) {
        contentBase64 = await urlToBase64(selectedContent.url);
      }

      // 2. Call Service
      const generatedImage = await generateStyledPottery(styleBase64, contentBase64);
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

  const canGenerate = (uploadedStyle || selectedStyle) && (uploadedContent || selectedContent) && status !== 'processing';

  return (
    <div className="min-h-screen pb-20 relative">
      
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
          </div>
        </div>

        {/* Result Section */}
        {(status === 'success' || status === 'error' || status === 'processing') && (
          <section ref={resultRef} className="max-w-5xl mx-auto px-6 mb-24 animate-fade-in scroll-mt-24">
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
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <p className="text-sm font-light tracking-widest animate-pulse">正在融合纹理...</p>
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="bg-red-900/30 border border-red-500/30 p-8 rounded-sm max-w-md">
                      <ExclamationCircleIcon className="w-10 h-10 text-red-400 mx-auto mb-4" />
                      <p className="text-red-200">{errorMessage}</p>
                    </div>
                  )}

                  {status === 'success' && resultImage && (
                    <div className="relative group perspective-1000">
                      <div className="bg-white p-2 shadow-2xl transform transition-transform duration-700 hover:rotate-y-12">
                        <img 
                          src={resultImage} 
                          alt="Generated Pottery" 
                          className="max-h-[600px] max-w-full object-contain"
                        />
                      </div>
                      
                      <div className="mt-8 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <a 
                          href={resultImage} 
                          download="porcelain-ai-result.png"
                          className="bg-white text-clay-900 px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:bg-clay-200 transition-colors flex items-center gap-2 tracking-wide"
                        >
                          下载作品
                        </a>
                      </div>
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