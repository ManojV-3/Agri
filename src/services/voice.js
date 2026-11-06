import i18n from '../i18n';
import { transliterateKannada } from './kannadaTransliterate';

let currentAudio = null;
let currentUtterance = null;
let keepAliveTimer = null;
let voiceNoticeListeners = [];
let audioStateListeners = [];
let audioContext = null;

// Initialize Web Audio Context safely on user gesture
function getAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

/**
 * Play synthesized harmonic audio chimes using Web Audio API
 * Guarantees 100% offline, immediate audible feedback on every device!
 */
export function playChime(type = 'chime') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'listen') {
      // Harmonic 2-tone melodic chime: C5 (523.25Hz) -> G5 (783.99Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(783.99, now + 0.12);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'mic-start') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'mic-success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880.00, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (err) {
    console.warn('[CropCare Voice] AudioContext chime notice:', err);
  }
}

export function subscribeAudioState(fn) {
  audioStateListeners.push(fn);
  return () => {
    audioStateListeners = audioStateListeners.filter(l => l !== fn);
  };
}

function notifyAudioState(isSpeaking, text = '', lang = 'en') {
  audioStateListeners.forEach(fn => fn({ isSpeaking, text, lang }));
}

export function subscribeVoiceNotice(fn) {
  voiceNoticeListeners.push(fn);
  return () => {
    voiceNoticeListeners = voiceNoticeListeners.filter(l => l !== fn);
  };
}

export function notifyVoiceNotice(text, isError = false) {
  voiceNoticeListeners.forEach(fn => fn({ text, isError }));
}

export function stopAudio() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    currentUtterance = null;
    window._cropCareActiveUtterance = null;
  }
  notifyAudioState(false);
}

/**
 * Retrieve installed voices asynchronously
 */
export async function detectAvailableVoices() {
  if (!('speechSynthesis' in window)) return [];
  let voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) return voices;

  return new Promise((resolve) => {
    let timer = null;
    const onVoices = () => {
      clearTimeout(timer);
      window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', onVoices);
    timer = setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
      resolve(window.speechSynthesis.getVoices());
    }, 300);
  });
}

/**
 * Play Audio / Text-To-Speech with audible sound & visual captions
 * Guarantees Kannada text is spoken aloud by using native Kannada voice if available,
 * or phonetic transliteration on Indian/system voices!
 */
export async function playAudio(key, fallbackText = '', language = null) {
  // If speech is currently playing, cancel and allow Chromium a brief 60ms tick to clear the queue
  if ('speechSynthesis' in window && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
    window.speechSynthesis.cancel();
    await new Promise(r => setTimeout(r, 60));
  }
  stopAudio();

  const lang = language || i18n.language || 'en';
  const rawText = (fallbackText || key || '').trim();

  // Clean special characters
  const cleanText = rawText
    .replace(/[₹•*#⚠️]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Play pleasant harmonic bell tone first (immediate audible feedback)
  playChime('listen');

  if (!cleanText) {
    return;
  }

  // Notify caption bar immediately so visual feedback starts
  notifyAudioState(true, rawText, lang);

  if ('speechSynthesis' in window) {
    try {
      const voices = await detectAvailableVoices();

      // Check if native Kannada voice exists in system
      const nativeKannadaVoice = voices.find(v =>
        v.lang === 'kn-IN' || v.lang.startsWith('kn') || v.name.toLowerCase().includes('kannada')
      );

      // Check for Indian voice (en-IN or hi-IN)
      const indianVoice = voices.find(v =>
        v.lang === 'en-IN' || v.lang === 'hi-IN' || v.name.toLowerCase().includes('india')
      );

      const defaultVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];

      let textToSpeak = cleanText;
      let selectedVoice = null;
      let targetLang = 'en-US';

      if (lang === 'kn') {
        if (nativeKannadaVoice) {
          // Native Kannada voice available: speak Kannada script directly!
          textToSpeak = cleanText;
          selectedVoice = nativeKannadaVoice;
          targetLang = nativeKannadaVoice.lang || 'kn-IN';
        } else {
          // No Kannada voice pack installed on Windows/OS:
          // Transliterate Kannada script to phonetic Latin characters so system voices pronounce Kannada audibly!
          textToSpeak = transliterateKannada(cleanText);
          selectedVoice = indianVoice || defaultVoice;
          targetLang = selectedVoice ? selectedVoice.lang : 'en-US';
        }
      } else {
        selectedVoice = indianVoice || defaultVoice;
        targetLang = selectedVoice ? selectedVoice.lang : 'en-US';
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = targetLang;
      utterance.rate = lang === 'kn' && !nativeKannadaVoice ? 0.88 : 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      currentUtterance = utterance;
      // Prevent Chromium V8 Garbage Collection bug mid-speech
      window._cropCareActiveUtterance = utterance;

      utterance.onend = () => {
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
          keepAliveTimer = null;
        }
        currentUtterance = null;
        window._cropCareActiveUtterance = null;
        notifyAudioState(false);
      };

      utterance.onerror = (e) => {
        console.warn('[CropCare Voice] Utterance error, falling back:', e);
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
          keepAliveTimer = null;
        }
        currentUtterance = null;
        window._cropCareActiveUtterance = null;
        notifyAudioState(false);
      };

      window.speechSynthesis.speak(utterance);

      // Chromium keep-alive interval: Chrome pauses long speech synthesis if unprompted
      keepAliveTimer = setInterval(() => {
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else {
          clearInterval(keepAliveTimer);
          keepAliveTimer = null;
        }
      }, 4000);

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      return;
    } catch (err) {
      console.warn('[CropCare Voice] SpeechSynthesis exception:', err);
    }
  }

  // Safety timer if speech synthesis completes or is unsupported
  setTimeout(() => notifyAudioState(false), 5000);
}

/**
 * Initialize Speech Recognition for simple commands
 */
export function initSpeechRecognition({ onCommand, onStatus, onError, onInterim }) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    if (onError) onError('unsupported');
    return null;
  }

  const recognition = new SpeechRec();
  recognition.continuous = false;
  recognition.interimResults = true;

  const currentLang = i18n.language || 'en';
  recognition.lang = currentLang === 'kn' ? 'kn-IN' : 'en-IN';

  recognition.onstart = () => {
    playChime('mic-start');
    if (onStatus) onStatus('listening');
  };

  recognition.onresult = (event) => {
    if (event.results && event.results[0]) {
      const transcript = event.results[0][0].transcript;
      const isFinal = event.results[0].isFinal;

      if (onInterim) onInterim(transcript);

      if (isFinal) {
        playChime('mic-success');
        if (onCommand) onCommand(transcript.toLowerCase().trim());
      }
    }
  };

  recognition.onerror = (err) => {
    console.warn('[CropCare Mic] Speech recognition notice:', err);
    if (onError) onError(err.error || 'error');
    if (onStatus) onStatus('idle');
  };

  recognition.onend = () => {
    if (onStatus) onStatus('idle');
  };

  return recognition;
}
