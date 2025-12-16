
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TaskList } from './components/TaskList';
import { Chat } from './components/Chat';
import { Documents } from './components/Documents';
import { Team } from './components/Team';
import { Profile } from './components/Profile';
import { Calendar } from './components/Calendar';
import { Settings } from './components/Settings';
import { Language, Task, ChatMessage, User, TaskTemplate } from './types';
import { MOCK_USERS, INITIAL_TASKS, INITIAL_CHAT, TASK_TEMPLATES } from './constants';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [language, setLanguage] = useState<Language>('PL');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Theme State
  const [darkMode, setDarkMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  // App State
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  
  // Templates State - Initialized with system templates but fully mutable
  const [templates, setTemplates] = useState<TaskTemplate[]>(TASK_TEMPLATES);
  
  // User Management State
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUserId, setCurrentUserId] = useState<string>('1');

  const currentUser = users.find(u => u.id === currentUserId) || users[0];

  // Apply Dark Mode Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleUpdateUser = (updatedUser: User) => {
     setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    closeSidebar(); // Auto-close sidebar on mobile when navigating
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard tasks={tasks} language={language} users={users} setCurrentView={handleViewChange} />;
      case 'tasks':
        return <TaskList 
            tasks={tasks} 
            setTasks={setTasks} 
            language={language} 
            users={users} 
            templates={templates} 
            setTemplates={setTemplates}
            compactMode={compactMode}
        />;
      case 'chat':
        return <Chat messages={messages} setMessages={setMessages} users={users} currentUser={currentUser} language={language} />;
      case 'team':
        return <Team users={users} language={language} />;
      case 'profile':
        return <Profile currentUser={currentUser} onUpdateUser={handleUpdateUser} language={language} />;
      case 'calendar':
        return <Calendar 
            tasks={tasks} 
            setTasks={setTasks} 
            users={users} 
            currentUser={currentUser} 
            language={language}
            templates={templates}
        />;
      case 'documents':
        return <Documents language={language} />;
      case 'settings':
        return <Settings 
          language={language} 
          setLanguage={setLanguage} 
          currentUser={currentUser}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          compactMode={compactMode}
          setCompactMode={setCompactMode}
        />;
      default:
        return <Dashboard tasks={tasks} language={language} users={users} setCurrentView={handleViewChange} />;
    }
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden relative transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* Sidebar Component - Responsive logic handled inside */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={handleViewChange} 
        language={language} 
        setLanguage={setLanguage}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden w-full relative transition-all duration-300">
        
        {/* Mobile Header with Hamburger */}
        <header className="flex md:hidden items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-20 shrink-0 transition-colors">
           <div className="flex items-center gap-3">
              <button onClick={toggleSidebar} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                 <Menu className="w-6 h-6" />
              </button>
              <h1 className="font-bold text-slate-800 dark:text-white text-lg">Boekhouder</h1>
           </div>
           <img src={currentUser.avatar} alt="Profile" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600" />
        </header>

        {/* Desktop Header & Content Wrapper */}
        <div className={`flex-1 overflow-hidden overflow-y-auto ${compactMode ? 'p-2 md:p-4' : 'p-4 md:p-6'} scroll-smooth`}>
            {/* Desktop Header - Hidden on Mobile to save space (info is in Mobile Header or Sidebar) */}
            <header className="hidden md:flex justify-between items-center mb-6 shrink-0">
              <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">{currentView}</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {new Date().toLocaleDateString(language === 'PL' ? 'pl-PL' : language === 'TR' ? 'tr-TR' : 'nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
              </div>
              <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.role}</p>
                  </div>
                  <img src={currentUser.avatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-600 shadow-sm object-cover" />
              </div>
            </header>

            {/* View Content */}
            <div className="h-full">
              {renderContent()}
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
