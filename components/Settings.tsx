
import React, { useState } from 'react';
import { Language, User } from '../types';
import { DICTIONARY } from '../constants';
import { Bell, Shield, Globe, Monitor, Smartphone, Volume2, Lock, Eye, Save, Check, Briefcase, Calculator } from 'lucide-react';

interface SettingsProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  currentUser: User;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  compactMode: boolean;
  setCompactMode: (value: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
    language, 
    setLanguage, 
    currentUser,
    darkMode,
    setDarkMode,
    compactMode,
    setCompactMode
}) => {
  const t = DICTIONARY[language];
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'accounting'>('general');
  const [saved, setSaved] = useState(false);

  // Mock Settings State for other values
  const [settings, setSettings] = useState({
      emailNotifs: true,
      pushNotifs: true,
      sound: true,
      twoFactor: true,
      sessionTimeout: '30',
      defaultCurrency: 'EUR',
      fiscalYearEnd: '12-31'
  });

  const handleSave = () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
  };

  const toggleMock = (key: keyof typeof settings) => {
      setSettings(prev => ({ ...prev, [key]: !prev[key as any] }));
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white">{t.settings}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t.manage_prefs}</p>
            </div>
            {saved && (
                <div className="flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg animate-[fadeIn_0.3s]">
                    <Check className="w-4 h-4 mr-2" />
                    <span className="font-bold text-sm">{t.saved_success}</span>
                </div>
            )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
            {/* Settings Sidebar */}
            <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-850 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 p-4">
                <nav className="space-y-1">
                    <button 
                        onClick={() => setActiveTab('general')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'general' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        <Monitor className="w-4 h-4 mr-3" />
                        {t.general_appearance}
                    </button>
                    <button 
                        onClick={() => setActiveTab('accounting')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'accounting' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        <Briefcase className="w-4 h-4 mr-3" />
                        {t.accounting_prefs}
                    </button>
                    <button 
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'notifications' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        <Bell className="w-4 h-4 mr-3" />
                        {t.notifications}
                    </button>
                    <button 
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'security' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        <Shield className="w-4 h-4 mr-3" />
                        {t.security_privacy}
                    </button>
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8">
                
                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                    <div className="space-y-8 animate-[fadeIn_0.3s]">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                                <Globe className="w-5 h-5 mr-2 text-blue-500" /> {t.language_select}
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {['PL', 'TR', 'NL'].map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => setLanguage(lang as Language)}
                                        className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                                            language === lang 
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                                            : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                                        }`}
                                    >
                                        {lang === 'PL' ? 'Polski' : lang === 'TR' ? 'Türkçe' : 'Nederlands'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                                <Eye className="w-5 h-5 mr-2 text-purple-500" /> Display
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-700 dark:text-slate-200">{t.dark_mode}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{t.easier_eyes}</p>
                                    </div>
                                    <button 
                                        onClick={() => setDarkMode(!darkMode)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${darkMode ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-700 dark:text-slate-200">{t.compact_mode}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{t.more_data}</p>
                                    </div>
                                    <button 
                                        onClick={() => setCompactMode(!compactMode)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${compactMode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${compactMode ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ACCOUNTING PREFS TAB */}
                {activeTab === 'accounting' && (
                     <div className="space-y-8 animate-[fadeIn_0.3s]">
                         <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                                <Calculator className="w-5 h-5 mr-2 text-emerald-500" /> {t.accounting_prefs}
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 text-sm mb-2">{t.default_currency}</label>
                                    <select 
                                        value={settings.defaultCurrency}
                                        onChange={(e) => setSettings({...settings, defaultCurrency: e.target.value})}
                                        className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                                    >
                                        <option value="EUR">EUR (€)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="PLN">PLN (zł)</option>
                                        <option value="TRY">TRY (₺)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 text-sm mb-2">{t.fiscal_year}</label>
                                    <input 
                                        type="date" 
                                        value={`2023-${settings.fiscalYearEnd}`} // Mock year for input
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if(val) setSettings({...settings, fiscalYearEnd: val.substring(5)});
                                        }}
                                        className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                                    />
                                </div>
                            </div>
                         </div>
                     </div>
                )}

                {/* NOTIFICATIONS TAB */}
                {activeTab === 'notifications' && (
                    <div className="space-y-8 animate-[fadeIn_0.3s]">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                                <Bell className="w-5 h-5 mr-2 text-orange-500" /> {t.notifications}
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-start">
                                    <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg mr-4">
                                        <Monitor className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-bold text-slate-700 dark:text-slate-200">{t.push_notifs}</p>
                                            <button 
                                                onClick={() => toggleMock('pushNotifs')}
                                                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.pushNotifs ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.pushNotifs ? 'translate-x-6' : ''}`} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{t.push_desc}</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg mr-4">
                                        <Smartphone className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-bold text-slate-700 dark:text-slate-200">{t.email_digest}</p>
                                            <button 
                                                onClick={() => toggleMock('emailNotifs')}
                                                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.emailNotifs ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.emailNotifs ? 'translate-x-6' : ''}`} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{t.email_desc}</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg mr-4">
                                        <Volume2 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-bold text-slate-700 dark:text-slate-200">{t.sound_effects}</p>
                                            <button 
                                                onClick={() => toggleMock('sound')}
                                                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.sound ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.sound ? 'translate-x-6' : ''}`} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{t.sound_desc}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SECURITY TAB */}
                {activeTab === 'security' && (
                    <div className="space-y-8 animate-[fadeIn_0.3s]">
                         <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                                <Lock className="w-5 h-5 mr-2 text-red-500" /> {t.account_security}
                            </h3>

                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-xl p-4 mb-6">
                                <p className="text-xs font-bold text-yellow-800 dark:text-yellow-400 uppercase mb-1">{t.recommendation}</p>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">{t.enable_2fa}</p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                                    <div>
                                        <p className="font-bold text-slate-700 dark:text-slate-200">{t.two_factor}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{t.two_factor_desc}</p>
                                    </div>
                                    <button 
                                        onClick={() => toggleMock('twoFactor')}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.twoFactor ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.twoFactor ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 text-sm mb-2">{t.session_timeout}</label>
                                    <select 
                                        value={settings.sessionTimeout}
                                        onChange={(e) => setSettings({...settings, sessionTimeout: e.target.value})}
                                        className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                                    >
                                        <option value="15">15 Minutes</option>
                                        <option value="30">30 Minutes</option>
                                        <option value="60">1 Hour</option>
                                        <option value="never">Never (Not Recommended)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>

        <div className="flex justify-end mt-6">
            <button 
                onClick={handleSave}
                className="bg-slate-900 dark:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-blue-700 shadow-xl shadow-slate-900/20 dark:shadow-blue-600/20 transition-all flex items-center"
            >
                <Save className="w-4 h-4 mr-2" />
                {t.save_changes}
            </button>
        </div>
    </div>
  );
};
