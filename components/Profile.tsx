
import React, { useState, useRef } from 'react';
import { User, Language } from '../types';
import { DICTIONARY } from '../constants';
import { Save, Lock, User as UserIcon, Camera, Check, MapPin, Globe, Phone, FileText, Briefcase, Activity } from 'lucide-react';

interface ProfileProps {
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  language: Language;
}

export const Profile: React.FC<ProfileProps> = ({ currentUser, onUpdateUser, language }) => {
  const t = DICTIONARY[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Basic Info
  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [role, setRole] = useState(currentUser.role);
  const [status, setStatus] = useState(currentUser.status || 'Online');
  
  // Detailed Info
  const [bio, setBio] = useState(currentUser.bio || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [website, setWebsite] = useState(currentUser.website || '');

  const [showSuccess, setShowSuccess] = useState(false);

  // Password fields (simulation)
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...currentUser,
      name,
      avatar,
      role,
      status: status as any,
      bio,
      phone,
      location,
      website
    });
    
    // Simulate successful save
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    
    // Clear passwords
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{t.profile}</h2>
        {showSuccess && (
            <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-2 rounded-lg flex items-center shadow-sm animate-[fadeIn_0.3s]">
            <Check className="w-4 h-4 mr-2" />
            <span className="text-sm font-bold">{t.saved_success}</span>
            </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Preview Card */}
        <div className="lg:col-span-1 space-y-6">
           {/* Preview Card */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center sticky top-6">
              <div 
                className="relative group cursor-pointer mb-4"
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload new photo"
              >
                 <img 
                    src={avatar} 
                    alt="Preview" 
                    className="w-36 h-36 rounded-2xl object-cover border-4 border-white shadow-lg bg-slate-100 transition-opacity group-hover:opacity-90" 
                 />
                 <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <Camera className="w-8 h-8 text-white" />
                 </div>
                 <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                     status === 'Online' ? 'bg-emerald-500' : status === 'Busy' ? 'bg-red-500' : 'bg-slate-400'
                 }`}>
                 </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                className="hidden" 
                accept="image/*"
              />

              <h3 className="font-bold text-xl text-slate-800 mb-1">{name}</h3>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100 mb-4">
                  {role}
              </span>
              
              <div className="w-full space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center text-sm text-slate-600">
                      <MapPin className="w-4 h-4 mr-3 text-slate-400" />
                      <span className="truncate">{location || '-'}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                      <Globe className="w-4 h-4 mr-3 text-slate-400" />
                      <a href={`https://${website}`} target="_blank" rel="noreferrer" className="truncate hover:text-blue-600 hover:underline">{website || '-'}</a>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                      <Phone className="w-4 h-4 mr-3 text-slate-400" />
                      <span className="truncate">{phone || '-'}</span>
                  </div>
              </div>
           </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-2 space-y-6">
           
           {/* Basic Info */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center mb-6 pb-4 border-b border-slate-100">
                 <UserIcon className="w-5 h-5 text-blue-600 mr-2" />
                 <h3 className="font-bold text-lg text-slate-800">{t.basic_info}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.full_name}</label>
                    <input 
                       type="text" 
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.role}</label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <select 
                            value={role} 
                            onChange={(e) => setRole(e.target.value as any)}
                            className="w-full pl-9 p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium text-slate-700 bg-white"
                        >
                            <option value="Accountant">Accountant</option>
                            <option value="Manager">Manager</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.status}</label>
                    <div className="relative">
                        <Activity className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <select 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="w-full pl-9 p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium text-slate-700 bg-white"
                        >
                            <option value="Online">Online</option>
                            <option value="Busy">Busy</option>
                            <option value="Offline">Offline</option>
                        </select>
                    </div>
                 </div>

                 <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.avatar_url}</label>
                    <input 
                       type="text" 
                       value={avatar}
                       onChange={(e) => setAvatar(e.target.value)}
                       className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium text-slate-600"
                       placeholder="https://..."
                    />
                 </div>
              </div>
           </div>

           {/* Contact & Location */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center mb-6 pb-4 border-b border-slate-100">
                 <Globe className="w-5 h-5 text-purple-500 mr-2" />
                 <h3 className="font-bold text-lg text-slate-800">{t.contact_location}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.contact_email}</label>
                    <input 
                       type="email" 
                       value={currentUser.email || ''}
                       disabled
                       className="w-full p-2.5 border border-slate-200 bg-slate-50 text-slate-400 rounded-xl cursor-not-allowed font-medium"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.phone}</label>
                    <input 
                       type="tel" 
                       value={phone}
                       onChange={(e) => setPhone(e.target.value)}
                       className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                       placeholder="+31 6..."
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.location}</label>
                    <input 
                       type="text" 
                       value={location}
                       onChange={(e) => setLocation(e.target.value)}
                       className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                       placeholder="City, Country"
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.website}</label>
                    <input 
                       type="text" 
                       value={website}
                       onChange={(e) => setWebsite(e.target.value)}
                       className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                       placeholder="www.example.com"
                    />
                 </div>
              </div>
           </div>

           {/* About / Bio */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center mb-6 pb-4 border-b border-slate-100">
                 <FileText className="w-5 h-5 text-orange-500 mr-2" />
                 <h3 className="font-bold text-lg text-slate-800">{t.about}</h3>
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.about}</label>
                  <textarea 
                     value={bio}
                     onChange={(e) => setBio(e.target.value)}
                     className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all h-32 resize-none font-medium text-slate-700"
                     placeholder="Tell us about your expertise..."
                  />
              </div>
           </div>

           {/* Security */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center mb-6 pb-4 border-b border-slate-100">
                 <Lock className="w-5 h-5 text-red-500 mr-2" />
                 <h3 className="font-bold text-lg text-slate-800">{t.change_password}</h3>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.current_password}</label>
                    <input 
                       type="password" 
                       value={currentPwd}
                       onChange={(e) => setCurrentPwd(e.target.value)}
                       className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.new_password}</label>
                        <input 
                           type="password" 
                           value={newPwd}
                           onChange={(e) => setNewPwd(e.target.value)}
                           className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.confirm_password}</label>
                        <input 
                           type="password" 
                           value={confirmPwd}
                           onChange={(e) => setConfirmPwd(e.target.value)}
                           className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                        />
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex justify-end pt-4 sticky bottom-4 z-10">
              <button 
                 type="submit" 
                 className="flex items-center bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all transform hover:-translate-y-0.5"
              >
                 <Save className="w-5 h-5 mr-2" />
                 {t.save_changes}
              </button>
           </div>
        </div>
      </form>
    </div>
  );
};
