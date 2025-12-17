import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

interface AuthFormProps {
  onSuccess?: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        onSuccess?.();
      } else if (mode === 'register') {
        await signUp(email, password, name);
        setMessage('Sprawdź swoją skrzynkę e-mail, aby potwierdzić konto.');
      } else if (mode === 'forgot') {
        // TODO: Implement password reset
        setMessage('Link do resetowania hasła został wysłany na Twój e-mail.');
      }
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Błąd logowania przez Google');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 relative overflow-hidden">
      {/* Holographic Logo Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img 
          src="/logo.jpg" 
          alt="" 
          className="w-[600px] h-[600px] object-contain opacity-[0.03] blur-sm"
          style={{ filter: 'grayscale(100%) blur(2px)' }}
        />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo.jpg" 
            alt="Admin Holland Logo" 
            className="w-24 h-24 mx-auto mb-4 drop-shadow-2xl"
          />
          <h1 className="text-2xl font-black text-white">Admin Holland</h1>
          <p className="text-blue-400 text-sm font-medium">Boekhouder Connect</p>
          <p className="text-slate-400 mt-2">
            {mode === 'login' && 'Zaloguj się do swojego konta'}
            {mode === 'register' && 'Stwórz nowe konto'}
            {mode === 'forgot' && 'Zresetuj hasło'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                {message}
              </div>
            )}

            {/* Name Field (Register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Imię i nazwisko
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jan Kowalski"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Adres e-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jan@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Field (not for forgot mode) */}
            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Hasło
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot Password Link */}
            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Zapomniałeś hasła?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {mode === 'login' && 'Zaloguj się'}
              {mode === 'register' && 'Zarejestruj się'}
              {mode === 'forgot' && 'Wyślij link'}
            </button>
          </form>

          {/* Divider */}
          {mode !== 'forgot' && (
            <>
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-white/10"></div>
                <span className="px-4 text-sm text-slate-500">lub</span>
                <div className="flex-1 border-t border-white/10"></div>
              </div>

              {/* OAuth Buttons */}
              <button
                onClick={handleGoogleLogin}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Kontynuuj z Google
              </button>
            </>
          )}

          {/* Mode Switch */}
          <div className="mt-6 text-center text-sm text-slate-400">
            {mode === 'login' && (
              <>
                Nie masz konta?{' '}
                <button
                  onClick={() => { setMode('register'); setError(null); setMessage(null); }}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Zarejestruj się
                </button>
              </>
            )}
            {mode === 'register' && (
              <>
                Masz już konto?{' '}
                <button
                  onClick={() => { setMode('login'); setError(null); setMessage(null); }}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Zaloguj się
                </button>
              </>
            )}
            {mode === 'forgot' && (
              <button
                onClick={() => { setMode('login'); setError(null); setMessage(null); }}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                ← Powrót do logowania
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          © 2025 Boekhouder Connect. Wszystkie prawa zastrzeżone.
        </p>
      </div>
    </div>
  );
};
