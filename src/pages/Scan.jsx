import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  Upload,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Check,
  MapPin,
  ArrowLeft
} from 'lucide-react';
import { checkImageQuality } from '../services/imageQuality';
import { classifyLeaf } from '../services/model';
import { saveScanRecord } from '../services/db';
import ResultCard from '../components/ResultCard';

const CROPS = [
  { id: 'all', label: 'allCrops', emoji: '🌿' },
  { id: 'tomato', label: 'tomato', emoji: '🍅' },
  { id: 'potato', label: 'potato', emoji: '🥔' },
  { id: 'maize', label: 'maize', emoji: '🌽' },
  { id: 'rice', label: 'rice', emoji: '🌾' },
  { id: 'chilli', label: 'chilli', emoji: '🌶️' }
];

export default function Scan() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const [selectedCrop, setSelectedCrop] = useState('all');
  const [imagePreview, setImagePreview] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [analyzing, setAnalyzing] = useState(false);
  const [qualityError, setQualityError] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setImagePreview(null);
    setPrediction(null);
    setQualityError(null);
    setIsCameraActive(true);

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera access error, fallback to file upload:', err);
      setIsCameraActive(false);
      if (fileInputRef.current) fileInputRef.current.click();
    }
  };

  const switchCameraFacing = async () => {
    stopCameraStream();
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
    setTimeout(startCamera, 200);
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    stopCameraStream();
    setImagePreview(dataUrl);
    processImage(dataUrl);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCameraStream();
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setImagePreview(dataUrl);
      processImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const tryGetGeolocation = async () => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          };
          setGpsCoords(coords);
          resolve(coords);
        },
        () => resolve(null),
        { timeout: 3000 }
      );
    });
  };

  const processImage = async (imageSrc, bypassQuality = false) => {
    setAnalyzing(true);
    setQualityError(null);
    setPrediction(null);
    setSaveSuccess(false);

    if (!bypassQuality) {
      const quality = await checkImageQuality(imageSrc);
      if (!quality.isPass) {
        setQualityError(quality);
        setAnalyzing(false);
        return;
      }
    }

    try {
      const img = new Image();
      img.src = imageSrc;
      await new Promise(r => { img.onload = r; });

      const result = await classifyLeaf(img, selectedCrop);
      setPrediction(result);

      const gps = await tryGetGeolocation();

      await saveScanRecord({
        thumbnail: imageSrc,
        crop: result.primaryDisease.crop,
        disease: result.primaryDisease.id,
        confidence: result.confidence,
        risk: result.risk,
        isHealthy: result.isHealthy,
        gps: gps,
        timestamp: Date.now()
      });

      setSaveSuccess(true);
    } catch (err) {
      console.error('Scan processing error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRetake = () => {
    setImagePreview(null);
    setPrediction(null);
    setQualityError(null);
    setSaveSuccess(false);
    startCamera();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="btn-touch px-3.5 py-2 rounded-xl border border-farm-200 bg-white hover:bg-farm-50 text-farm-900 text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>{i18n.language === 'kn' ? '← ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ' : '← Back to Home Menu'}</span>
        </button>
        <span className="text-[11px] font-bold text-farm-700 bg-farm-100 px-3 py-1 rounded-lg">
          {i18n.language === 'kn' ? 'ಪ್ರತ್ಯೇಕ ಪುಟ: 1. ಎಲೆ ಸ್ಕ್ಯಾನರ್' : 'Dedicated Page: 1. Leaf Scanner'}
        </span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-farm-900 leading-tight">
          {t('scan.title', 'Scan Crop Leaf')}
        </h1>
        <p className="text-xs text-gray-600 mt-0.5">
          {t('scan.subtitle', 'Take a photo or upload an image of the affected leaf')}
        </p>
      </div>

      {/* Full Responsive 2-Column Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Viewfinder & Camera Controls */}
        <div className="lg:col-span-6 space-y-4">
          {/* Viewport: Live Camera / Captured Image Preview / Empty State */}
          <div className="farm-card rounded-3xl overflow-hidden bg-gray-900 border border-gray-300 relative aspect-[4/3] flex items-center justify-center shadow-inner">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* 1. Live Camera Stream */}
            {isCameraActive && (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-8 border-2 border-dashed border-white/60 rounded-3xl pointer-events-none flex items-center justify-center">
                  <span className="text-[11px] bg-black/50 text-white px-3 py-1 rounded-full backdrop-blur-sm">
                    {t('scan.alignLeaf', 'Align leaf inside frame')}
                  </span>
                </div>

                <div className="absolute bottom-3 left-0 right-0 px-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={switchCameraFacing}
                    className="btn-touch w-11 h-11 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm"
                    title={t('scan.switchCamera', 'Switch Camera')}
                  >
                    <RotateCcw size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={capturePhotoFromCamera}
                    className="btn-touch w-16 h-16 rounded-full bg-white border-4 border-farm-600 shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
                    title={t('scan.capture', 'Snap Photo')}
                  >
                    <div className="w-12 h-12 rounded-full bg-farm-800" />
                  </button>

                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="btn-touch px-3 py-2 rounded-xl bg-black/60 text-white text-xs font-bold backdrop-blur-sm"
                  >
                    {t('scan.cancel', 'Cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* 2. Photo Preview */}
            {!isCameraActive && imagePreview && (
              <div className="relative w-full h-full bg-black">
                <img
                  src={imagePreview}
                  alt="Leaf Preview"
                  className="w-full h-full object-contain"
                />

                {analyzing && (
                  <div className="absolute inset-0 bg-farm-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center text-white">
                    <RefreshCw size={36} className="text-farm-400 animate-spin mb-3" />
                    <h4 className="text-sm font-extrabold">{t('scan.analyzing', 'Analyzing leaf with on-device AI...')}</h4>
                    <p className="text-[11px] text-farm-200 mt-1">{t('scan.analyzingSubtitle')}</p>
                  </div>
                )}
              </div>
            )}

            {/* 3. Empty Capture Prompt */}
            {!isCameraActive && !imagePreview && (
              <div className="p-6 text-center text-gray-300 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gray-800 text-farm-400 flex items-center justify-center mx-auto shadow-inner">
                  <Camera size={32} />
                </div>
                <div>
                  <p className="text-xs text-gray-300 font-medium">
                    {t('scan.tapPrompt', 'Tap a button below to photograph or upload a leaf photo')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Main Action Buttons */}
          {!isCameraActive && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={startCamera}
                className="btn-touch py-3.5 px-4 rounded-2xl bg-farm-800 hover:bg-farm-900 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2"
              >
                <Camera size={20} />
                <span>{t('scan.cameraBtn', 'Use Camera')}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-touch py-3.5 px-4 rounded-2xl bg-white hover:bg-gray-50 text-farm-900 border-2 border-farm-700 font-extrabold text-sm shadow-sm flex items-center justify-center gap-2"
              >
                <Upload size={20} />
                <span>{t('scan.uploadBtn', 'Upload Photo')}</span>
              </button>
            </div>
          )}

          {/* Quality Check Error & Image Rejection Card */}
          {qualityError && !analyzing && (
            <div className="farm-card rounded-3xl p-5 bg-rose-50 border-2 border-rose-400 space-y-3.5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-rose-700" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-rose-950">
                    {t('scan.imageRejectedTitle', 'Image Rejected: Please Upload a Clearer Photo')}
                  </h4>
                  <p className="text-xs text-rose-900 leading-relaxed mt-1 font-medium">
                    {qualityError.reason === 'blurry' && (
                      i18n.language === 'kn'
                        ? 'ಚಿತ್ರವು ತುಂಬಾ ಅಸ್ಪಷ್ಟವಾಗಿದೆ (ಮಸಕು). ಕ್ಯಾಮೆರಾವನ್ನು ನಡುಗಿಸದೆ ಎಲೆಯ ಮೇಲೆ ಕೇಂದ್ರೀಕರಿಸಿ (Focus) ಮತ್ತೊಮ್ಮೆ ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ.'
                        : 'The photo is blurry or out of focus. Please hold your device steady and tap to focus on the leaf veins.'
                    )}
                    {qualityError.reason === 'dark' && (
                      i18n.language === 'kn'
                        ? 'ಚಿತ್ರದಲ್ಲಿ ಬೆಳಕು ತುಂಬಾ ಕಡಿಮೆಯಾಗಿದೆ (ಕತ್ತಲೆ). ಸ್ಪಷ್ಟ ರೋಗನಿರ್ಣಯಕ್ಕಾಗಿ ನೈಸರ್ಗಿಕ ಸೂರ್ಯನ ಬೆಳಕಿನಲ್ಲಿ ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ.'
                        : 'The photo is too dark. Please capture the leaf outdoors in good natural daylight.'
                    )}
                    {qualityError.reason === 'bright' && (
                      i18n.language === 'kn'
                        ? 'ಚಿತ್ರವು ಅತಿಯಾದ ಬೆಳಕು ಅಥವಾ ಫ್ಲ್ಯಾಷ್ ಬೆಳಕಿನಿಂದ ಕೂಡಿದೆ. ಫ್ಲ್ಯಾಷ್ ಆಫ್ ಮಾಡಿ ಸ್ಪಷ್ಟ ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ.'
                        : 'The photo has severe flash glare or overexposure. Avoid direct flash and snap under ambient daylight.'
                    )}
                    {qualityError.reason === 'low_contrast' && (
                      i18n.language === 'kn'
                        ? 'ಚಿತ್ರದಲ್ಲಿ ಸ್ಪಷ್ಟತೆ ಮತ್ತು ಕಾಂಟ್ರಾಸ್ಟ್ ಕೊರತೆಯಿದೆ. ಎಲೆಯನ್ನು ತಟಸ್ಥ ಹಿನ್ನೆಲೆಯಲ್ಲಿ ಹಿಡಿದು ಫೋಟೋ ತೆಗೆಯಿರಿ.'
                        : 'The photo lacks contrast or clarity. Place the leaf against a plain surface and snap again.'
                    )}
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="btn-touch w-full py-3 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow"
                >
                  <RotateCcw size={16} />
                  <span>{t('scan.retake', 'Take / Upload Clearer Photo')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Scan Saved Notification */}
          {saveSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>{t('scan.savedSuccess', 'Scan saved to local storage!')}</span>
              </div>
              {gpsCoords && (
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <MapPin size={11} />
                  <span>{t('scan.gpsCaptured', 'GPS')}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Crop Filter & Diagnosis Results */}
        <div className="lg:col-span-6 space-y-4">
          {/* Crop Selector Image Tiles */}
          <div className="farm-card rounded-2xl p-4 bg-white border border-gray-200 shadow-sm">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
              {t('scan.filterCropLabel', 'Select Crop (Optional)')}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {CROPS.map((crop) => {
                const isSelected = selectedCrop === crop.id;
                const labelText = crop.id === 'all'
                  ? t('scan.allCrops', 'Auto-detect')
                  : t(`crops.${crop.id}`, crop.id);

                return (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => setSelectedCrop(crop.id)}
                    className={`btn-touch flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-farm-800 bg-farm-100/90 text-farm-900 ring-2 ring-farm-600/30 font-bold shadow-sm'
                        : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:border-farm-300'
                    }`}
                  >
                    <span className="text-xl mb-0.5">{crop.emoji}</span>
                    <span className="text-[10px] leading-tight truncate w-full px-0.5">
                      {labelText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Card */}
          {prediction && !analyzing ? (
            <ResultCard
              prediction={prediction}
              onRetake={handleRetake}
            />
          ) : (
            <div className="farm-card rounded-3xl p-8 bg-white border border-farm-200 text-center space-y-3 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-farm-100 text-farm-800 flex items-center justify-center mx-auto text-2xl">
                🔬
              </div>
              <h3 className="text-base font-bold text-gray-900">Diagnosis Awaiting Leaf Photo</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Take a photo or upload an image on the left. The on-device neural model will analyze the leaf for diseases and provide organic & chemical recipes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
