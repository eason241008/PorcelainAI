import React from 'react';

interface MuseumCardProps {
  title: string;
  description: string;
  tags: string[];
  isLoading?: boolean;
}

export const MuseumCard: React.FC<MuseumCardProps> = ({ title, description, tags, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-clay-100 p-6 rounded-sm shadow-sm animate-pulse w-full max-w-md mx-auto">
        <div className="h-6 bg-clay-100 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-clay-100 rounded"></div>
          <div className="h-4 bg-clay-100 rounded"></div>
          <div className="h-4 bg-clay-100 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FDFBF7] border border-[#E5E0D8] p-8 rounded-sm shadow-lg w-full max-w-md font-serif relative overflow-hidden mx-auto transition-all duration-500 animate-fade-in">
      
      {/* 顶部装饰 */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-900/20 to-transparent"></div>

      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold text-indigo-900 tracking-widest mb-2">{title}</h3>
        <div className="flex justify-center items-center gap-2">
            <div className="h-px w-8 bg-clay-300"></div>
            <div className="w-1.5 h-1.5 bg-indigo-dye rotate-45"></div>
            <div className="h-px w-8 bg-clay-300"></div>
        </div>
      </div>

      <div className="relative">
        <span className="absolute -top-2 -left-2 text-4xl text-clay-200 font-serif leading-none">“</span>
        <p className="text-clay-800 text-sm leading-7 text-justify indent-8 relative z-10 px-2">
            {description}
        </p>
        <span className="absolute -bottom-4 -right-0 text-4xl text-clay-200 font-serif leading-none rotate-180">“</span>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mt-8">
        {tags.map((tag, i) => (
          <span key={i} className="text-xs px-3 py-1 bg-white text-indigo-900/80 rounded-full border border-clay-200 shadow-sm tracking-wide">
            #{tag}
          </span>
        ))}
      </div>
      
      <div className="mt-8 pt-4 border-t border-dashed border-clay-200 flex justify-between items-center text-[10px] text-clay-400 uppercase tracking-[0.2em]">
         <span>PorcelainAI Collection</span>
         <span>NO. {Math.floor(Math.random() * 10000)}</span>
      </div>
    </div>
  );
};
