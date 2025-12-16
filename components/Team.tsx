
import React from 'react';
import { User, Language } from '../types';
import { DICTIONARY } from '../constants';
import { Mail, Shield, Phone, MapPin, Globe, Linkedin, CheckCircle2 } from 'lucide-react';

interface TeamProps {
  users: User[];
  language: Language;
}

export const Team: React.FC<TeamProps> = ({ users, language }) => {
  const t = DICTIONARY[language];

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

      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
            <h2 className="text-3xl font-black text-slate-800">{t.team}</h2>
            <p className="text-slate-500 text-sm mt-1">{t.meet_team}</p>
        </div>
        <div className="flex items-center gap-3">
             <div className="bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-2">
                 <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                 <span className="text-blue-700 font-bold text-sm">{users.filter(u => u.status === 'Online').length} Online</span>
             </div>
             <span className="bg-slate-100 text-slate-600 font-bold text-sm px-4 py-2 rounded-xl border border-slate-200">
                {users.length} {t.team_members}
             </span>
        </div>
      </div>

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
    </div>
  );
};
