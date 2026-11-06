import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  AlertTriangle,
  Radio,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Leaf,
  ArrowLeft,
  Volume2,
  Calendar,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Filter,
  EyeOff,
  Navigation,
  Globe,
  HelpCircle,
  Clock,
  Compass
} from 'lucide-react';
import { getFarmerProfile } from '../services/db';
import { playAudio, playChime, stopAudio } from '../services/voice';
import { detectSpreadingHotspots, DISEASE_COLORS } from '../services/hotspotDetection';
import casesData from '../data/cases.json';

export default function OutbreaksMap() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const isKn = i18n.language === 'kn';

  // Map state
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);
  const tileLayerRefs = useRef({
    satellite: null,
    labels: null,
    street: null
  });

  const [baseMapType, setBaseMapType] = useState('satellite'); // 'satellite' | 'street'
  const [satelliteFallback, setSatelliteFallback] = useState(false);

  // Filters state
  const [selectedDiseaseFilter, setSelectedDiseaseFilter] = useState('all');
  const [selectedDateRangeDays, setSelectedDateRangeDays] = useState(14);
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);

  // Hotspots computed from the spread detection algorithm
  const [hotspots, setHotspots] = useState([]);
  const [isSpeakingAlert, setIsSpeakingAlert] = useState(false);

  // Run spread detection function
  useEffect(() => {
    const detected = detectSpreadingHotspots(casesData.cases, {
      dateRangeDays: selectedDateRangeDays,
      diseaseFilter: selectedDiseaseFilter
    });
    setHotspots(detected);

    if (detected.length > 0 && !selectedHotspotId) {
      setSelectedHotspotId(detected[0].id);
    }
  }, [selectedDiseaseFilter, selectedDateRangeDays]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Leaflet map centered over Karnataka agricultural zone
    const map = L.map(mapContainerRef.current, {
      center: [13.2, 76.7],
      zoom: 7,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: true
    });

    mapInstanceRef.current = map;

    // 1. Esri World Imagery (Satellite) TileLayer
    const esriSatellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }
    );

    // Esri Place Labels & Boundaries Overlay
    const esriLabels = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        attribution: 'Labels &copy; Esri'
      }
    );

    // 2. OpenStreetMap (Street Map) TileLayer for Toggle and Fallback
    const streetMap = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }
    );

    // Satellite tile error detection with automatic fallback to Street Map
    esriSatellite.on('tileerror', () => {
      console.warn('Satellite tiles error or offline, falling back to street map.');
      setSatelliteFallback(true);
      setBaseMapType('street');
      if (map.hasLayer(esriSatellite)) map.removeLayer(esriSatellite);
      if (map.hasLayer(esriLabels)) map.removeLayer(esriLabels);
      if (!map.hasLayer(streetMap)) streetMap.addTo(map);
    });

    tileLayerRefs.current = {
      satellite: esriSatellite,
      labels: esriLabels,
      street: streetMap
    };

    // Default: Add satellite + labels overlay
    esriSatellite.addTo(map);
    esriLabels.addTo(map);

    // Create a LayerGroup for dynamic hotspots
    const layerGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Base Map Switching (Satellite vs Street Map)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const { satellite, labels, street } = tileLayerRefs.current;
    if (!map || !satellite || !street) return;

    if (baseMapType === 'satellite') {
      if (map.hasLayer(street)) map.removeLayer(street);
      if (!map.hasLayer(satellite)) satellite.addTo(map);
      if (!map.hasLayer(labels)) labels.addTo(map);
    } else {
      if (map.hasLayer(satellite)) map.removeLayer(satellite);
      if (map.hasLayer(labels)) map.removeLayer(labels);
      if (!map.hasLayer(street)) street.addTo(map);
    }
  }, [baseMapType]);

  // Update Map Markers & Circles when Hotspots or Language Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layersGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Render ONLY spreading hotspots; isolated cases remain completely hidden
    hotspots.forEach((hotspot) => {
      const isSelected = hotspot.id === selectedHotspotId;
      const isRising = hotspot.isRising;

      // 1. Semi-transparent colored circle (size by radius, color by disease)
      const circle = L.circle([hotspot.lat, hotspot.lng], {
        radius: hotspot.radiusMeters,
        color: hotspot.color.stroke,
        weight: isSelected ? 3 : 2,
        opacity: 0.9,
        fillColor: hotspot.color.hex,
        fillOpacity: isSelected ? 0.45 : 0.35
      });

      // 2. Center marker: Pulsing center marker for rising ones
      let centerMarker;
      if (isRising) {
        const pulsingIcon = L.divIcon({
          className: 'custom-pulsing-marker',
          html: `
            <div style="position: relative; width: 28px; height: 28px; display: flex; items-center; justify-content: center;">
              <span class="animate-ping" style="position: absolute; width: 26px; height: 26px; border-radius: 9999px; background-color: ${hotspot.color.hex}; opacity: 0.65;"></span>
              <span style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background-color: ${hotspot.color.hex}; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.45);"></span>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        centerMarker = L.marker([hotspot.lat, hotspot.lng], { icon: pulsingIcon });
      } else {
        const standardIcon = L.divIcon({
          className: 'custom-pulsing-marker',
          html: `
            <div style="width: 14px; height: 14px; border-radius: 9999px; background-color: ${hotspot.color.hex}; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>
          `,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        centerMarker = L.marker([hotspot.lat, hotspot.lng], { icon: standardIcon });
      }

      // Popup Content: Disease, cases this week vs last week, trend, first & last seen, and short tip
      const diseaseName = isKn ? hotspot.diseaseNameKn : hotspot.diseaseNameEn;
      const trendLabel = isRising
        ? (isKn ? `↗ ಏರುತ್ತಿದೆ (+${hotspot.casesThisWeek - hotspot.casesLastWeek})` : `↗ Rising (+${hotspot.casesThisWeek - hotspot.casesLastWeek})`)
        : (isKn ? 'ಸ್ಥಿರ' : 'Stable');

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; color: #1f2937; line-height: 1.4; min-width: 240px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 6px;">
            <strong style="color: ${hotspot.color.hex}; font-size: 13px; text-transform: uppercase;">${diseaseName}</strong>
            <span style="font-size: 10px; font-weight: 900; background: ${hotspot.color.hex}; color: #ffffff; padding: 2px 6px; border-radius: 6px;">
              ${isRising ? (isKn ? 'ತೀವ್ರ ಏರಿಕೆ' : 'RISING') : (isKn ? 'ಸಕ್ರಿಯ' : 'ACTIVE')}
            </span>
          </div>

          <div style="font-size: 11px; font-weight: bold; color: #374151; margin-bottom: 6px;">
            📍 ${hotspot.village} (${hotspot.crop.toUpperCase()})
          </div>

          <div style="background: #f9fafb; padding: 6px 8px; border-radius: 8px; border: 1px solid #f3f4f6; margin-bottom: 6px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span><b>${isKn ? 'ಈ ವಾರ' : 'This Week'}:</b> <span style="color: #b91c1c; font-weight: 900;">${hotspot.casesThisWeek} ${isKn ? 'ಪ್ರಕರಣ' : 'cases'}</span></span>
              <span><b>${isKn ? 'ಕಳೆದ ವಾರ' : 'Last Week'}:</b> ${hotspot.casesLastWeek} ${isKn ? 'ಪ್ರಕರಣ' : 'cases'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span><b>${isKn ? 'ಪ್ರವೃತ್ತಿ' : 'Trend'}:</b> ${trendLabel}</span>
              <span><b>${isKn ? 'ವ್ಯಾಪ್ತಿ' : 'Radius'}:</b> ~${hotspot.radiusKm} km</span>
            </div>
          </div>

          <div style="font-size: 10px; color: #6b7280; margin-bottom: 6px;">
            <b>${isKn ? 'ಮೊದಲು ಕಂಡ ದಿನ' : 'First seen'}:</b> ${hotspot.firstSeen} • <b>${isKn ? 'ಕೊನೆಗೆ ಕಂಡ ದಿನ' : 'Last seen'}:</b> ${hotspot.lastSeen}
          </div>

          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 6px 8px; border-radius: 8px; font-size: 11px; color: #065f46;">
            💡 <b>${isKn ? 'ಚಿಕಿತ್ಸಾ ಸಲಹೆ' : 'Short Tip'}:</b> ${isKn ? hotspot.tip.kn : hotspot.tip.en}
          </div>
        </div>
      `;

      circle.bindPopup(popupHtml, { maxWidth: 300 });
      centerMarker.bindPopup(popupHtml, { maxWidth: 300 });

      circle.on('click', () => setSelectedHotspotId(hotspot.id));
      centerMarker.on('click', () => setSelectedHotspotId(hotspot.id));

      circle.addTo(layerGroup);
      centerMarker.addTo(layerGroup);
    });
  }, [hotspots, selectedHotspotId, isKn]);

  // Fly to hotspot when clicked from side panel
  const handleFlyToHotspot = (hotspot) => {
    setSelectedHotspotId(hotspot.id);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([hotspot.lat, hotspot.lng], 12, {
        animate: true,
        duration: 1.2
      });
    }
  };

  const handleVoiceBroadcast = () => {
    stopAudio();
    setIsSpeakingAlert(true);
    playChime('listen');

    const topHotspot = hotspots[0];
    if (!topHotspot) return;

    const disName = isKn ? topHotspot.diseaseNameKn : topHotspot.diseaseNameEn;
    const speech = isKn
      ? `ಎಚ್ಚರಿಕೆ! ${topHotspot.village} ಭಾಗದಲ್ಲಿ ${disName} ರೋಗ ವೇಗವಾಗಿ ಹರಡುತ್ತಿದೆ. ಈ ವಾರ ${topHotspot.casesThisWeek} ಪ್ರಕರಣಗಳು ದೃಢಪಟ್ಟಿವೆ. ಸಲಹೆ: ${topHotspot.tip.kn}`
      : `Regional Outbreak Alert! ${disName} is actively spreading near ${topHotspot.village} with ${topHotspot.casesThisWeek} confirmed cases this week. Recommended action: ${topHotspot.tip.en}`;

    playAudio('outbreak_hotspot_alert', speech, i18n.language);
    setTimeout(() => setIsSpeakingAlert(false), 8000);
  };

  const activeHotspot = hotspots.find((h) => h.id === selectedHotspotId) || hotspots[0];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-farm-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="btn-touch p-2.5 rounded-2xl bg-white border border-farm-200 text-farm-800 hover:bg-farm-50 transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-bold"
            title="Return to Home Menu"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{t('nav.home', 'Home Menu')}</span>
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                {t('mapHotspots.title', 'Satellite Outbreak Map')}
              </span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                ℹ️ {t('villages.sampleDataBadge', 'Sample data for demo')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {isKn ? 'ಉಪಗ್ರಹ ರೋಗ ಹರಡುವಿಕೆ & ಹಾಟ್‌ಸ್ಪಾಟ್ ನಕ್ಷೆ' : 'Satellite Outbreak & Spreading Hotspot Map'}
            </h1>
          </div>
        </div>

        {/* Listen Audio Alert Button */}
        {hotspots.length > 0 && (
          <button
            type="button"
            onClick={handleVoiceBroadcast}
            className="btn-touch px-4 py-2 rounded-2xl bg-rose-800 text-white font-bold text-xs shadow-md hover:bg-rose-900 transition-colors flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <Volume2 size={16} className={isSpeakingAlert ? 'animate-pulse' : ''} />
            <span>{isKn ? 'ಧ್ವನಿ ಎಚ್ಚರಿಕೆ ಆಲಿಸಿ' : 'Listen Outbreak Audio'}</span>
          </button>
        )}
      </div>

      {/* MANDATORY EXPLICIT NOTE (Requirement 6) */}
      <div className="p-3 bg-emerald-50/80 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-950 flex items-center gap-2.5 shadow-2xs">
        <Info size={16} className="text-emerald-700 shrink-0" />
        <span className="leading-relaxed">
          {t('mapHotspots.backgroundNote', 'Satellite image is the background map only. Outbreak locations come from farmer leaf scans.')}
        </span>
      </div>

      {/* FILTER & LAYER TOGGLE BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-farm-200 shadow-2xs">
        {/* Left: Disease & Date Range Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-farm-700" />
            <select
              value={selectedDiseaseFilter}
              onChange={(e) => setSelectedDiseaseFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-farm-300 bg-farm-50 text-xs font-bold text-farm-900 focus:outline-hidden focus:ring-2 focus:ring-farm-600 cursor-pointer"
            >
              <option value="all">{t('mapHotspots.allDiseases', 'All Diseases')}</option>
              <option value="tomato_late_blight">Tomato Late Blight</option>
              <option value="tomato_early_blight">Tomato Early Blight</option>
              <option value="rice_blast">Rice Blast</option>
              <option value="maize_fall_armyworm">Maize Fall Armyworm</option>
              <option value="potato_early_blight">Potato Early Blight</option>
              <option value="chilli_leaf_curl">Chilli Leaf Curl</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-farm-50 p-1 rounded-xl border border-farm-200 text-xs font-bold">
            <Calendar size={13} className="text-farm-700 ml-1" />
            {[
              { days: 14, label: t('mapHotspots.days14', 'Last 14d') },
              { days: 7, label: t('mapHotspots.days7', 'Last 7d') },
              { days: 3, label: t('mapHotspots.days3', 'Last 3d') }
            ].map((range) => (
              <button
                key={range.days}
                type="button"
                onClick={() => setSelectedDateRangeDays(range.days)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedDateRangeDays === range.days
                    ? 'bg-farm-800 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Base Map Layer Toggle (Satellite vs Street Map) */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-gray-500 uppercase">
            <Layers size={13} className="inline mr-1" />
            {isKn ? 'ನಕ್ಷೆ ಪ್ರಕಾರ:' : 'Base Layer:'}
          </span>
          <div className="flex items-center gap-1 bg-farm-50 p-1 rounded-xl border border-farm-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setBaseMapType('satellite')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                baseMapType === 'satellite'
                  ? 'bg-farm-800 text-white shadow-xs'
                  : 'text-gray-700 hover:text-farm-900'
              }`}
            >
              <span>🛰️</span>
              <span>{t('mapHotspots.layerSatellite', 'Satellite (Esri)')}</span>
            </button>

            <button
              type="button"
              onClick={() => setBaseMapType('street')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                baseMapType === 'street'
                  ? 'bg-farm-800 text-white shadow-xs'
                  : 'text-gray-700 hover:text-farm-900'
              }`}
            >
              <span>🗺️</span>
              <span>{t('mapHotspots.layerStreet', 'Street Map')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fallback Notice Banner if satellite tiles failed */}
      {satelliteFallback && (
        <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber-700" />
          <span>{t('mapHotspots.layerFallbackNotice', 'Satellite tiles unreachable, falling back to street map')}</span>
        </div>
      )}

      {/* 2-COLUMN RESPONSIVE LAYOUT: MAP (LEFT) & ACTIVE HOTSPOTS SIDE PANEL (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Leaflet Satellite Map */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          <div className="farm-card rounded-3xl p-4 bg-white border border-farm-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600">
              <span className="flex items-center gap-1.5">
                <Compass size={15} className="text-farm-700" />
                <span>{hotspots.length} {isKn ? 'ಸಕ್ರಿಯ ಹರಡುವ ಕೇಂದ್ರಗಳು' : 'Spreading Hotspots Active'}</span>
              </span>

              <span className="text-[11px] text-gray-500 font-medium">
                {t('mapHotspots.hiddenNotice', 'Isolated cases (< 5 cases or no weekly growth) are hidden automatically.')}
              </span>
            </div>

            {/* LEAFLET MAP CONTAINER */}
            <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border-2 border-farm-200 shadow-inner">
              <div
                ref={mapContainerRef}
                className="w-full h-full z-0 select-none"
              />

              {/* Pulsing Legend Badge overlay on map */}
              <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-bold text-gray-800 shadow-md border border-gray-200 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                </span>
                <span>{t('mapHotspots.risingIndicator', 'Pulsing marker = Rising outbreak (this week > last week)')}</span>
              </div>
            </div>

            {/* Disease Color Legend Bar */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pt-1 text-xs">
              <span className="font-extrabold text-gray-700 uppercase tracking-wider text-[10px] shrink-0">
                {t('mapHotspots.legendTitle', 'Disease Outbreak Legend')}:
              </span>
              {Object.entries(DISEASE_COLORS).filter(([k]) => k !== 'default').map(([key, col]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold shrink-0 bg-white"
                  style={{ borderColor: col.stroke, color: col.stroke }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.hex }} />
                  <span>{isKn ? col.nameKn : col.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: SIDE PANEL LISTING ACTIVE HOTSPOTS SORTED BY CASE COUNT */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3">
          <div className="farm-card rounded-3xl p-5 bg-white border border-farm-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div>
                <h2 className="text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={18} className="text-rose-600" />
                  <span>{t('mapHotspots.activeHotspotsList', 'Active Spreading Hotspots')}</span>
                </h2>
                <span className="text-[11px] text-gray-500 font-medium">
                  {isKn ? 'ಪ್ರಕರಣಗಳ ಸಂಖ್ಯೆಯ ಆಧಾರದಲ್ಲಿ ವಿಂಗಡಿಸಲಾಗಿದೆ' : 'Sorted by case count (14-day window)'}
                </span>
              </div>

              <span className="text-xs font-black text-rose-800 bg-rose-100 px-2.5 py-1 rounded-xl">
                {hotspots.length}
              </span>
            </div>

            {/* HOTSPOTS CARDS LIST */}
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1 no-scrollbar">
              {hotspots.length === 0 ? (
                /* EMPTY STATE: "No spreading outbreaks found" */
                <div className="p-8 text-center rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <EyeOff size={32} className="mx-auto text-gray-400" />
                  <h3 className="text-sm font-black text-gray-800">
                    {t('mapHotspots.noHotspotsFound', 'No spreading outbreaks found')}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                    {isKn
                      ? 'ಆಯ್ಕೆಮಾಡಿದ ಫಿಲ್ಟರ್‌ನಲ್ಲಿ ಯಾವುದೇ ರೋಗವು ಹರಡುವ ಮಾನದಂಡಗಳನ್ನು ತಲುಪಿಲ್ಲ. ಪ್ರತ್ಯೇಕ ಒಂಟಿ ಪ್ರಕರಣಗಳು ಸುರಕ್ಷಿತವಾಗಿ ಮರೆಮಾಡಲ್ಪಟ್ಟಿವೆ.'
                      : 'No disease clusters in this filter meet the spreading hotspot criteria (>=5 cases in 7 days or weekly growth). Isolated cases stay hidden.'}
                  </p>
                </div>
              ) : (
                hotspots.map((h, idx) => {
                  const isSelected = h.id === selectedHotspotId;
                  const disName = isKn ? h.diseaseNameKn : h.diseaseNameEn;

                  return (
                    <div
                      key={h.id}
                      onClick={() => handleFlyToHotspot(h)}
                      className={`btn-touch w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-start items-stretch gap-2.5 ${
                        isSelected
                          ? 'border-farm-800 bg-farm-50/70 shadow-md ring-2 ring-farm-600/30'
                          : 'border-gray-200 bg-white hover:border-farm-300 hover:bg-gray-50'
                      }`}
                    >
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: h.color.hex }}
                            />
                            <h3 className="text-sm font-black text-gray-900 truncate">
                              {disName}
                            </h3>
                          </div>
                          <span className="text-xs text-gray-600 font-bold block mt-0.5">
                            📍 {h.village} ({h.crop})
                          </span>
                        </div>

                        {/* Rising Tag */}
                        <div className="text-right shrink-0">
                          {h.isRising ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping inline-block" />
                              <span>{t('mapHotspots.risingBadge', 'Rising Spread')}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                              {h.trend.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cases breakdown (this week vs last week) */}
                      <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-gray-200 text-xs">
                        <div>
                          <span className="text-[10px] text-gray-500 block">{t('mapHotspots.casesThisWeek', 'This Week')}</span>
                          <span className="text-base font-black text-rose-700">
                            {h.casesThisWeek} {isKn ? 'ಪ್ರಕರಣ' : 'cases'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 block">{t('mapHotspots.casesLastWeek', 'Last Week')}</span>
                          <span className="text-base font-bold text-gray-700">
                            {h.casesLastWeek} {isKn ? 'ಪ್ರಕರಣ' : 'cases'}
                          </span>
                        </div>
                      </div>

                      {/* Dates and Action Tip */}
                      <div className="text-[10px] text-gray-500 flex items-center justify-between">
                        <span>{t('mapHotspots.firstSeen', 'First seen')}: <b>{h.firstSeen}</b></span>
                        <span>{t('mapHotspots.lastSeen', 'Last seen')}: <b>{h.lastSeen}</b></span>
                      </div>

                      {/* Action Tip Box */}
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-950 leading-relaxed font-medium">
                        💡 <b>{t('mapHotspots.actionTip', 'Action Tip')}:</b> {isKn ? h.tip.kn : h.tip.en}
                      </div>

                      {/* Fly To Button */}
                      <div className="flex justify-end pt-1">
                        <span className="text-[11px] font-bold text-farm-800 flex items-center gap-1 hover:underline">
                          <Navigation size={12} />
                          <span>{t('mapHotspots.flyTo', 'Fly to Hotspot')}</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
