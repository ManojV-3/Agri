import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import AudioCaptionPlayer from './components/AudioCaptionPlayer';
import OfflineDownloadModal from './components/OfflineDownloadModal';

// Dedicated Separate Pages
import WelcomeLanguage from './pages/WelcomeLanguage';
import Login from './pages/Login';
import HomeHub from './pages/HomeHub';
import Scan from './pages/Scan';
import Cost from './pages/Cost';
import Fields from './pages/Fields';
import Analytics from './pages/Analytics';
import SolutionsGuide from './pages/SolutionsGuide';
import Profile from './pages/Profile';
import OutbreaksMap from './pages/OutbreaksMap';
import VillageAlerts from './pages/VillageAlerts';
import DataNotes from './pages/DataNotes';

import { getSetting, setSetting, getFarmerProfile } from './services/db';
import { initSyncService } from './services/sync';
import { detectAvailableVoices } from './services/voice';

export default function App() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [farmer, setFarmer] = useState(null);
  const [loadingStartup, setLoadingStartup] = useState(true);
  const [hasChosenLang, setHasChosenLang] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  useEffect(() => {
    checkAppStartup();
    initSyncService((isOnline) => {
      console.log(`[CropCare] Network state changed: online = ${isOnline}`);
    });
    detectAvailableVoices();
  }, []);

  const checkAppStartup = async () => {
    try {
      const profile = await getFarmerProfile();
      setFarmer(profile);

      const langChosen = (await getSetting('language_chosen')) || localStorage.getItem('cropcare_lang_chosen');
      if (langChosen) {
        setHasChosenLang(true);
      }

      const offlineDownloaded = (await getSetting('offline_ready')) || localStorage.getItem('cropcare_offline_downloaded');
      if (!offlineDownloaded && langChosen) {
        setShowOfflineModal(true);
      }
    } catch (err) {
      console.warn('Error during startup checks:', err);
    } finally {
      setLoadingStartup(false);
    }
  };

  const handleLanguageChosen = (code) => {
    setHasChosenLang(true);
    localStorage.setItem('cropcare_lang_chosen', 'true');
    setSetting('language_chosen', true);

    const offlineDownloaded = localStorage.getItem('cropcare_offline_downloaded');
    if (!offlineDownloaded) {
      setShowOfflineModal(true);
    }
  };

  const handleLoginSuccess = (profile) => {
    setFarmer(profile);
  };

  const handleLogout = () => {
    setFarmer(null);
  };

  const isStartingOrAuthPage =
    location.pathname === '/' ||
    location.pathname === '/welcome' ||
    location.pathname === '/language' ||
    location.pathname === '/login';

  return (
    <div className="min-h-screen bg-[#F8FAF6] text-[#1A2E1C] flex flex-col font-kannada antialiased">
      {/* Universal Sticky Header (Full Desktop Top Bar) */}
      <Header onOpenLanguagePicker={() => navigate('/welcome')} />

      {/* Main Content Area - Full Responsive Desktop & Mobile Container */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 ${isStartingOrAuthPage ? 'pb-12' : 'pb-24 md:pb-12'}`}>
        {!loadingStartup && (
          <Routes>
            {/* 1. Starting Page: Choice of Language */}
            <Route
              path="/"
              element={<WelcomeLanguage onLanguageChosen={handleLanguageChosen} />}
            />
            <Route
              path="/welcome"
              element={<WelcomeLanguage onLanguageChosen={handleLanguageChosen} />}
            />
            <Route
              path="/language"
              element={<WelcomeLanguage onLanguageChosen={handleLanguageChosen} />}
            />

            {/* 2. Step 2: Farmer Login & Setup Page */}
            <Route
              path="/login"
              element={<Login onLoginSuccess={handleLoginSuccess} />}
            />

            {/* 3. Step 3: Main Page / Dashboard */}
            <Route
              path="/home"
              element={<HomeHub />}
            />

            {/* 4. Dedicated Leaf Disease Scanner Page */}
            <Route
              path="/scan"
              element={<Scan />}
            />

            {/* 5. Dedicated Treatment Cost Calculator Page */}
            <Route
              path="/cost"
              element={<Cost />}
            />

            {/* 6. Dedicated Crop Fields & Plots Page */}
            <Route
              path="/fields"
              element={<Fields />}
            />

            {/* 7. Dedicated Farm Health History & Analytics Page */}
            <Route
              path="/analytics"
              element={<Analytics />}
            />

            {/* 8. Dedicated Crop Disease Encyclopedia Guide Page */}
            <Route
              path="/solutions"
              element={<SolutionsGuide />}
            />

            {/* 9. Dedicated Farmer Profile & Offline Settings Page */}
            <Route
              path="/profile"
              element={<Profile onProfileUpdated={setFarmer} onLogout={handleLogout} />}
            />

            {/* 10. Dedicated Regional Outbreak Alerts & Loss Map Page */}
            <Route
              path="/outbreaks"
              element={<OutbreaksMap />}
            />
            {/* 11. Dedicated Village-Level Early Warning Alerts Page */}
            <Route
              path="/alerts"
              element={<VillageAlerts />}
            />
            {/* 12. Dedicated Data Notes & Methodology Page */}
            <Route
              path="/data-notes"
              element={<DataNotes />}
            />

            {/* Fallback Redirect */}
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        )}
      </main>

      {/* Spoken Audio Caption Bar */}
      <AudioCaptionPlayer />

      {/* Bottom Navigation for Mobile (Hidden on Desktop & Auth/Welcome pages) */}
      {!isStartingOrAuthPage && farmer && <BottomNav />}

      {/* First-Launch Offline Precache Modal */}
      <OfflineDownloadModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
      />
    </div>
  );
}
