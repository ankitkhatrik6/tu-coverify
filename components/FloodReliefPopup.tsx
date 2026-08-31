"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function FloodReliefPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to make the popup entrance feel more natural after page load
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => {
      clearTimeout(initialTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 md:p-6 transition-opacity duration-300">
      <div 
        className="relative w-full max-w-[90vw] md:max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 z-10 p-2 md:p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close popup"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="relative w-full h-[65vh] md:h-[80vh] max-h-[850px] bg-gray-50 flex items-center justify-center p-2">
          <Image
            src="/pmrelieffund.jpg"
            alt="Prime Minister Disaster Relief Fund for Flood Victims in Nepal"
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 50vw"
            priority
          />
        </div>
        
        <div className="p-4 md:p-6 text-center bg-white border-t border-gray-100 shrink-0">
          <h3 id="modal-title" className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            Support Flood Victims in Nepal
          </h3>
          <p className="text-sm md:text-base text-gray-700">
            Please contribute to the Prime Minister Disaster Relief Fund to support the relief efforts for flood victims in Nepal. Scan the QR code above.
          </p>
        </div>
      </div>
    </div>
  );
}
