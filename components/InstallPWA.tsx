import React, { useState } from 'react';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { DICTIONARY } from '../constants';
import { Language } from '../types';
import { 
  Download, 
  Bell, 
  BellOff, 
  CheckCircle, 
  XCircle, 
  Smartphone, 
  Volume2,
  VolumeX,
  Loader2,
  AlertTriangle,
  Monitor
} from 'lucide-react';

interface InstallPWAProps {
  language: Language;
}

export const InstallPWA: React.FC<InstallPWAProps> = ({ language }) => {
  const t = DICTIONARY[language];
  const [showDetails, setShowDetails] = useState(false);
  const [testingSound, setTestingSound] = useState(false);
  
  const {
    isSupported,
    isEnabled,
    isBlocked,
    permission,
    isSubscribed,
    canInstall,
    isInstalled,
    promptInstall,
    requestPermission,
    subscribe,
    unsubscribe,
    playSound,
    unreadCount,
    loading,
    error
  } = usePushNotifications();

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      // Show success message
    }
  };

  const handleEnableNotifications = async () => {
    const perm = await requestPermission();
    if (perm === 'granted') {
      await subscribe();
    }
  };

  const handleTestSound = async () => {
    setTestingSound(true);
    await playSound();
    setTimeout(() => setTestingSound(false), 1000);
  };

  // Labels based on language
  const labels = {
    PL: {
      installApp: 'Zainstaluj aplikację',
      installDesc: 'Zainstaluj aplikację na pulpicie, aby otrzymywać powiadomienia',
      installed: 'Aplikacja zainstalowana',
      enableNotifications: 'Włącz powiadomienia',
      notificationsEnabled: 'Powiadomienia włączone',
      notificationsBlocked: 'Powiadomienia zablokowane',
      notificationsBlockedDesc: 'Odblokuj powiadomienia w ustawieniach przeglądarki',
      testSound: 'Testuj dźwięk',
      unreadNotifications: 'nieprzeczytanych powiadomień',
      notSupported: 'Twoja przeglądarka nie wspiera powiadomień push',
      subscribed: 'Subskrypcja aktywna',
      notSubscribed: 'Brak subskrypcji',
      subscribe: 'Subskrybuj',
      unsubscribe: 'Anuluj subskrypcję',
      loading: 'Ładowanie...',
      howToInstall: 'Jak zainstalować?',
      installSteps: [
        'Kliknij przycisk "Zainstaluj aplikację" powyżej',
        'Lub użyj menu przeglądarki (trzy kropki) → "Zainstaluj aplikację"',
        'Aplikacja pojawi się na pulpicie jako ikona'
      ]
    },
    NL: {
      installApp: 'Installeer app',
      installDesc: 'Installeer de app op uw bureaublad om meldingen te ontvangen',
      installed: 'App geïnstalleerd',
      enableNotifications: 'Meldingen inschakelen',
      notificationsEnabled: 'Meldingen ingeschakeld',
      notificationsBlocked: 'Meldingen geblokkeerd',
      notificationsBlockedDesc: 'Deblokkeer meldingen in browserinstellingen',
      testSound: 'Testgeluid',
      unreadNotifications: 'ongelezen meldingen',
      notSupported: 'Uw browser ondersteunt geen push-meldingen',
      subscribed: 'Abonnement actief',
      notSubscribed: 'Geen abonnement',
      subscribe: 'Abonneren',
      unsubscribe: 'Uitschrijven',
      loading: 'Laden...',
      howToInstall: 'Hoe te installeren?',
      installSteps: [
        'Klik op de knop "Installeer app" hierboven',
        'Of gebruik het browsermenu (drie puntjes) → "App installeren"',
        'De app verschijnt op uw bureaublad als een pictogram'
      ]
    },
    TR: {
      installApp: 'Uygulamayı yükle',
      installDesc: 'Bildirimleri almak için uygulamayı masaüstünüze yükleyin',
      installed: 'Uygulama yüklendi',
      enableNotifications: 'Bildirimleri etkinleştir',
      notificationsEnabled: 'Bildirimler etkin',
      notificationsBlocked: 'Bildirimler engellendi',
      notificationsBlockedDesc: 'Tarayıcı ayarlarından bildirimlerin engelini kaldırın',
      testSound: 'Ses testi',
      unreadNotifications: 'okunmamış bildirim',
      notSupported: 'Tarayıcınız push bildirimlerini desteklemiyor',
      subscribed: 'Abonelik aktif',
      notSubscribed: 'Abonelik yok',
      subscribe: 'Abone ol',
      unsubscribe: 'Abonelikten çık',
      loading: 'Yükleniyor...',
      howToInstall: 'Nasıl yüklenir?',
      installSteps: [
        'Yukarıdaki "Uygulamayı yükle" düğmesine tıklayın',
        'Veya tarayıcı menüsünü kullanın (üç nokta) → "Uygulamayı yükle"',
        'Uygulama masaüstünüzde bir simge olarak görünecektir'
      ]
    }
  };

  const l = labels[language];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-600 dark:text-slate-400">{l.loading}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* PWA Install Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-blue-100 dark:border-slate-600">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
            <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              {isInstalled ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {l.installed}
                </>
              ) : (
                l.installApp
              )}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {l.installDesc}
            </p>
            
            {canInstall && !isInstalled && (
              <button
                onClick={handleInstall}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                {l.installApp}
              </button>
            )}

            {!canInstall && !isInstalled && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {l.howToInstall}
              </button>
            )}

            {showDetails && !isInstalled && (
              <div className="mt-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                  {l.installSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-purple-100 dark:border-slate-600">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${
            isEnabled 
              ? 'bg-green-100 dark:bg-green-900/50' 
              : isBlocked 
                ? 'bg-red-100 dark:bg-red-900/50'
                : 'bg-purple-100 dark:bg-purple-900/50'
          }`}>
            {isEnabled ? (
              <Bell className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : isBlocked ? (
              <BellOff className="w-6 h-6 text-red-600 dark:text-red-400" />
            ) : (
              <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              {isEnabled ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {l.notificationsEnabled}
                </>
              ) : isBlocked ? (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  {l.notificationsBlocked}
                </>
              ) : (
                l.enableNotifications
              )}
            </h3>

            {isBlocked && (
              <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {l.notificationsBlockedDesc}
                </p>
              </div>
            )}

            {!isSupported && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                {l.notSupported}
              </p>
            )}

            {isSupported && !isEnabled && !isBlocked && (
              <button
                onClick={handleEnableNotifications}
                disabled={loading}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Bell className="w-4 h-4" />
                {l.enableNotifications}
              </button>
            )}

            {isEnabled && (
              <div className="mt-3 space-y-2">
                {/* Subscription status */}
                <div className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <span className="text-slate-600 dark:text-slate-400">
                    {isSubscribed ? l.subscribed : l.notSubscribed}
                  </span>
                  {!isSubscribed && (
                    <button
                      onClick={subscribe}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                    >
                      {l.subscribe}
                    </button>
                  )}
                </div>

                {/* Unread count */}
                {unreadCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full font-medium">
                      {unreadCount}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {l.unreadNotifications}
                    </span>
                  </div>
                )}

                {/* Test sound button */}
                <button
                  onClick={handleTestSound}
                  disabled={testingSound}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm transition-colors"
                >
                  {testingSound ? (
                    <Volume2 className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  {l.testSound}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};
