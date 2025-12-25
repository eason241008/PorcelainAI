import React, { useState } from 'react';
import { MOCK_RESTORATIONS } from '../constants';

export const ShowcaseCarousel: React.FC = () => {
  // Triple the list to ensure smooth infinite scroll without gaps
  const items = [...MOCK_RESTORATIONS, ...MOCK_RESTORATIONS, ...MOCK_RESTORATIONS];

  return (
    <div className="w-full overflow-hidden py-12 relative group">
      {/* Fade Edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-r from-clay-50 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-l from-clay-50 to-transparent z-10 pointer-events-none"></div>

      <div className="flex w-fit animate-marquee hover:[animation-play-state:paused]">
        {items.map((item, index) => (
          <div 
            key={`${item.id}-${index}`} 
            className="flex-shrink-0 w-[280px] md:w-[320px] mx-4 md:mx-6 relative rounded-xl overflow-hidden shadow-md bg-white border border-clay-100 group/card transition-transform hover:-translate-y-1 duration-300"
          >
            {/* Main Result */}
            <div className="aspect-[3/4] overflow-hidden bg-clay-100">
              <img 
                src={item.result} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
              />
            </div>
            
            {/* Overlay Info (appears on hover) */}
            <div className="absolute inset-0 bg-indigo-dye/90 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 text-center">
              <h4 className="text-white font-serif text-xl mb-4 italic">{item.title}</h4>
              
              <div className="flex items-center gap-3 w-full justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden mb-1">
                    <img src={item.styleThumb} className="w-full h-full object-cover" alt="Style" />
                  </div>
                  <span className="text-white/60 text-[10px] uppercase tracking-widest">Frag</span>
                </div>
                
                <span className="text-white/50 text-xl font-serif">+</span>
                
                <div className="flex flex-col items-center">
                   <div className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden mb-1">
                    <img src={item.contentThumb} className="w-full h-full object-cover" alt="Shape" />
                  </div>
                  <span className="text-white/60 text-[10px] uppercase tracking-widest">Shape</span>
                </div>
              </div>
            </div>
            
            {/* Bottom Label (visible by default) */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent group-hover/card:opacity-0 transition-opacity duration-300">
              <p className="text-white font-serif text-lg">{item.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};