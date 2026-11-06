import React, { useState, useEffect } from 'react';
import { Square } from 'lucide-react';
import { subscribeAudioState, stopAudio } from '../services/voice';

export default function AudioCaptionPlayer() {
  const [audioState, setAudioState] = useState({ isSpeaking: false, text: '', lang: 'en' });

  useEffect(() => {
    const unsub = subscribeAudioState((state) => {
      setAudioState(state);
    });
    return unsub;
  }, []);

  if (!audioState.isSpeaking) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 left-4 right-4 z-50 max-w-xl mx-auto bg-farm-900/95 text-white backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-farm-700 animate-slide-up flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {/* Animated sound wave bars */}
        <div className="flex items-end gap-1 h-5 w-6 shrink-0">
          <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
          <span className="w-1 bg-emerald-300 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-5" />
          <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-4" />
          <span className="w-1 bg-emerald-300 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-2" />
        </div>

        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
            {audioState.lang === 'kn' ? 'ಧ್ವನಿ ಓದಲಾಗುತ್ತಿದೆ (Kannada Audio):' : 'Speaking Aloud (Voice Audio):'}
          </span>
          <p className="text-xs font-semibold text-farm-50 truncate leading-snug">
            {audioState.text}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => stopAudio()}
        className="btn-touch px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 flex items-center gap-1 shadow active:scale-95 transition-transform"
      >
        <Square size={12} fill="white" />
        <span>Stop</span>
      </button>
    </div>
  );
}
