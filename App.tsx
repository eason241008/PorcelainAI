import React, { useState, useRef, useEffect } from 'react';
import { Gallery } from './components/Gallery';
import { DropArea } from './components/DropArea';
import { ShowcaseCarousel } from './components/ShowcaseCarousel';
import { ImageAsset, GenerationStatus } from './types';
import { generateInteractive, resetTuner, urlToBase64, GenerationCandidate, InteractiveResponse, analyzeArtifact, AnalysisResult } from './services/styleTransferService';
import { SparklesIcon, ArrowPathIcon, XMarkIcon, CheckCircleIcon, FireIcon } from '@heroicons/react/24/solid';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { MuseumCard } from './components/MuseumCard';

function App() {
  // --- 资源选择状态 ---
  const [selectedStyle, setSelectedStyle] = useState<ImageAsset | null>(null);
  const [uploadedStyle, setUploadedStyle] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<ImageAsset | null>(null);
  const [uploadedContent, setUploadedContent] = useState<string | null>(null);

  // --- 交互式生成状态 ---
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [candidates, setCandidates] = useState<GenerationCandidate[]>([]);
  const [tunerState, setTunerState] = useState<{ sigma: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [iterationCount, setIterationCount] = useState(0); // 记录迭代轮数

  // --- VLM 分析状态 ---
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentBestImage, setCurrentBestImage] = useState<string | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);
  const workbenchRef = useRef<HTMLDivElement>(null);

  // --- 文件与画廊处理 ---
  const handleFileUpload = (file: File, type: 'style' | 'content') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'style') { setUploadedStyle(result); setSelectedStyle(null); } 
      else { setUploadedContent(result); setSelectedContent(null); }
      workbenchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    reader.readAsDataURL(file);
  };

  const handleGallerySelect = (asset: ImageAsset) => {
    if (asset.type === 'fragment') { setSelectedStyle(asset); setUploadedStyle(null); } 
    else { setSelectedContent(asset); setUploadedContent(null); }
    workbenchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // --- 获取当前的 Base64 图像源 ---
  const getImagesBase64 = async () => {
    let styleBase64 = uploadedStyle ? uploadedStyle : selectedStyle ? await urlToBase64(selectedStyle.url) : '';
    let contentBase64 = uploadedContent ? uploadedContent : selectedContent ? await urlToBase64(selectedContent.url) : '';
    // 确保包含 data 前缀 (backend split logic compatibility)
    if (styleBase64 && !styleBase64.startsWith('data:')) styleBase64 = `data:image/png;base64,${styleBase64}`;
    if (contentBase64 && !contentBase64.startsWith('data:')) contentBase64 = `data:image/png;base64,${contentBase64}`;
    return { styleBase64, contentBase64 };
  };

  // --- 核心逻辑 1: 开始新的生成会话 (Cold Start) ---
  const handleStartSession = async () => {
    if (!uploadedStyle && !selectedStyle) return;
    if (!uploadedContent && !selectedContent) return;

    setStatus('processing');
    setErrorMessage(null);
    setCandidates([]);
    setIterationCount(1);
    setCurrentBestImage(null);
    setAnalysisData(null);

    try {
      // 1. 重置后端 Tuner 状态
      await resetTuner();

      // 2. 准备图片
      const { styleBase64, contentBase64 } = await getImagesBase64();

      // 3. 发起初始请求 (无 action)
      const data = await generateInteractive(styleBase64, contentBase64);
      
      setCandidates(data.results);
      setTunerState(data.tuner_state);
      setStatus('success');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message || "初始化失败，请检查服务连接。");
    }
  };

  // --- 核心逻辑 2: 用户交互反馈 (Loop) ---
  const handleFeedback = async (action: 'select' | 'reject', candidate?: GenerationCandidate) => {
    // 如果选中了，触发 VLM 分析
    if (action === 'select' && candidate) {
        setCurrentBestImage(candidate.image);
        setIsAnalyzing(true);
        // 不重置 analysisData，让之前的卡片保持显示直到新的出来？或者重置以显示 loading
        // 最好是显示 loading 状态
        
        const styleDesc = selectedStyle?.description || "未知纹饰";
        const contentDesc = selectedContent?.description || "未知器型";

        // 不 await，后台执行
        analyzeArtifact(candidate.image, styleDesc, contentDesc)
          .then(data => setAnalysisData(data))
          .catch(err => console.error("Analysis failed", err))
          .finally(() => setIsAnalyzing(false));
    }

    setStatus('processing');
    try {
      const { styleBase64, contentBase64 } = await getImagesBase64();
      
      // 发送反馈并获取下一批
      const data = await generateInteractive(
        styleBase64, 
        contentBase64, 
        action, 
        candidate?.params // 如果是 select，必须传参
      );

      setCandidates(data.results);
      setTunerState(data.tuner_state);
      setIterationCount(prev => prev + 1);
      
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message);
    }
  };

  // 自动滚动到结果区
  useEffect(() => {
    if (status === 'success' && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [status, iterationCount]);

  const canGenerate = (uploadedStyle || selectedStyle) && (uploadedContent || selectedContent) && status !== 'processing';

  // --- UI 组件：计算收敛进度 ---
  // 假设初始 sigma 约 0.25，最小 0.05。计算一个百分比用于展示
  const convergenceProgress = tunerState 
    ? Math.min(100, Math.max(0, (0.25 - tunerState.sigma) / (0.25 - 0.05) * 100)) 
    : 0;

  return (
    <div className="min-h-screen pb-20 relative font-sans text-clay-900 bg-stone-50">
      
      {/* Decorative Top Border */}
      <div className="h-1 w-full bg-gradient-to-r from-clay-200 via-indigo-dye to-clay-200 sticky top-0 z-[60]"></div>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-clay-200 sticky top-1 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <div className="w-10 h-10 bg-indigo-dye text-white font-serif text-xl flex items-center justify-center rounded-sm shadow-md">P</div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-serif tracking-wide leading-none">Porcelain<span className="text-indigo-dye">AI</span></h1>
              <span className="text-[10px] uppercase tracking-[0.2em] text-clay-500 mt-1">交互式修复工坊</span>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="text-sm font-medium text-clay-500 hover:text-indigo-dye transition-colors"
          >
            重置系统
          </button>
        </div>
      </header>

      <main className="w-full">
        
        {/* Intro Section */}
        <section className="relative pt-16 pb-12 text-center max-w-4xl mx-auto px-6">
          <h2 className="text-5xl md:text-6xl font-serif text-clay-900 leading-[1.1] mb-6">
            人机共创 <br/>
            <span className="italic text-indigo-dye">极致修复</span>
          </h2>
          <p className="text-lg text-clay-600 font-light max-w-2xl mx-auto">
            不仅是生成，更是进化。像老匠人一样，通过不断的“观察-选择-打磨”，
            教 AI 找到你心中最完美的形态。
          </p>
        </section>

        {/* Workbench Input Area */}
        <div id="workbench" ref={workbenchRef} className="max-w-7xl mx-auto px-6 mb-12">
          <div className="bg-white rounded-xl shadow-xl shadow-clay-200/50 border border-clay-100 p-8 md:p-10 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch relative z-10">
              
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

              {/* Start Button */}
              <div className="flex flex-col items-center justify-center gap-4 min-w-[120px]">
                 <div className="relative">
                   <button
                     onClick={handleStartSession}
                     disabled={!canGenerate}
                     className={`
                        group relative flex items-center justify-center w-24 h-24 rounded-full shadow-2xl transition-all duration-500
                        ${canGenerate 
                          ? 'bg-gradient-to-br from-indigo-dye to-blue-900 text-white hover:scale-105' 
                          : 'bg-clay-100 text-clay-300 cursor-not-allowed'
                        }
                     `}
                   >
                      {status === 'processing' && candidates.length === 0 ? (
                        <ArrowPathIcon className="w-10 h-10 animate-spin" />
                      ) : (
                        <FireIcon className="w-10 h-10" />
                      )}
                   </button>
                 </div>
                 <span className="text-xs font-bold uppercase tracking-widest text-clay-400">
                   {status === 'processing' && candidates.length === 0 ? '启动中...' : '开始铸造'}
                 </span>
              </div>

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

        {/* 交互式结果区域 (Interactive Loop) */}
        {(status === 'success' || (status === 'processing' && candidates.length > 0)) && (
          <section ref={resultRef} className="max-w-7xl mx-auto px-6 mb-32 animate-fade-in scroll-mt-24">
            
            {/* VLM 分析卡片展示 (Current Best) */}
            {currentBestImage && (
              <div className="mb-16 animate-fade-in">
                 <div className="flex items-center gap-4 mb-8 justify-center">
                    <div className="h-px bg-indigo-dye/20 w-24"></div>
                    <h3 className="text-xl font-serif text-indigo-dye tracking-widest">当前甄选 · 藏品鉴赏</h3>
                    <div className="h-px bg-indigo-dye/20 w-24"></div>
                 </div>

                 <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-center justify-center bg-white p-8 lg:p-12 rounded-sm shadow-xl border border-clay-100 relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-dye/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    {/* Image */}
                    <div className="w-full md:w-5/12 aspect-square relative group">
                       <div className="absolute inset-2 border border-clay-200 rounded-sm pointer-events-none z-10"></div>
                       <img 
                          src={currentBestImage} 
                          className="w-full h-full object-contain mix-blend-multiply p-4 bg-clay-50/50" 
                          alt="Selected Masterpiece" 
                       />
                       <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 text-xs text-indigo-dye font-serif shadow-sm">
                          AI 修复 · 馆藏级
                       </div>
                    </div>

                    {/* Card */}
                    <div className="w-full md:w-5/12 flex justify-center">
                       <MuseumCard 
                          title={analysisData?.title || "正在鉴定..."}
                          description={analysisData?.description || "博物馆专家正在仔细端详这件器物，请稍候..."}
                          tags={analysisData?.tags || []}
                          isLoading={isAnalyzing}
                       />
                    </div>
                 </div>
              </div>
            )}

            {/* 顶部状态条 */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-serif text-clay-900">第 {iterationCount} 次试烧</h3>
                <p className="text-sm text-clay-500 mt-1">请从下方选择更接近你想法的作品，AI 将基于此继续优化。</p>
              </div>
              
              {/* 收敛进度条 */}
              <div className="hidden md:block w-64">
                <div className="flex justify-between text-xs text-clay-500 mb-2 uppercase tracking-wider">
                  <span>探索阶段</span>
                  <span>精细打磨</span>
                </div>
                <div className="h-2 bg-clay-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-dye transition-all duration-1000 ease-out" 
                    style={{ width: `${convergenceProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Loading Overlay when refining */}
            <div className="relative">
              {status === 'processing' && (
                <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
                  <div className="bg-white p-6 rounded-2xl shadow-2xl flex items-center gap-4 border border-clay-100">
                    <div className="w-8 h-8 border-4 border-indigo-dye border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-serif text-lg text-clay-800">匠心微调中...</span>
                  </div>
                </div>
              )}

              {/* 候选图对比展示 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                {candidates.map((candidate, idx) => (
                  <div key={idx} className="group relative flex flex-col items-center">
                    
                    {/* Image Card */}
                    <div 
                      onClick={() => handleFeedback('select', candidate)}
                      className="relative w-full aspect-square bg-white p-4 shadow-xl rounded-sm border border-clay-100 cursor-pointer 
                                 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-indigo-dye/30"
                    >
                      <div className="w-full h-full flex items-center justify-center overflow-hidden bg-clay-50">
                        <img 
                          src={candidate.image} 
                          alt={`Option ${idx + 1}`} 
                          className="max-h-full max-w-full object-contain mix-blend-multiply"
                        />
                      </div>
                      
                      {/* Hover Overlay "Pick Me" */}
                      <div className="absolute inset-0 bg-indigo-dye/0 group-hover:bg-indigo-dye/5 transition-colors flex items-center justify-center">
                         <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-indigo-dye px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2">
                           <CheckCircleIcon className="w-5 h-5" />
                           选择此方案
                         </div>
                      </div>
                    </div>

                    {/* Debug Params (Optional visibility) */}
                    <div className="mt-4 text-center opacity-40 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs font-mono text-clay-500">{candidate.debug_info}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 底部控制栏 */}
            <div className="mt-16 flex justify-center items-center relative">
               <div className="h-px bg-clay-200 w-full absolute top-1/2 -z-10"></div>
               
               <button
                 onClick={() => handleFeedback('reject')}
                 className="bg-white border border-clay-300 text-clay-600 px-8 py-3 rounded-full shadow-md hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center gap-2 font-medium z-10"
               >
                 <XMarkIcon className="w-5 h-5" />
                 都不满意，换一批思路
               </button>
            </div>
          </section>
        )}

        {/* Error State */}
        {status === 'error' && (
           <div className="max-w-2xl mx-auto px-6 mb-12">
             <div className="bg-red-50 border border-red-200 p-6 rounded-lg flex items-center gap-4 text-red-700">
                <ExclamationCircleIcon className="w-8 h-8 flex-shrink-0" />
                <p>{errorMessage}</p>
             </div>
           </div>
        )}

        {/* Gallery */}
        <div id="archive" className="max-w-7xl mx-auto px-6 mb-24 mt-24">
          <div className="flex items-center gap-4 mb-8">
             <div className="h-px bg-clay-300 flex-grow"></div>
             <h3 className="text-2xl font-serif text-clay-900 italic">素材典藏</h3>
             <div className="h-px bg-clay-300 flex-grow"></div>
          </div>
          <Gallery 
            onSelect={handleGallerySelect} 
            selectedIds={[selectedStyle?.id, selectedContent?.id].filter(Boolean) as string[]}
          />
        </div>

      </main>
    </div>
  );
}

export default App;