import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Camera, Calculator, Layers, Activity } from 'lucide-react';

export default function BottomNav() {
  const { t } = useTranslation();

  const navItems = [
    {
      to: '/home',
      label: t('nav.home', 'Home'),
      icon: Home
    },
    {
      to: '/fields',
      label: t('nav.fields', 'My Fields'),
      icon: Layers
    },
    {
      to: '/scan',
      label: t('nav.scan', 'Scan'),
      icon: Camera,
      primary: true
    },
    {
      to: '/cost',
      label: t('nav.cost', 'Cost'),
      icon: Calculator
    },
    {
      to: '/analytics',
      label: t('nav.analytics', 'History'),
      icon: Activity
    }
  ];

  return (
    // Hidden on desktop (md:hidden) where top nav is active!
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-farm-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="max-w-md mx-auto grid grid-cols-5 px-1 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `btn-touch flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-farm-900 font-bold bg-farm-100/70'
                    : 'text-gray-500 hover:text-farm-700 active:bg-gray-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`relative p-1 rounded-xl transition-transform ${
                      item.primary
                        ? isActive
                          ? 'bg-farm-800 text-white shadow-md scale-105'
                          : 'bg-farm-700 text-white shadow'
                        : isActive
                        ? 'text-farm-800'
                        : 'text-gray-600'
                    }`}
                  >
                    <Icon size={item.primary ? 22 : 19} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span
                    className={`text-[10px] mt-0.5 leading-tight text-center truncate max-w-full px-0.5 ${
                      isActive ? 'font-extrabold text-farm-900' : 'font-medium'
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
