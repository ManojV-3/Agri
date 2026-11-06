import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Volume2, X, Sparkles, ArrowRight } from 'lucide-react';
import { initSpeechRecognition, playAudio, playChime, stopAudio } from '../services/voice';

export default function VoiceAssistantModal({ isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [recognitionInstance, setRecognitionInstance] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setFeedback('');
      startListening();
    } else {
      stopListening();
    }
    return () => {
      stopListening();
    };
  }, [isOpen]);

  const startListening = () => {
    stopAudio();
    const rec = initSpeechRecognition({
      onStatus: (st) => setIsListening(st === 'listening'),
      onInterim: (text) => setTranscript(text),
      onCommand: (spoken) => handleCommand(spoken),
      onError: (err) => {
        setIsListening(false);
        if (err === 'not-allowed') {
          setFeedback(i18n.language === 'kn'
            ? 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನೀಡಿ ಅಥವಾ ಕೆಳಗಿನ ಬಟನ್‌ಗಳನ್ನು ಒತ್ತಿ'
            : 'Microphone permission blocked. Please allow mic or tap commands below.');
        } else {
          setFeedback(i18n.language === 'kn'
            ? 'ಧ್ವನಿ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಲಿಲ್ಲ. ಕೆಳಗಿನ ಆಯ್ಕೆಗಳನ್ನು ಬಳಸಿ.'
            : 'Could not hear clearly. Please speak again or tap a command below.');
        }
      }
    });

    if (rec) {
      setRecognitionInstance(rec);
      try {
        rec.start();
      } catch (e) {
        console.warn('Speech start notice:', e);
      }
    } else {
      setFeedback(i18n.language === 'kn'
        ? 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಲಭ್ಯವಿಲ್ಲ. ಕೆಳಗಿನ ಬಟನ್ ಬಳಸಿ.'
        : 'Speech recognition not available. Please tap the quick voice buttons below.');
    }
  };

  const stopListening = () => {
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch {
        // ignore
      }
      setRecognitionInstance(null);
    }
    setIsListening(false);
  };

  const handleCommand = (rawText) => {
    const text = rawText.toLowerCase().trim();
    setTranscript(rawText);

    const isKn = i18n.language === 'kn';

    // 1. Leaf Scanner
    if (
      text.includes('scan') || text.includes('skan') || text.includes('camera') ||
      text.includes('photo') || text.includes('leaf') || text.includes('pic') ||
      text.includes('capture') || text.includes('detect') || text.includes('analyze') ||
      text.includes('test') || text.includes('ಸ್ಕ್ಯಾನ್') || text.includes('ಫೋಟೋ') ||
      text.includes('ಎಲೆ') || text.includes('ಕ್ಯಾಮೆರಾ') || text.includes('ಚಿತ್ರ')
    ) {
      const msg = isKn ? 'ಎಲೆ ಸ್ಕ್ಯಾನರ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ' : 'Opening leaf disease scanner';
      executeAction('/scan', msg);
    }
    // 2. Cost Calculator
    else if (
      text.includes('cost') || text.includes('price') || text.includes('rate') ||
      text.includes('medicine') || text.includes('spray') || text.includes('pesticide') ||
      text.includes('fertilizer') || text.includes('rupee') || text.includes('expense') ||
      text.includes('buy') || text.includes('budget') || text.includes('ವೆಚ್ಚ') ||
      text.includes('ದರ') || text.includes('ಬೆಲೆ') || text.includes('ಔಷಧ') ||
      text.includes('ಖರ್ಚು') || text.includes('ದುಡ್ಡು') || text.includes('ಹಣ')
    ) {
      const msg = isKn ? 'ಔಷಧ ಚಿಕಿತ್ಸಾ ವೆಚ್ಚ ಲೆಕ್ಕ ತೆರೆಯಲಾಗುತ್ತಿದೆ' : 'Opening treatment cost calculator';
      executeAction('/cost', msg);
    }
    // 3. Fields & Farms
    else if (
      text.includes('field') || text.includes('fields') || text.includes('crop') ||
      text.includes('crops') || text.includes('farm') || text.includes('plot') ||
      text.includes('land') || text.includes('acres') || text.includes('ಜಮೀನು') ||
      text.includes('ಹೊಲ') || text.includes('ಬೆಳೆ') || text.includes('ಗದ್ದೆ') ||
      text.includes('ತೋಟ') || text.includes('ಎಕರೆ')
    ) {
      const msg = isKn ? 'ನಿಮ್ಮ ಜಮೀನಿನ ವಿವರಗಳನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ' : 'Opening your crop fields';
      executeAction('/fields', msg);
    }
    // 4. History & Health Analytics
    else if (
      text.includes('history') || text.includes('trend') || text.includes('analytics') ||
      text.includes('dashboard') || text.includes('record') || text.includes('past') ||
      text.includes('health') || text.includes('ಇತಿಹಾಸ') || text.includes('ದಾಖಲೆ') ||
      text.includes('ವರದಿ') || text.includes('ಆರೋಗ್ಯ')
    ) {
      const msg = isKn ? 'ಕೃಷಿ ಆರೋಗ್ಯ ಇತಿಹಾಸ ತೆರೆಯಲಾಗುತ್ತಿದೆ' : 'Opening farm health history';
      executeAction('/analytics', msg);
    }
    // 5. Disease Guide / Solutions Encyclopedia
    else if (
      text.includes('guide') || text.includes('disease') || text.includes('diseases') ||
      text.includes('library') || text.includes('help') || text.includes('info') ||
      text.includes('symptom') || text.includes('solution') || text.includes('solutions') ||
      text.includes('book') || text.includes('ಮಾಹಿತಿ') || text.includes('ರೋಗ') ||
      text.includes('ರೋಗಗಳು') || text.includes('ಪರಿಹಾರ') || text.includes('ಪುಸ್ತಕ')
    ) {
      const msg = isKn ? 'ಬೆಳೆ ರೋಗಗಳ ಮಾಹಿತಿ ಕೋಶ ತೆರೆಯಲಾಗುತ್ತಿದೆ' : 'Opening crop disease guide';
      executeAction('/solutions', msg);
    }
    // 5.5 Regional Outbreak Map & Alerts
    else if (
      text.includes('outbreak') || text.includes('map') || text.includes('alert') ||
      text.includes('spread') || text.includes('warning') || text.includes('loss') ||
      text.includes('hotspot') || text.includes('ನಕ್ಷೆ') || text.includes('ಎಚ್ಚರಿಕೆ') ||
      text.includes('ಹರಡುವಿಕೆ') || text.includes('ನಷ್ಟ')
    ) {
      const msg = isKn ? 'ಪ್ರಾದೇಶಿಕ ರೋಗ ಹರಡುವಿಕೆ ಮತ್ತು ಎಚ್ಚರಿಕೆ ನಕ್ಷೆ ತೆರೆಯಲಾಗುತ್ತಿದೆ' : 'Opening regional outbreaks map and alerts';
      executeAction('/outbreaks', msg);
    }
    // 6. Home / Hub
    else if (
      text.includes('home') || text.includes('main') || text.includes('hub') ||
      text.includes('start') || text.includes('ಮುಖ್ಯ') || text.includes('ಮನೆ')
    ) {
      const msg = isKn ? 'ಮುಖ್ಯ ಪುಟಕ್ಕೆ ಹೋಗಲಾಗುತ್ತಿದೆ' : 'Going to Home Hub';
      executeAction('/home', msg);
    }
    // 7. Farmer Profile
    else if (
      text.includes('profile') || text.includes('account') || text.includes('farmer') ||
      text.includes('user') || text.includes('settings') || text.includes('ಪ್ರೊಫೈಲ್') ||
      text.includes('ಖಾತೆ') || text.includes('ರೈತ')
    ) {
      const msg = isKn ? 'ರೈತರ ಪ್ರೊಫೈಲ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ' : 'Opening farmer profile';
      executeAction('/profile', msg);
    }
    // 8. Crops Direct Shortcut
    else if (text.includes('tomato') || text.includes('tamatar') || text.includes('ಟೊಮೇಟೊ') || text.includes('ತೊಮೇಟೊ')) {
      const msg = isKn ? 'ಟೊಮೇಟೊ ರೋಗಗಳ ಚಿಕಿತ್ಸೆಗಳು' : 'Showing Tomato disease remedies';
      executeAction('/solutions', msg);
    } else if (text.includes('potato') || text.includes('aloo') || text.includes('ಆಲೂಗಡ್ಡೆ') || text.includes('ಆಲೂ')) {
      const msg = isKn ? 'ಆಲೂಗಡ್ಡೆ ರೋಗಗಳ ಚಿಕಿತ್ಸೆಗಳು' : 'Showing Potato disease remedies';
      executeAction('/solutions', msg);
    } else if (text.includes('rice') || text.includes('paddy') || text.includes('ಭತ್ತ') || text.includes('ಅಕ್ಕಿ')) {
      const msg = isKn ? 'ಭತ್ತದ ರೋಗಗಳ ಚಿಕಿತ್ಸೆಗಳು' : 'Showing Rice disease remedies';
      executeAction('/solutions', msg);
    } else if (text.includes('maize') || text.includes('corn') || text.includes('ಮೆಕ್ಕೆಜೋಳ') || text.includes('ಜೋಳ')) {
      const msg = isKn ? 'ಮೆಕ್ಕೆಜೋಳದ ಚಿಕಿತ್ಸೆಗಳು' : 'Showing Maize disease remedies';
      executeAction('/solutions', msg);
    } else if (text.includes('chilli') || text.includes('chili') || text.includes('pepper') || text.includes('ಮಿರ್ಚಿ') || text.includes('ಮೆಣಸಿನಕಾಯಿ')) {
      const msg = isKn ? 'ಮೆಣಸಿನಕಾಯಿ ರೋಗಗಳ ಚಿಕಿತ್ಸೆಗಳು' : 'Showing Chilli disease remedies';
      executeAction('/solutions', msg);
    }
    // 9. Language Switch
    else if (text.includes('kannada') || text.includes('kannad') || text.includes('ಕನ್ನಡ')) {
      i18n.changeLanguage('kn');
      executeAction(null, 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ');
    } else if (text.includes('english') || text.includes('ಇಂಗ್ಲಿಷ್')) {
      i18n.changeLanguage('en');
      executeAction(null, 'Language switched to English');
    }
    // 10. Fallback with helpful spoken guidance
    else {
      const msg = isKn
        ? `"${rawText}" ಕೇಳಿಸಿದೆ. 'ಸ್ಕ್ಯಾನ್', 'ವೆಚ್ಚ', 'ಜಮೀನು' ಅಥವಾ ಬೆಳೆಯ ಹೆಸರು ಹೇಳಿ.`
        : `Heard: "${rawText}". You can say 'Scan leaf', 'Check cost', 'My fields' or any crop name.`;
      setFeedback(msg);
      playAudio('voice_speak', msg, i18n.language);
    }
  };

  const executeAction = (route, speechMessage) => {
    setFeedback(speechMessage);
    playChime('mic-success');
    playAudio('voice_reply', speechMessage, i18n.language);

    setTimeout(() => {
      if (route) {
        navigate(route);
      }
      onClose();
    }, 1600);
  };

  const quickCommands = [
    { label: i18n.language === 'kn' ? '📷 ಎಲೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ' : '📷 Scan Leaf Now', cmd: 'scan' },
    { label: i18n.language === 'kn' ? '💰 ಔಷಧ ವೆಚ್ಚ ಲೆಕ್ಕ' : '💰 Medicine Cost', cmd: 'cost' },
    { label: i18n.language === 'kn' ? '🗺️ ಎಚ್ಚರಿಕೆ ನಕ್ಷೆ' : '🗺️ Outbreak Map', cmd: 'outbreak' },
    { label: i18n.language === 'kn' ? '🌾 ನನ್ನ ಜಮೀನು' : '🌾 My Fields', cmd: 'fields' },
    { label: i18n.language === 'kn' ? '📊 ಆರೋಗ್ಯ ಇತಿಹಾಸ' : '📊 Health History', cmd: 'history' },
    { label: i18n.language === 'kn' ? '🍅 ಟೊಮೇಟೊ' : '🍅 Tomato Care', cmd: 'tomato' },
    { label: i18n.language === 'kn' ? '🍚 ಭತ್ತ' : '🍚 Rice Care', cmd: 'rice' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-farm-300 text-center space-y-4">
        {/* Top Close */}
        <div className="flex justify-between items-center">
          <span className="text-xs font-extrabold text-farm-800 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 size={16} />
            <span>CropCare Voice Assistant</span>
          </span>
          <button
            onClick={onClose}
            className="btn-touch p-1 text-gray-400 hover:text-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Big Pulsing Mic Circle */}
        <div className="py-2">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-2xl transition-all relative ${
              isListening
                ? 'bg-amber-500 text-white ring-8 ring-amber-300/40 animate-pulse scale-105'
                : 'bg-farm-800 text-white hover:bg-farm-900'
            }`}
          >
            <Mic size={40} />
            {isListening && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white animate-ping" />
            )}
          </button>
        </div>

        {/* Live Status */}
        <div>
          <h3 className="text-base font-black text-gray-900">
            {isListening
              ? (i18n.language === 'kn' ? 'ಧ್ವನಿ ಆಲಿಸಲಾಗುತ್ತಿದೆ... ಹೇಳಿ' : 'Listening... Speak now')
              : (i18n.language === 'kn' ? 'ಮೈಕ್ ಒತ್ತಿ ಅಥವಾ ಕೆಳಗೆ ಆಯ್ಕೆಮಾಡಿ' : 'Tap mic or choose below')}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {i18n.language === 'kn'
              ? "'ಸ್ಕ್ಯಾನ್', 'ವೆಚ್ಚ', 'ಜಮೀನು' ಅಥವಾ ಬೆಳೆಯ ಹೆಸರು ಹೇಳಿ"
              : "Say 'Scan', 'Cost', 'Fields', 'History' or a crop name"}
          </p>
        </div>

        {/* Transcript Box */}
        {transcript && (
          <div className="p-3 bg-farm-50 rounded-2xl border border-farm-200 text-xs text-farm-900 font-bold">
            <span className="text-[10px] text-gray-500 block font-normal">Heard:</span>
            "{transcript}"
          </div>
        )}

        {/* Feedback Message */}
        {feedback && (
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 font-bold flex items-center justify-center gap-1.5">
            <Sparkles size={14} className="text-amber-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Quick One-Tap Command Chips */}
        <div>
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            {i18n.language === 'kn' ? 'ತ್ವರಿತ ಆಜ್ಞೆಗಳು (ಒತ್ತಿ ಮಾತನಾಡಿ):' : 'Quick Voice Commands (Tap to Speak):'}
          </div>
          <div className="grid grid-cols-2 gap-2 text-left">
            {quickCommands.map((item) => (
              <button
                key={item.cmd}
                type="button"
                onClick={() => handleCommand(item.cmd)}
                className="btn-touch px-3 py-2 bg-gray-50 hover:bg-farm-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 transition-colors flex items-center justify-between"
              >
                <span className="truncate">{item.label}</span>
                <ArrowRight size={13} className="text-farm-700 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
