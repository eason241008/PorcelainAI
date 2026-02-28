const fs = require('fs');
const path = './App.tsx';
let content = fs.readFileSync(path, 'utf8');

const startMarker = '  return (';
const endMarker = 'export default App;';

const startIndex = content.indexOf(startMarker);
const endIndex = content.lastIndexOf(endMarker) + endMarker.length;

const newReturn = `  return (
    <div className="flex h-screen overflow-hidden bg-[#F9F8F6] text-clay-900 font-sans">
      
      {/* Left Panel - The Pedestal (Fixed) */}
      <div className="w-[45%] h-full relative bg-gradient-to-br from-[#EAE5D9] to-[#DFD8C8] flex flex-col items-center justify-center p-12 overflow-hidden shadow-2xl z-10">
        {/* Decorative Background */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/20 rounded-full mix-blend-overlay filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-dye/10 rounded-full mix-blend-overlay filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        
        {/* Content based on status */}
        {status === 'idle' && (
          <div className="relative w-full max-w-md aspect-square flex items-center justify-center animate-fade-in-up">
            {/* Overlapping images */}
            {selectedStyle || uploadedStyle ? (
              <img src={uploadedStyle || selectedStyle?.url} className="absolute w-48 h-48 object-cover rounded-sm shadow-2xl transform -rotate-6 -translate-x-16 z-20 border-4 border-white transition-all duration-700 hover:scale-105 hover:z-30" />
            ) : (
              <div className="absolute w-48 h-48 bg-white/40 backdrop-blur-sm rounded-sm shadow-lg transform -rotate-6 -translate-x-16 z-20 border border-white/60 flex items-center justify-center text-clay-500 font-serif italic text-xl">寻魂</div>
            )}
            
            {selectedContent || uploadedContent ? (
              <img src={uploadedContent || selectedContent?.url} className="absolute w-56 h-56 object-cover rounded-sm shadow-2xl transform rotate-3 translate-x-12 translate-y-8 z-10 border-4 border-white transition-all duration-700 hover:scale-105 hover:z-30" />
            ) : (
              <div className="absolute w-56 h-56 bg-white/40 backdrop-blur-sm rounded-sm shadow-lg transform rotate-3 translate-x-12 translate-y-8 z-10 border border-white/60 flex items-center justify-center text-clay-500 font-serif italic text-xl">塑骨</div>
            )}

            <div className="absolute -bottom-16 text-center w-full">
              <p className="text-clay-600 font-serif italic tracking-widest">等待注入灵魂...</p>
            </div>
          </div>
        )}

        {status === 'processing' && (
          <div className="flex flex-col items-center justify-center z-20 animate-fade-in-up">
            <div className="relative w-40 h-40">
              <div className="absolute inset-0 border-4 border-indigo-dye/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-dye rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-6 border-4 border-clay-400/20 rounded-full"></div>
              <div className="absolute inset-6 border-4 border-clay-400 rounded-full border-b-transparent animate-spin animation-delay-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-dye animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
            <p className="mt-10 font-serif text-2xl text-indigo-dye animate-pulse tracking-widest">窑火正旺，静候佳作...</p>
          </div>
        )}

        {status === 'success' && resultImage && (
          <div className="w-full max-w-lg flex flex-col items-center z-20 animate-fade-in-up">
            <div className="relative p-4 bg-white shadow-2xl rounded-sm group">
              <img src={resultImage} alt="Generated" className="w-full h-auto object-contain max-h-[50vh] transition-transform duration-700 group-hover:scale-[1.02]" />
              <div className="absolute -bottom-4 -right-4 bg-indigo-dye text-white text-xs px-4 py-2 font-serif tracking-widest shadow-lg">
                PorcelainAI 铸造
              </div>
            </div>
            
            {/* Digital Business Card */}
            <div className="mt-16 w-full bg-white/80 backdrop-blur-md p-6 rounded-sm shadow-lg border border-white/60 flex items-center gap-6 transform transition-all hover:-translate-y-1 hover:shadow-xl">
               {/* QR Code placeholder */}
               <div className="w-24 h-24 bg-clay-50 p-2 rounded-sm border border-clay-200 flex-shrink-0">
                 <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PorcelainAI_Masterpiece\`} alt="QR" className="w-full h-full opacity-80" />
               </div>
               <div className="flex-grow">
                 <h4 className="font-serif text-xl text-clay-900 mb-1">数字藏品证书</h4>
                 <p className="text-xs text-clay-500 mb-3 leading-relaxed">扫描二维码，在 AR 中查看您的专属瓷器，或分享至社交网络。</p>
                 <div className="flex flex-wrap gap-2">
                   <span className="text-[10px] bg-clay-100 px-2 py-1 rounded-sm text-clay-600 border border-clay-200">IP-Adapter: {ipAdapterWeight}</span>
                   <span className="text-[10px] bg-clay-100 px-2 py-1 rounded-sm text-clay-600 border border-clay-200">ControlNet: {controlNetWeight}</span>
                   <span className="text-[10px] bg-clay-100 px-2 py-1 rounded-sm text-clay-600 border border-clay-200">Denoising: {denoisingStrength}</span>
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - The Workshop (Scrollable) */}
      <div className="w-[55%] h-full overflow-y-auto bg-[#F9F8F6] relative custom-scrollbar">
        <div className="max-w-4xl mx-auto p-12 lg:p-20 pb-32">
          
          {/* Header */}
          <header className="mb-20 animate-fade-in-up">
            <h1 className="text-5xl font-serif text-clay-900 tracking-wide mb-4">Porcelain<span className="text-indigo-dye">AI</span></h1>
            <p className="text-sm text-clay-500 tracking-[0.3em] uppercase">以想象力重塑历史</p>
          </header>

          {/* Step 1 & 2: Drop Areas */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 mb-20 animate-fade-in-up animation-delay-200">
            <div className="h-[450px]">
              <DropArea 
                title="一 · 寻魂" 
                subtitle="选择碎片或纹理"
                type="fragment"
                isActive={true}
                selectedAsset={selectedStyle}
                uploadedImage={uploadedStyle}
                onClear={() => { setSelectedStyle(null); setUploadedStyle(null); setStatus('idle'); }}
                onUpload={(f) => { handleFileUpload(f, 'style'); setStatus('idle'); }}
              />
            </div>
            <div className="h-[450px]">
              <DropArea 
                title="二 · 塑骨" 
                subtitle="选择器皿形态"
                type="vessel"
                isActive={true}
                selectedAsset={selectedContent}
                uploadedImage={uploadedContent}
                onClear={() => { setSelectedContent(null); setUploadedContent(null); setStatus('idle'); }}
                onUpload={(f) => { handleFileUpload(f, 'content'); setStatus('idle'); }}
              />
            </div>
          </div>

          {/* Step 3: Parameters */}
          <div className="mb-20 animate-fade-in-up animation-delay-400">
            <div className="flex items-center gap-6 mb-10">
              <h3 className="text-3xl font-serif text-clay-900 italic">三 · 匠心</h3>
              <div className="h-px bg-clay-300 flex-grow"></div>
            </div>
            
            <div className="bg-white rounded-sm shadow-sm border border-clay-100 p-10 grid grid-cols-1 gap-10">
              {/* IP-Adapter Weight */}
              <div className="flex flex-col gap-4 group">
                <div className="flex justify-between items-end">
                  <div>
                    <label className="text-sm font-bold text-clay-900 uppercase tracking-widest flex items-center gap-2 mb-1">
                      纹饰渗透率 (IP-Adapter)
                    </label>
                    <p className="text-xs text-clay-500 font-light">控制纹理在器物表面的覆盖强度</p>
                  </div>
                  <span className="text-lg text-indigo-dye font-mono bg-indigo-50 px-4 py-1 rounded-md">{ipAdapterWeight.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.05" 
                  value={ipAdapterWeight} onChange={(e) => { setIpAdapterWeight(parseFloat(e.target.value)); setStatus('idle'); }}
                  className="w-full h-2 bg-clay-200 rounded-lg appearance-none cursor-pointer accent-indigo-dye"
                />
              </div>

              {/* ControlNet Weight */}
              <div className="flex flex-col gap-4 group">
                <div className="flex justify-between items-end">
                  <div>
                    <label className="text-sm font-bold text-clay-900 uppercase tracking-widest flex items-center gap-2 mb-1">
                      器型约束力 (ControlNet)
                    </label>
                    <p className="text-xs text-clay-500 font-light">保持原始器物轮廓的严格程度</p>
                  </div>
                  <span className="text-lg text-indigo-dye font-mono bg-indigo-50 px-4 py-1 rounded-md">{controlNetWeight.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.05" 
                  value={controlNetWeight} onChange={(e) => { setControlNetWeight(parseFloat(e.target.value)); setStatus('idle'); }}
                  className="w-full h-2 bg-clay-200 rounded-lg appearance-none cursor-pointer accent-indigo-dye"
                />
              </div>

              {/* Denoising Strength */}
              <div className="flex flex-col gap-4 group">
                <div className="flex justify-between items-end">
                  <div>
                    <label className="text-sm font-bold text-clay-900 uppercase tracking-widest flex items-center gap-2 mb-1">
                      岁月重绘度 (Denoising)
                    </label>
                    <p className="text-xs text-clay-500 font-light">数值越高，AI 自由发挥的空间越大</p>
                  </div>
                  <span className="text-lg text-indigo-dye font-mono bg-indigo-50 px-4 py-1 rounded-md">{denoisingStrength.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.05" 
                  value={denoisingStrength} onChange={(e) => { setDenoisingStrength(parseFloat(e.target.value)); setStatus('idle'); }}
                  className="w-full h-2 bg-clay-200 rounded-lg appearance-none cursor-pointer accent-indigo-dye"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center mb-24 animate-fade-in-up animation-delay-600">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={\`
                relative overflow-hidden group px-16 py-5 rounded-full text-xl font-serif tracking-widest transition-all duration-500 shadow-xl
                \${canGenerate 
                  ? 'bg-indigo-dye text-white hover:shadow-indigo-dye/40 hover:-translate-y-1' 
                  : 'bg-clay-200 text-clay-400 cursor-not-allowed shadow-none'
                }
              \`}
            >
              <span className="relative z-10 flex items-center gap-4">
                {status === 'processing' ? (
                  <><svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> 窑火燃烧中...</>
                ) : (
                  <><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> 开窑铸造</>
                )}
              </span>
              {canGenerate && status !== 'processing' && (
                <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
              )}
            </button>
          </div>

          {/* Gallery Section */}
          <div className="mb-20 animate-fade-in-up animation-delay-800">
            <div className="flex items-center gap-6 mb-10">
              <h3 className="text-3xl font-serif text-clay-900 italic">四 · 典藏</h3>
              <div className="h-px bg-clay-300 flex-grow"></div>
            </div>
            <Gallery 
              onSelect={(asset) => { handleGallerySelect(asset); setStatus('idle'); }} 
              selectedIds={[selectedStyle?.id, selectedContent?.id].filter(Boolean) as string[]} 
            />
          </div>

          {/* Showcase Carousel */}
          <div className="animate-fade-in-up animation-delay-1000">
            <div className="flex items-center gap-6 mb-10">
              <h3 className="text-3xl font-serif text-clay-900 italic">五 · 传世</h3>
              <div className="h-px bg-clay-300 flex-grow"></div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-sm border border-clay-100 p-6">
              <ShowcaseCarousel />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
`;

content = content.substring(0, startIndex) + newReturn;
fs.writeFileSync(path, content);
console.log('Replaced successfully');
