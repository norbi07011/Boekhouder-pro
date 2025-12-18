
import React, { useState, useEffect } from 'react';
import { Language, User } from '../types';
import { DICTIONARY } from '../constants';
import { Bell, Shield, Globe, Monitor, Smartphone, Volume2, Lock, Eye, Save, Check, Briefcase, Calculator, Clock, MessageSquare, CheckSquare, AlertTriangle, Key, Loader2 } from 'lucide-react';
import { settingsService } from '../src/services/notificationsService';
import { authService } from '../src/services/authService';

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

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
      emailNotifs: true,
      pushNotifs: true,
      sound: true,
      twoFactor: true,
      sessionTimeout: '30',
      defaultCurrency: 'EUR',
      fiscalYearEnd: '12-31',
      // New notification settings
      reminderTime: '30', // minutes before event
      notifyTaskAssigned: true,
      notifyTaskDue: true,
      notifyMessages: true,
      notifyDocuments: true
  });

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const dbSettings = await settingsService.get();
        if (dbSettings) {
          setSettings(prev => ({
            ...prev,
            emailNotifs: dbSettings.email_notifications ?? true,
            pushNotifs: dbSettings.push_notifications ?? true,
            sound: dbSettings.sound_enabled ?? true,
            defaultCurrency: dbSettings.default_currency || 'EUR',
            fiscalYearEnd: dbSettings.fiscal_year_end || '12-31',
            reminderTime: (dbSettings as any).reminder_time?.toString() || '30',
            notifyTaskAssigned: (dbSettings as any).notify_task_assigned ?? true,
            notifyTaskDue: (dbSettings as any).notify_task_due ?? true,
            notifyMessages: (dbSettings as any).notify_messages ?? true,
            notifyDocuments: (dbSettings as any).notify_documents ?? true,
            twoFactor: (dbSettings as any).two_factor ?? false,
            sessionTimeout: (dbSettings as any).session_timeout?.toString() || '30'
          }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('Powiadomienia włączone!', {
          body: 'Będziesz otrzymywać powiadomienia z Admin Holland.',
          icon: '/logo.jpg'
        });
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await settingsService.update({
        email_notifications: settings.emailNotifs,
        push_notifications: settings.pushNotifs,
        sound_enabled: settings.sound,
        default_currency: settings.defaultCurrency,
        fiscal_year_end: settings.fiscalYearEnd,
        reminder_time: parseInt(settings.reminderTime),
        notify_task_assigned: settings.notifyTaskAssigned,
        notify_task_due: settings.notifyTaskDue,
        notify_messages: settings.notifyMessages,
        two_factor: settings.twoFactor,
        session_timeout: parseInt(settings.sessionTimeout)
      } as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Błąd zapisu ustawień');
    } finally {
      setIsSaving(false);
    }
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
                                        title="Przełącz tryb ciemny"
                                        aria-label="Przełącz tryb ciemny"
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
                                        title="Przełącz tryb kompaktowy"
                                        aria-label="Przełącz tryb kompaktowy"
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
                                        title="Wybierz domyślną walutę"
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
                                        value={`2023-${settings.fiscalYearEnd}`}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if(val) setSettings({...settings, fiscalYearEnd: val.substring(5)});
                                        }}
                                        className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                                        title="Wybierz koniec roku podatkowego"
                                    />
                                </div>
                            </div>
                         </div>
                     </div>
                )}

                {/* NOTIFICATIONS TAB */}
                {activeTab === 'notifications' && (
                    <div className="space-y-8 animate-[fadeIn_0.3s]">
                        {/* Browser Permission Banner */}
                        {'Notification' in window && Notification.permission !== 'granted' && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              <div>
                                <p className="font-bold text-blue-800 dark:text-blue-300 text-sm">
                                  {language === 'PL' ? 'Włącz powiadomienia w przeglądarce' : 'Enable browser notifications'}
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                  {language === 'PL' ? 'Aby otrzymywać powiadomienia push, musisz je włączyć w przeglądarce.' : 'To receive push notifications, you need to enable them in your browser.'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={requestNotificationPermission}
                              className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                            >
                              {language === 'PL' ? 'Włącz' : 'Enable'}
                            </button>
                          </div>
                        )}

                        {/* Reminder Time Setting */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-blue-500" /> 
                                {language === 'PL' ? 'Czas przypomnienia' : 'Reminder Time'}
                            </h3>
                            <div className="bg-slate-50 dark:bg-slate-750 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                <label className="block font-bold text-slate-700 dark:text-slate-300 text-sm mb-2">
                                  {language === 'PL' ? 'Powiadamiaj mnie przed terminem zadania:' : 'Notify me before task deadline:'}
                                </label>
                                <select 
                                    value={settings.reminderTime}
                                    onChange={(e) => setSettings({...settings, reminderTime: e.target.value})}
                                    className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                                    title="Czas przypomnienia"
                                >
                                    <option value="5">{language === 'PL' ? '5 minut przed' : '5 minutes before'}</option>
                                    <option value="10">{language === 'PL' ? '10 minut przed' : '10 minutes before'}</option>
                                    <option value="15">{language === 'PL' ? '15 minut przed' : '15 minutes before'}</option>
                                    <option value="30">{language === 'PL' ? '30 minut przed' : '30 minutes before'}</option>
                                    <option value="60">{language === 'PL' ? '1 godzinę przed' : '1 hour before'}</option>
                                    <option value="120">{language === 'PL' ? '2 godziny przed' : '2 hours before'}</option>
                                    <option value="1440">{language === 'PL' ? '1 dzień przed' : '1 day before'}</option>
                                </select>
                            </div>
                        </div>

                        {/* Notification Types */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                                <Bell className="w-5 h-5 mr-2 text-orange-500" /> 
                                {language === 'PL' ? 'Typy powiadomień' : 'Notification Types'}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg">
                                            <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                              {language === 'PL' ? 'Nowe przypisane zadania' : 'New assigned tasks'}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                              {language === 'PL' ? 'Gdy ktoś przypisze Ci zadanie' : 'When someone assigns you a task'}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSettings({...settings, notifyTaskAssigned: !settings.notifyTaskAssigned})}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.notifyTaskAssigned ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                        title="Powiadomienia o nowych zadaniach"
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.notifyTaskAssigned ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-orange-100 dark:bg-orange-900/40 p-2 rounded-lg">
                                            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                              {language === 'PL' ? 'Przypomnienia o terminach' : 'Deadline reminders'}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                              {language === 'PL' ? 'Przed terminem wykonania zadania' : 'Before task deadline'}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSettings({...settings, notifyTaskDue: !settings.notifyTaskDue})}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.notifyTaskDue ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                        title="Przypomnienia o terminach"
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.notifyTaskDue ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-lg">
                                            <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                              {language === 'PL' ? 'Nowe wiadomości na grupie' : 'New group messages'}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                              {language === 'PL' ? 'Gdy pojawi się nowa wiadomość w kanale' : 'When a new message appears in a channel'}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSettings({...settings, notifyMessages: !settings.notifyMessages})}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.notifyMessages ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                        title="Powiadomienia o wiadomościach"
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.notifyMessages ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Push & Sound Settings */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                                <Monitor className="w-5 h-5 mr-2 text-purple-500" /> 
                                {language === 'PL' ? 'Sposób dostarczania' : 'Delivery Method'}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg mr-4">
                                        <Monitor className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-bold text-slate-700 dark:text-slate-200">{t.push_notifs}</p>
                                            <button 
                                                onClick={() => setSettings({...settings, pushNotifs: !settings.pushNotifs})}
                                                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.pushNotifs ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                title="Powiadomienia push"
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
                                                onClick={() => setSettings({...settings, emailNotifs: !settings.emailNotifs})}
                                                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.emailNotifs ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                title="Powiadomienia email"
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
                                                onClick={() => setSettings({...settings, sound: !settings.sound})}
                                                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.sound ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                title="Dźwięki powiadomień"
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
                         {/* CHANGE PASSWORD SECTION */}
                         <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                                <Key className="w-5 h-5 mr-2 text-blue-500" /> 
                                {language === 'PL' ? 'Zmień hasło' : language === 'TR' ? 'Şifre değiştir' : 'Wachtwoord wijzigen'}
                            </h3>

                            {passwordSuccess && (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-xl p-4 mb-4 flex items-center">
                                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                                    <p className="text-sm font-bold text-green-700 dark:text-green-300">
                                        {language === 'PL' ? 'Hasło zostało zmienione pomyślnie!' : 'Password changed successfully!'}
                                    </p>
                                </div>
                            )}

                            {passwordError && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl p-4 mb-4 flex items-center">
                                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                                    <p className="text-sm font-bold text-red-700 dark:text-red-300">{passwordError}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 text-sm mb-2">
                                        {language === 'PL' ? 'Nowe hasło' : language === 'TR' ? 'Yeni şifre' : 'Nieuw wachtwoord'}
                                    </label>
                                    <input 
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={6}
                                        className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {language === 'PL' ? 'Minimum 6 znaków' : 'Minimum 6 characters'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 text-sm mb-2">
                                        {language === 'PL' ? 'Potwierdź nowe hasło' : language === 'TR' ? 'Yeni şifreyi onayla' : 'Bevestig nieuw wachtwoord'}
                                    </label>
                                    <input 
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={6}
                                        className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                                    />
                                </div>

                                <button 
                                    onClick={async () => {
                                        setPasswordError(null);
                                        setPasswordSuccess(false);
                                        
                                        if (newPassword.length < 6) {
                                            setPasswordError(language === 'PL' ? 'Hasło musi mieć minimum 6 znaków' : 'Password must be at least 6 characters');
                                            return;
                                        }
                                        
                                        if (newPassword !== confirmPassword) {
                                            setPasswordError(language === 'PL' ? 'Hasła nie są identyczne' : 'Passwords do not match');
                                            return;
                                        }
                                        
                                        setIsChangingPassword(true);
                                        try {
                                            await authService.updatePassword(newPassword);
                                            setPasswordSuccess(true);
                                            setNewPassword('');
                                            setConfirmPassword('');
                                            setTimeout(() => setPasswordSuccess(false), 5000);
                                        } catch (error: any) {
                                            setPasswordError(error.message || (language === 'PL' ? 'Błąd zmiany hasła' : 'Password change failed'));
                                        } finally {
                                            setIsChangingPassword(false);
                                        }
                                    }}
                                    disabled={isChangingPassword || !newPassword || !confirmPassword}
                                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                                >
                                    {isChangingPassword ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {language === 'PL' ? 'Zmieniam...' : 'Changing...'}
                                        </>
                                    ) : (
                                        <>
                                            <Key className="w-4 h-4 mr-2" />
                                            {language === 'PL' ? 'Zmień hasło' : language === 'TR' ? 'Şifre değiştir' : 'Wachtwoord wijzigen'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
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
                                        title="Weryfikacja dwuetapowa"
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
                                        title="Limit czasu sesji"
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
