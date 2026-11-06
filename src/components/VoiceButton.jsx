import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX } from 'lucide-react';
import { playAudio, stopAudio, subscribeAudioState } from '../services/voice';

export default function VoiceButton({
  audioKey,
  textToSpeak,
  label = null,
  size = 'md',
  className = '',
  variant = 'primary'
}) {
  const { t, i18n } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const unsub = subscribeAudioState(({ isSpeaking, text }) => {
      if (!isSpeaking) {
        setIsPlaying(false);
      } else if (text === textToSpeak) {
        setIsPlaying(true);
      }
    });
    return unsub;
  }, [textToSpeak]);

  const handleToggle = async (e) => {
    e.stopPropagation();
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    await playAudio(audioKey, textToSpeak, i18n.language);
  };

  const isSmall = size === 'sm';
  const displayLabel = label !== null ? label : (isPlaying ? t('scan.stopListening', 'Stop') : t('scan.listen', 'Listen'));

  const variants = {
    primary: 'bg-farm-800 text-white hover:bg-farm-900 border-farm-900 shadow-sm active:bg-farm-900',
    secondary: 'bg-farm-100 text-farm-900 hover:bg-farm-200 border-farm-300',
    outline: 'border-2 border-farm-700 text-farm-800 bg-white hover:bg-farm-50'
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`btn-touch px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
        isPlaying ? 'ring-2 ring-amber-400 bg-amber-600 text-white' : variants[variant] || variants.primary
      } ${className}`}
      aria-label={displayLabel}
    >
      {isPlaying ? (
        <>
          <VolumeX size={isSmall ? 18 : 20} className="animate-pulse" />
          <span className="text-sm">{displayLabel}</span>
        </>
      ) : (
        <>
          <Volume2 size={isSmall ? 18 : 20} />
          <span className="text-sm">{displayLabel}</span>
        </>
      )}
    </button>
  );
}
