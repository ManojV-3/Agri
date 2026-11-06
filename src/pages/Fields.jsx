import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, Layers, Calendar, Compass, Sprout, X, ArrowLeft } from 'lucide-react';
import { getCrops, saveCrop, deleteCrop } from '../services/db';

const CROPS_LIST = ['tomato', 'potato', 'maize', 'rice', 'chilli'];

export default function Fields() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [crop, setCrop] = useState('tomato');
  const [acres, setAcres] = useState(1.5);
  const [sowingDate, setSowingDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    setLoading(true);
    const list = await getCrops();
    setCrops(list);
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setCrop('tomato');
    setAcres(1.0);
    setSowingDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f) => {
    setEditingId(f.id);
    setName(f.name || '');
    setCrop(f.crop || 'tomato');
    setAcres(f.acres || 1.0);
    setSowingDate(f.sowingDate || new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await saveCrop({
      id: editingId,
      name: name.trim(),
      crop,
      acres: Number(acres),
      sowingDate
    });

    setIsModalOpen(false);
    await loadFields();
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('dashboard.deleteConfirmCrop', 'Are you sure you want to delete this field?'))) {
      await deleteCrop(id);
      await loadFields();
    }
  };

  const totalAcres = crops.reduce((sum, c) => sum + (Number(c.acres) || 0), 0);

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
          {i18n.language === 'kn' ? 'ಪ್ರತ್ಯೇಕ ಪುಟ: 3. ಜಮೀನು ನಿರ್ವಹಣೆ' : 'Dedicated Page: 3. Field Plots'}
        </span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-farm-900 leading-tight">
            {t('dashboard.myFields', 'My Registered Fields')}
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">
            {crops.length} field plot(s) registered • {totalAcres} total {t('cost.acres', 'acres')} under cultivation
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="btn-touch px-5 py-2.5 rounded-2xl bg-farm-800 hover:bg-farm-900 text-white font-extrabold text-xs flex items-center gap-2 shadow"
        >
          <Plus size={18} />
          <span>{t('dashboard.addCropBtn', '+ Add Field')}</span>
        </button>
      </div>

      {/* Field Cards Responsive Grid (1 col mobile, 2 col tablet, 3 col desktop) */}
      {crops.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border-2 border-dashed border-farm-200 shadow-sm space-y-3">
          <div className="w-20 h-20 rounded-full bg-farm-100 text-farm-800 flex items-center justify-center mx-auto text-3xl">
            🌱
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">No fields registered yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
              {t('dashboard.noFields', 'Tap below to add your first crop plot!')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-touch px-6 py-3 bg-farm-800 text-white rounded-2xl text-xs font-bold shadow"
          >
            {t('dashboard.addCropBtn', '+ Add Field')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {crops.map((field) => (
            <div
              key={field.id}
              className="farm-card rounded-3xl p-5 bg-white border border-gray-200 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-black text-gray-900 truncate">{field.name}</h3>
                  <span className="text-[11px] font-extrabold text-farm-800 bg-farm-100 px-2.5 py-1 rounded-lg capitalize shrink-0">
                    {t(`crops.${field.crop}`, field.crop)}
                  </span>
                </div>

                <div className="text-xs text-gray-600 space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Compass size={14} className="text-farm-700 shrink-0" />
                    <span className="font-bold text-gray-800">{field.acres} {t('cost.acres', 'acres')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-farm-700 shrink-0" />
                    <span>{t('dashboard.sownOn', { date: field.sowingDate })}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                  Active Plot
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(field)}
                    className="btn-touch p-2 text-gray-600 hover:text-farm-800 rounded-xl"
                    title={t('dashboard.editField', 'Edit Field')}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(field.id)}
                    className="btn-touch p-2 text-gray-400 hover:text-rose-600 rounded-xl"
                    title={t('dashboard.deleteField', 'Delete Field')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Field Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSave}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-farm-300 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3 border-gray-200">
              <h3 className="text-base font-extrabold text-farm-900">
                {editingId ? t('dashboard.fieldModal.titleEdit') : t('dashboard.fieldModal.titleAdd')}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-touch p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('dashboard.fieldModal.fieldName')}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('dashboard.fieldModal.fieldNamePlaceholder')}
                className="w-full btn-touch px-3 py-2 text-xs font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('dashboard.fieldModal.crop')}
              </label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full btn-touch px-3 py-2 text-xs font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-600 capitalize"
              >
                {CROPS_LIST.map((c) => (
                  <option key={c} value={c}>
                    {t(`crops.${c}`, c)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('dashboard.fieldModal.acres')}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={acres}
                onChange={(e) => setAcres(e.target.value)}
                className="w-full btn-touch px-3 py-2 text-xs font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('dashboard.fieldModal.sowingDate')}
              </label>
              <input
                type="date"
                required
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
                className="w-full btn-touch px-3 py-2 text-xs font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-touch py-2.5 px-3 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50"
              >
                {t('dashboard.fieldModal.cancel')}
              </button>
              <button
                type="submit"
                className="btn-touch py-2.5 px-3 rounded-xl bg-farm-800 hover:bg-farm-900 text-white font-bold text-xs shadow"
              >
                {t('dashboard.fieldModal.save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
