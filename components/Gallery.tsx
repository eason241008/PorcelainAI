import React, { useState, useMemo } from 'react';
import { MOCK_DATABASE } from '../constants';
import { ImageAsset, GalleryFilter } from '../types';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface GalleryProps {
  onSelect: (asset: ImageAsset) => void;
  selectedIds: string[]; // IDs currently active in the workbench
}

export const Gallery: React.FC<GalleryProps> = ({ onSelect, selectedIds }) => {
  const [filter, setFilter] = useState<GalleryFilter>({ search: '', type: '全部' });

  const filteredAssets = useMemo(() => {
    return MOCK_DATABASE.filter(asset => {
      const matchesSearch = asset.title.toLowerCase().includes(filter.search.toLowerCase()) || 
                            asset.description.toLowerCase().includes(filter.search.toLowerCase());
      const matchesType = filter.type === 'all' || asset.type === filter.type;
      return matchesSearch && matchesType;
    });
  }, [filter]);

  return (
    <div className="w-full bg-white rounded-sm shadow-sm border border-clay-200 p-8 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6 border-b border-clay-100 pb-6">
        <div>
          <h2 className="text-3xl font-serif text-clay-900 italic mb-2">典藏</h2>
          <p className="text-clay-600 font-light text-sm max-w-md">浏览我们精心挑选的陶器碎片和器皿几何体，创作你的艺术品。</p>
        </div>
        
        {/* Search & Filter Controls */}
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-clay-400" />
            <input 
              type="text" 
              placeholder="搜索文物..." 
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="pl-9 pr-4 py-2 border border-clay-200 bg-clay-50/50 rounded-sm text-sm w-full md:w-64 focus:outline-none focus:border-indigo-dye transition-colors font-light placeholder:text-clay-400"
            />
          </div>
          <div className="relative">
             <select
               value={filter.type}
               onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as any }))}
               className="pl-4 pr-10 py-2 border border-clay-200 bg-white rounded-sm text-sm appearance-none focus:outline-none focus:border-indigo-dye cursor-pointer font-medium text-clay-700"
             >
               <option value="all">全部</option>
               <option value="fragment">碎片</option>
               <option value="vessel">器皿</option>
             </select>
             <FunnelIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-clay-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {filteredAssets.map((asset) => (
          <div 
            key={asset.id} 
            className={`group relative overflow-hidden bg-white cursor-pointer transition-all duration-500 ${
              selectedIds.includes(asset.id) ? 'ring-2 ring-offset-4 ring-indigo-dye' : 'hover:shadow-xl'
            }`}
            onClick={() => onSelect(asset)}
          >
            <div className="aspect-[4/5] bg-clay-100 relative overflow-hidden">
               <img 
                 src={asset.url} 
                 alt={asset.title} 
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter grayscale-[20%] group-hover:grayscale-0"
               />
               
               {/* Overlay Info */}
               <div className="absolute inset-0 bg-indigo-dye/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-center p-6">
                 <p className="text-white font-serif text-lg italic mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{asset.title}</p>
                 <div className="w-8 h-px bg-white/50 mb-3"></div>
                 <p className="text-white/80 text-xs font-light leading-relaxed translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">{asset.description}</p>
                 <button className="mt-4 text-[10px] uppercase tracking-widest text-white border border-white/30 px-3 py-1 hover:bg-white hover:text-indigo-dye transition-colors">选择</button>
               </div>
               
               {/* Type Badge (Visible always) */}
               <span className={`absolute top-0 left-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm ${
                 asset.type === 'fragment' ? 'bg-indigo-dye/80' : 'bg-clay-900/60'
               }`}>
                 {asset.type}
               </span>
            </div>
            
            {/* Simple label below */}
            <div className="py-3 px-1">
              <h4 className="font-serif text-clay-900 text-lg leading-tight group-hover:text-indigo-dye transition-colors">{asset.title}</h4>
              <p className="text-xs text-clay-500 mt-1 uppercase tracking-wider">{asset.era || 'Unknown Era'}</p>
            </div>
            
            {/* Selection Indicator */}
             {selectedIds.includes(asset.id) && (
              <div className="absolute top-2 right-2 bg-indigo-dye text-white rounded-full p-1 shadow-lg z-10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        ))}
        {filteredAssets.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <p className="text-clay-400 font-serif text-xl italic">未找到文物。</p>
            <button 
                onClick={() => setFilter({search: '', type: 'all'})}
                className="mt-4 text-indigo-dye text-sm underline hover:text-indigo-light"
            >
                清除筛选
            </button>
          </div>
        )}
      </div>
    </div>
  );
};