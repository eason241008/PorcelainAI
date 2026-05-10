import React, { useEffect, useMemo, useState } from 'react';
import { MOCK_DATABASE } from '../constants';
import { ImageAsset } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface GalleryProps {
  onSelect: (asset: ImageAsset) => void;
  selectedIds: string[];
}

type DisplayMode = 'fragment' | 'vessel';

const ITEMS_PER_PAGE = 12;

export const Gallery: React.FC<GalleryProps> = ({ onSelect, selectedIds }) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('fragment');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const showEraLabel = displayMode !== 'vessel';

  useEffect(() => {
    setCurrentPage(1);
  }, [displayMode, searchQuery]);

  const filteredAssets = useMemo(() => {
    return MOCK_DATABASE.filter((asset) => {
      const matchesSearch =
        asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = asset.type === displayMode;
      return matchesSearch && matchesType;
    });
  }, [displayMode, searchQuery]);

  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAssets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAssets, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="w-full bg-white rounded-sm shadow-sm border border-clay-200 p-6 md:p-8 flex flex-col min-h-[800px]">
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-6 border-b border-clay-100 pb-4">
        <div>
          <h2 className="text-2xl font-serif text-clay-900 italic mb-2">典藏</h2>
          <p className="text-clay-600 font-light text-xs max-w-md">
            {displayMode === 'fragment'
              ? '浏览古陶碎片，提取独特的历史纹理。'
              : '选择现代器皿模型，作为风格迁移的载体。'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
          <div className="relative flex-grow md:flex-grow-0">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-clay-400" />
            <input
              type="text"
              placeholder={displayMode === 'fragment' ? '搜索碎片...' : '搜索器型...'}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9 pr-4 py-1.5 border border-clay-200 bg-clay-50/50 rounded-sm text-xs w-full md:w-56 focus:outline-none focus:border-indigo-dye transition-colors font-light placeholder:text-clay-400"
            />
          </div>

          <div className="flex bg-clay-50 p-1 rounded-md border border-clay-200">
            <button
              onClick={() => setDisplayMode('fragment')}
              className={`px-3 py-1 rounded-sm text-xs font-medium transition-all ${
                displayMode === 'fragment'
                  ? 'bg-white text-indigo-dye shadow-sm ring-1 ring-black/5'
                  : 'text-clay-600 hover:text-clay-900'
              }`}
            >
              碎片库
            </button>
            <button
              onClick={() => setDisplayMode('vessel')}
              className={`px-3 py-1 rounded-sm text-xs font-medium transition-all ${
                displayMode === 'vessel'
                  ? 'bg-white text-indigo-dye shadow-sm ring-1 ring-black/5'
                  : 'text-clay-600 hover:text-clay-900'
              }`}
            >
              器皿库
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 flex-grow content-start">
        {paginatedAssets.map((asset) => (
          <div
            key={asset.id}
            className={`group relative bg-white cursor-pointer transition-all duration-300 border border-transparent ${
              selectedIds.includes(asset.id)
                ? 'ring-2 ring-indigo-dye shadow-md'
                : 'hover:border-clay-200 hover:shadow-lg'
            }`}
            onClick={() => onSelect(asset)}
          >
            <div className="aspect-[4/5] bg-clay-50 relative overflow-hidden p-6 flex items-center justify-center">
              <img
                src={asset.url}
                alt={asset.title}
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-sm"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-indigo-dye/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end items-center pb-4 pt-10">
                <button className="text-[10px] uppercase tracking-widest text-white border border-white/40 px-3 py-1 hover:bg-white hover:text-indigo-dye transition-colors">
                  {selectedIds.includes(asset.id) ? '已选择' : '选择'}
                </button>
              </div>

              <span
                className={`absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-sm rounded-sm ${
                  asset.type === 'fragment' ? 'bg-indigo-dye/80' : 'bg-clay-900/60'
                }`}
              >
                {asset.type === 'fragment' ? 'STYLE' : 'VESSEL'}
              </span>
            </div>

            <div className="py-3 px-3 text-center bg-white">
              <h4 className="font-serif text-clay-900 text-sm font-medium group-hover:text-indigo-dye transition-colors truncate">
                {asset.title}
              </h4>
              {showEraLabel && (
                <p className="text-[10px] text-clay-400 mt-0.5 uppercase tracking-wider">
                  {asset.era || '未知年代'}
                </p>
              )}
            </div>

            {selectedIds.includes(asset.id) && (
              <div className="absolute top-2 right-2 bg-indigo-dye text-white rounded-full p-1 shadow-sm z-10 animate-bounce-short">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        ))}

        {filteredAssets.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-clay-50 rounded-full flex items-center justify-center mb-4 text-clay-400">
              <MagnifyingGlassIcon className="w-6 h-6" />
            </div>
            <p className="text-clay-500 font-serif text-lg italic">未找到相关文物</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-1.5 bg-indigo-dye text-white text-xs rounded-sm hover:bg-indigo-light transition-colors"
            >
              查看全部
            </button>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-4 border-t border-clay-100 pt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-full border border-clay-200 text-clay-600 hover:bg-clay-50 hover:text-indigo-dye disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>

          <span className="text-xs font-medium text-clay-700 font-mono">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-full border border-clay-200 text-clay-600 hover:bg-clay-50 hover:text-indigo-dye disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
