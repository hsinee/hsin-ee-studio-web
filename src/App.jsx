import React, { useEffect, useState } from 'react';
import Booking from './Booking.jsx';
import Admin from './Admin.jsx';
import { SettingsContext, loadSettings } from './settings.js';

export default function App() {
  const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin';
  return isAdmin ? <Admin /> : <PublicSite />;
}

// 客人看到的預約頁：先讀取後台設定，讀不到就用預設內容
function PublicSite() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    loadSettings().then(({ settings: s }) => setSettings(s));
  }, []);

  if (!settings) {
    return (
      <div className="page-loading">
        <img src="/logo.png" alt="" />
      </div>
    );
  }
  return (
    <SettingsContext.Provider value={settings}>
      <Booking />
    </SettingsContext.Provider>
  );
}
