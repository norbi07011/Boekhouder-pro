
import React from 'react';
import { LayoutDashboard, CheckSquare, Calendar, MessageSquare, FileText, Settings, Globe, Users, UserCircle, X, FileText as LogoIcon } from 'lucide-react';
import { Language } from '../types';
import { DICTIONARY } from '../constants';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, language, setLanguage, isOpen, onClose }) => {
  const t = DICTIONARY[language];

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
    { id: 'tasks', icon: CheckSquare, label: t.tasks },
    { id: 'calendar', icon: Calendar, label: t.calendar },
    { id: 'team', icon: Users, label: t.team },
    { id: 'chat', icon: MessageSquare, label: t.chat },
    { id: 'documents', icon: FileText, label: t.documents },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-slate-900 text-white flex flex-col h-full shadow-2xl md:shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center">
             <div className="bg-blue-600 p-2 rounded-lg mr-2">
               <LogoIcon className="w-6 h-6 text-white" />
             </div>
             <h1 className="text-xl font-bold tracking-tight">Boekhouder</h1>
          </div>
          {/* Mobile Close Button */}
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white p-1">
             <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer Settings */}
        <div className="p-4 border-t border-slate-700 shrink-0">
          <button 
             onClick={() => setCurrentView('profile')}
             className={`w-full flex items-center p-2 rounded-lg text-sm mb-1 ${currentView === 'profile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <UserCircle className="w-4 h-4 mr-2" />
            {t.profile}
          </button>

          <button 
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center p-2 text-sm rounded-lg ${currentView === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Settings className="w-4 h-4 mr-2" />
            {t.settings}
          </button>
        </div>
      </div>
    </>
  );
};
