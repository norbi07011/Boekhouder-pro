
import React, { useState, useEffect } from 'react';
import { User, Language } from '../types';
import { DICTIONARY } from '../constants';
import { Mail, Shield, Phone, MapPin, Globe, Linkedin, CheckCircle2, UserPlus, X, Copy, Check, Loader2, Clock, Send } from 'lucide-react';
import { invitesService, OrganizationInvite } from '../src/services/invitesService';

interface TeamProps {
  users: User[];
  language: Language;
}

export const Team: React.FC<TeamProps> = ({ users, language }) => {
  const t = DICTIONARY[language];
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Manager' | 'Accountant' | 'Viewer'>('Accountant');
  const [pendingInvites, setPendingInvites] = useState<OrganizationInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load pending invites
  useEffect(() => {
    loadPendingInvites();
  }, []);

  const loadPendingInvites = async () => {
    try {
      setIsLoading(true);
      const invites = await invitesService.getPendingInvites();
      setPendingInvites(invites);
    } catch (err) {
      console.error('Error loading invites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const invite = await invitesService.createInvite(inviteEmail, inviteRole);
      setPendingInvites(prev => [invite, ...prev]);
      setInviteEmail('');
      setSuccess(`Zaproszenie wysłane do ${inviteEmail}!`);
      
      // Copy link to clipboard
      const link = invitesService.getInviteLink(invite.token);
      await navigator.clipboard.writeText(link);
      setSuccess(`Zaproszenie utworzone! Link skopiowany do schowka.`);
    } catch (err: any) {
      setError(err.message || 'Nie udało się wysłać zaproszenia');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = async (token: string) => {
    const link = invitesService.getInviteLink(token);
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await invitesService.cancelInvite(inviteId);
      setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
    } catch (err) {
      console.error('Error cancelling invite:', err);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Styles for gradient animation */}
      <style>{`
        @keyframes gradient-xy {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        .animate-gradient-xy {
            background-size: 200% 200%;
            animation: gradient-xy 6s ease infinite;
        }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
            <h2 className="text-3xl font-black text-slate-800">{t.team}</h2>
            <p className="text-slate-500 text-sm mt-1">{t.meet_team}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
             <button
                onClick={() => setIsInviteModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
             >
                 <UserPlus className="w-4 h-4" />
                 Zaproś użytkownika
             </button>
             <div className="bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-2">
                 <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                 <span className="text-blue-700 font-bold text-sm">{users.filter(u => u.status === 'Online').length} Online</span>
             </div>
             <span className="bg-slate-100 text-slate-600 font-bold text-sm px-4 py-2 rounded-xl border border-slate-200">
                {users.length} {t.team_members}
             </span>
        </div>
      </div>

      {/* Pending Invites Section */}
      {pendingInvites.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Oczekujące zaproszenia ({pendingInvites.length})
          </h3>
          <div className="space-y-3">
            {pendingInvites.map(invite => (
              <div key={invite.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-amber-200">
                <div>
                  <p className="font-bold text-slate-800">{invite.email}</p>
                  <p className="text-xs text-slate-500">Rola: {invite.role} • Wygasa: {new Date(invite.expires_at).toLocaleDateString('pl')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyLink(invite.token)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Kopiuj link zaproszenia"
                  >
                    {copiedToken === invite.token ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleCancelInvite(invite.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Anuluj zaproszenie"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {users.map((user) => (
          <div key={user.id} className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group z-0">
            
            {/* Top Animated Background */}
            <div className="h-36 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 animate-gradient-xy opacity-90 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Glass effect overlay */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
                
                {/* Decorative circles */}
                <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-[-50%] left-[-10%] w-40 h-40 bg-blue-500/30 rounded-full blur-2xl pointer-events-none"></div>
            </div>

            <div className="px-8 pb-8 relative z-10">
                {/* Avatar & Header - Adjusted Layout */}
                <div className="flex justify-between items-end -mt-14 mb-6">
                    <div className="relative">
                        <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-28 h-28 rounded-2xl border-[5px] border-white shadow-lg object-cover bg-slate-100"
                        />
                        <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-full border-4 border-white shadow-sm ${
                            user.status === 'Online' ? 'bg-emerald-500' : user.status === 'Busy' ? 'bg-red-500' : 'bg-slate-400'
                        }`} title={user.status}>
                            <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    
                    {/* Name Block - Moved to right side, clearly visible on white bg */}
                    <div className="text-right flex-1 ml-4 pt-16">
                        <h3 className="text-2xl font-black text-slate-800 leading-none mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-fuchsia-600 transition-all">
                            {user.name}
                        </h3>
                        <div className="inline-flex items-center text-blue-600 font-bold text-xs bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                            <Shield className="w-3 h-3 mr-1.5" />
                            {user.role}
                        </div>
                    </div>
                </div>

                {/* Bio Section */}
                <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                        {t.about}
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed font-medium">
                        {user.bio || 'Experienced professional dedicated to providing top-notch accounting services regarding Dutch tax laws.'}
                    </p>
                </div>

                {/* Contact Info Grid */}
                <div className="grid grid-cols-2 gap-y-5 gap-x-8 mb-6">
                    <div className="group/item">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center">
                            <Mail className="w-3 h-3 mr-1.5 text-blue-400" /> Email
                        </p>
                        <a href={`mailto:${user.email}`} className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors truncate block">
                            {user.email}
                        </a>
                    </div>

                    <div className="group/item">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center">
                            <Phone className="w-3 h-3 mr-1.5 text-green-400" /> {t.phone}
                        </p>
                        <p className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer">
                            {user.phone || '+31 6 0000 0000'}
                        </p>
                    </div>

                    <div className="group/item">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center">
                            <MapPin className="w-3 h-3 mr-1.5 text-red-400" /> {t.location}
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                            {user.location || 'Netherlands'}
                        </p>
                    </div>

                    <div className="group/item">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center">
                            <Globe className="w-3 h-3 mr-1.5 text-purple-400" /> {t.website}
                        </p>
                        {user.website ? (
                            <a href={`https://${user.website}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 hover:underline truncate block">
                                {user.website}
                            </a>
                        ) : (
                            <span className="text-sm text-slate-400">-</span>
                        )}
                    </div>
                </div>
                
                {/* Social Footer */}
                <div className="pt-6 border-t border-slate-100 flex gap-3">
                    <button className="flex-1 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center font-bold text-xs group/btn">
                        <Linkedin className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                        LinkedIn
                    </button>
                    <button className="flex-1 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all flex items-center justify-center font-bold text-xs group/btn">
                        <Globe className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                        Website
                    </button>
                </div>

            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-[450px] max-w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Zaproś użytkownika do zespołu
              </h3>
              <button 
                onClick={() => { setIsInviteModalOpen(false); setError(null); setSuccess(null); }} 
                className="text-slate-400 hover:text-red-500"
                title="Zamknij"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSendInvite} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Email użytkownika
                </label>
                <input 
                  type="email" 
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                  placeholder="jan.kowalski@firma.pl"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Rola w zespole
                </label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                  title="Wybierz rolę"
                >
                  <option value="Viewer">Przeglądający (tylko odczyt)</option>
                  <option value="Accountant">Księgowy</option>
                  <option value="Manager">Menadżer</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700">
                <p className="font-bold mb-1">Jak to działa?</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Wyślij zaproszenie - link zostanie skopiowany do schowka</li>
                  <li>Przekaż link zapraszanej osobie</li>
                  <li>Osoba rejestruje konto używając tego samego emaila</li>
                  <li>Po rejestracji automatycznie dołączy do zespołu</li>
                </ol>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={isSending}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Wysyłanie...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Wyślij zaproszenie
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
