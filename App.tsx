import React, { useState, useRef, useEffect } from 'react';
import { Gallery } from './components/Gallery';
import { DropArea } from './components/DropArea';
import { ShowcaseCarousel } from './components/ShowcaseCarousel';
import { DeleteVesselResponse, ImageAsset, GenerationStatus } from './types';
import { generateStyledPottery, urlToBase64, checkHealth, getServerStatus } from './services/styleTransferService';
import { analyzeImage } from './services/chatService';
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { ExclamationCircleIcon, AdjustmentsHorizontalIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import html2canvas from 'html2canvas';

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
  const [isExportingPoster, setIsExportingPoster] = useState(false);
  const [posterError, setPosterError] = useState<string | null>(null);

  // AI 鉴赏状态
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);

  // Advanced generation params
  const [ipAdapterWeight, setIpAdapterWeight] = useState(0.8946812847064639);
  const [controlNetWeight, setControlNetWeight] = useState(0.9618186968889493);
  const [denoisingStrength, setDenoisingStrength] = useState(0.6861563693185955);
  const [guidanceScale, setGuidanceScale] = useState(7.01249745012551);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasWarnedAdvanced, setHasWarnedAdvanced] = useState(false); // 是否已警告过参数修改
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 服务器状态
  const [serverOnline, setServerOnline] = useState<boolean | null>(null); // null=未知, true=在线, false=离线
  const [modelsReady, setModelsReady] = useState(false);
  const [serverStatusMsg, setServerStatusMsg] = useState<string | null>(null);
  const [deletedVesselIds, setDeletedVesselIds] = useState<string[]>([]);

  const resultRef = useRef<HTMLDivElement>(null);
  const workbenchRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  // File validation constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  // 去除文件名中的数字前缀，例如 "1071742_白瓷罐" → "白瓷罐"
  const cleanTitle = (title: string | undefined, fallback: string) =>
    title ? title.replace(/^\d+_/, '') : fallback;

  // Helper to handle file uploads
  // Helpers for advanced params change
  const handleParamChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
    setter(value);
    if (!hasWarnedAdvanced) {
      alert("⚠️ 提示\n\n当前的默认参数（如风格强度、形态控制等）是我们使用 Optuna 优化在测试集上搜索出的最佳固定参数。\n\n改动这些参数大体会导致最终生成效果变差，请谨慎调节！");
      setHasWarnedAdvanced(true);
    }
  };

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
  };
  const handleDeleteVessels = async (assets: ImageAsset[]) => {
    const ids = assets.map((asset) => asset.id);
    const response = await fetch('/api/delete-vessel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    const payload = await response.json() as DeleteVesselResponse;

    if (!response.ok || !payload.success) {
      throw new Error(payload.message || '删除器皿失败');
    }

    setDeletedVesselIds((current) => {
      const next = new Set(current);
      ids.forEach((id) => next.add(id));
      return Array.from(next);
    });

    if (selectedContent?.id && ids.includes(selectedContent.id)) {
      setSelectedContent(null);
    }
  };

  // Main Generation Logic
  const handleGenerate = async () => {
    const styleSource = uploadedStyle || selectedStyle?.url;
    const contentSource = uploadedContent || selectedContent?.url;

    if (!styleSource || !contentSource) return;

    // 检查服务器状态
    if (serverOnline === false) {
      setStatus('error');
      setErrorMessage('推理服务器未启动，请先运行: python -m pipeline.server');
      return;
    }
    if (serverOnline && !modelsReady) {
      setStatus('error');
      setErrorMessage('模型尚未加载完成，请等待服务就绪后再试');
      return;
    }

    setStatus('processing');
    setErrorMessage(null);
    setResultImage(null);
    setAiAnalysis(null);
    setAiAnalysisError(null);

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
      const generatedImage = await generateStyledPottery(
        styleBase64,
        contentBase64,
        ipAdapterWeight,
        controlNetWeight,
        denoisingStrength,
        guidanceScale
      );
      setResultImage(generatedImage);
      setStatus('success');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message || "生成图片失败，请重试。");
    }
  };



  // 启动时检测服务器状态；空闲时低频轮询，生成中暂停轮询，避免打断主推理任务
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const alive = await checkHealth();
        if (cancelled) return;
        setServerOnline(alive);
        if (alive) {
          const st = await getServerStatus();
          if (cancelled) return;
          setModelsReady(st.models_ready);
          if (st.loading) {
            setServerStatusMsg('模型正在加载中...');
          } else if (st.error) {
            setServerStatusMsg(`模型加载失败: ${st.error}`);
          } else if (st.models_ready) {
            setServerStatusMsg(null);
          }
        } else {
          setModelsReady(false);
          setServerStatusMsg('推理服务器未启动');
        }
      } catch {
        if (cancelled) return;
        setServerOnline(false);
        setModelsReady(false);
        setServerStatusMsg('推理服务器未启动');
      }
    };

    poll();

    if (status === 'processing') {
      return () => { cancelled = true; };
    }

    const timer = setInterval(poll, 60000);
    return () => { cancelled = true; clearInterval(timer); };
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
      link.download = `pottery-ai-poster-${Date.now()}.png`;
      link.click();
    } catch (error) {
      console.error(error);
      setPosterError('海报生成失败，请稍后重试。');
    } finally {
      setIsExportingPoster(false);
    }
  };

  const canGenerate = (uploadedStyle || selectedStyle) && (uploadedContent || selectedContent) && status !== 'processing';

  // AI 鉴赏调用
  const handleAiAnalysis = async () => {
    if (!resultImage || aiAnalysisLoading) return;
    setAiAnalysisLoading(true);
    setAiAnalysisError(null);
    setAiAnalysis(null);
    try {
      // 从 resultImage 提取 base64
      let base64Data = '';
      if (resultImage.startsWith('data:')) {
        base64Data = resultImage.split(',')[1];
      } else {
        // 如果是 URL (如 /images/xxx.png)，先转换
        const dataUrl = await urlToBase64(resultImage);
        base64Data = dataUrl.split(',')[1];
      }

      // 获取风格图的 base64
      let styleBase64 = '';
      if (uploadedStyle) {
        styleBase64 = uploadedStyle.split(',')[1];
      } else if (selectedStyle) {
        styleBase64 = (await urlToBase64(selectedStyle.url)).split(',')[1];
      }

      // 获取内容图的 base64
      let contentBase64 = '';
      if (uploadedContent) {
        contentBase64 = uploadedContent.split(',')[1];
      } else if (selectedContent) {
        contentBase64 = (await urlToBase64(selectedContent.url)).split(',')[1];
      }
      const styleReferenceName = cleanTitle(selectedStyle?.title, '??????');
      const vesselReferenceName = cleanTitle(selectedContent?.title, '??????');

      const response = await analyzeImage(
        base64Data,
        styleBase64,
        contentBase64,
        styleReferenceName,
        vesselReferenceName,
        `??????????????????????????${vesselReferenceName}?????????????${styleReferenceName}??????????????????????????????????????1???2???3?????????????????????????????????????????????????????????????????????????????????`
      );
      setAiAnalysis(response);
    } catch (err: any) {
      console.error('AI Analysis Error:', err);
      setAiAnalysisError(err.message || 'AI 鉴赏请求失败');
    } finally {
      setAiAnalysisLoading(false);
    }
  };

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
              <h1 className="text-2xl font-serif text-clay-900 tracking-wide leading-none">Pottery<span className="text-indigo-dye">AI</span></h1>
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

                 {/* 服务器状态提示 */}
                 {serverOnline === false && (
                   <span className="text-[10px] text-red-500 text-center leading-tight">⚠ 推理服务器离线</span>
                 )}
                 {serverOnline && !modelsReady && serverStatusMsg && (
                   <span className="text-[10px] text-amber-500 text-center leading-tight animate-pulse">{serverStatusMsg}</span>
                 )}
                 {serverOnline && modelsReady && (
                   <span className="text-[10px] text-emerald-500 text-center">● 服务就绪</span>
                 )}

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
                <div className="text-center mb-6 text-xs text-amber-600 bg-amber-50 p-2 rounded-md max-w-lg mx-auto border border-amber-200">
                  ⚠️ 提示: 当前默认值为程序已调优的最佳参数组合，非必要请勿修改，否则可能显著降低生成效果。
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-clay-600 font-medium">重绘强度 (Strength)</label>
                      <span className="text-xs text-indigo-dye font-mono font-bold">{denoisingStrength.toFixed(2)}</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.01"
                      value={denoisingStrength}
                      onChange={(e) => handleParamChange(setDenoisingStrength, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-clay-200 rounded-full appearance-none cursor-pointer accent-indigo-dye"
                    />
                    <p className="text-[10px] text-clay-400">越高越高自由度，越低越保守</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-clay-600 font-medium">轮廓控制 (ControlNet)</label>
                      <span className="text-xs text-indigo-dye font-mono font-bold">{controlNetWeight.toFixed(2)}</span>
                    </div>
                    <input
                      type="range" min="0.5" max="2.0" step="0.01"
                      value={controlNetWeight}
                      onChange={(e) => handleParamChange(setControlNetWeight, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-clay-200 rounded-full appearance-none cursor-pointer accent-indigo-dye"
                    />
                    <p className="text-[10px] text-clay-400">控制器物边缘轮廓的保持力度</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-clay-600 font-medium">风格注入 (IP-Adapter)</label>
                      <span className="text-xs text-indigo-dye font-mono font-bold">{ipAdapterWeight.toFixed(2)}</span>
                    </div>
                    <input
                      type="range" min="0" max="1.5" step="0.01"
                      value={ipAdapterWeight}
                      onChange={(e) => handleParamChange(setIpAdapterWeight, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-clay-200 rounded-full appearance-none cursor-pointer accent-indigo-dye"
                    />
                    <p className="text-[10px] text-clay-400">控制纹饰色彩风格的迁移程度</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-clay-600 font-medium">生成引导 (Guidance)</label>
                      <span className="text-xs text-indigo-dye font-mono font-bold">{guidanceScale.toFixed(2)}</span>
                    </div>
                    <input
                      type="range" min="1" max="15" step="0.1"
                      value={guidanceScale}
                      onChange={(e) => handleParamChange(setGuidanceScale, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-clay-200 rounded-full appearance-none cursor-pointer accent-indigo-dye"
                    />
                    <p className="text-[10px] text-clay-400">提示词和参考元素的引导强度</p>
                  </div>

                  <div className="flex items-center justify-center">
                    <button 
                      onClick={() => {
                        setIpAdapterWeight(0.8581559237688047);
                        setControlNetWeight(0.8599484410364789);
                        setDenoisingStrength(0.6519547299322923);
                        setGuidanceScale(7.217972272548148);
                      }}
                      className="text-xs py-2 px-4 rounded-md border border-clay-300 text-clay-600 hover:bg-clay-100 transition-colors"
                    >
                      恢复最佳预设
                    </button>
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
                              {cleanTitle(selectedStyle?.title, '未知纹理')}
                              <span className="mx-2 text-clay-300">×</span>
                              {cleanTitle(selectedContent?.title, '未知器型')}
                            </h4>
                          </div>

                          <div className="space-y-4 mb-8">
                            <div>
                              <p className="text-xs text-clay-400 uppercase tracking-widest mb-1">纹饰溯源</p>
                              <p className="text-sm font-medium">{cleanTitle(selectedStyle?.title, '自定义上传纹理')}</p>
                            </div>
                            <div>
                              <p className="text-xs text-clay-400 uppercase tracking-widest mb-1">器物形态</p>
                              <p className="text-sm font-medium">{cleanTitle(selectedContent?.title, '自定义上传器型')}</p>
                            </div>
                            {/* AI 鉴赏内容直接嵌入名片，与其他字段字体保持一致 */}
                            {(aiAnalysis || aiAnalysisLoading || aiAnalysisError) && (
                              <div>
                                <p className="text-xs text-clay-400 uppercase tracking-widest mb-2">AI 鉴赏</p>
                                {aiAnalysisLoading && (
                                  <div className="flex items-center gap-2 py-1">
                                    <ArrowPathIcon className="w-4 h-4 animate-spin text-indigo-dye" />
                                    <p className="text-sm text-clay-500 italic">Qwen3-VL 正在撰写展览名片...</p>
                                  </div>
                                )}
                                {aiAnalysisError && (
                                  <p className="text-sm text-red-500 italic">❌ {aiAnalysisError}</p>
                                )}
                                {aiAnalysis && (
                                  <div className="text-sm text-clay-700 leading-relaxed space-y-3">
                                    {aiAnalysis
                                      .split(/\n+/)
                                      .map((line, i) => {
                                        const isHeader = /^【.+】$/.test(line.trim());
                                        if (!line.trim()) return null;
                                        return isHeader ? (
                                          <p key={i} className="font-bold text-indigo-dye tracking-wide mt-3 first:mt-0">{line.trim()}</p>
                                        ) : (
                                          <p key={i} className="font-light indent-4">{line.trim()}</p>
                                        );
                                      })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="border-t border-clay-100" />

                          <div className="flex items-center justify-center py-3">
                            {/* 重新鉴赏 / AI 鉴赏按钮，两线之间水平垂直居中 */}
                            <button
                              onClick={handleAiAnalysis}
                              disabled={aiAnalysisLoading}
                              className="flex items-center gap-2 text-xs text-indigo-dye hover:text-indigo-900 font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                            >
                              {aiAnalysisLoading ? (
                                <><ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />分析中...</>
                              ) : aiAnalysis ? (
                                <><ArrowPathIcon className="w-3.5 h-3.5" />重新鉴赏</>
                              ) : (
                                <>🔍 AI 鉴赏</>
                              )}
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-clay-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-indigo-dye text-white font-serif text-xs flex items-center justify-center rounded-sm">P</div>
                              <span className="text-xs font-bold tracking-widest text-clay-900">PotteryAI</span>
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
                        download="pottery-ai-result.png"
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
            onDeleteVessels={handleDeleteVessels}
            hiddenAssetIds={deletedVesselIds}
          />
        </div>

      </main>
      
      <footer className="bg-white border-t border-clay-200">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-clay-900 text-white font-serif flex items-center justify-center rounded-sm">P</div>
             <span className="font-serif text-lg text-clay-900">PotteryAI</span>
          </div>
          <p className="text-clay-500 text-sm font-light">
            © {new Date().getFullYear()} PotteryAI Project. <br className="md:hidden"/>
            将传统遗产与现代 AI 融合。
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
