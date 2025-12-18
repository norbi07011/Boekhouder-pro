
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TaskList } from './components/TaskList';
import { Chat } from './components/Chat';
import { Documents } from './components/Documents';
import { Team } from './components/Team';
import { Profile } from './components/Profile';
import { Calendar } from './components/Calendar';
import { Settings } from './components/Settings';
import { NotificationCenter } from './components/NotificationCenter';
import { AuthForm } from './src/components/auth/AuthForm';
import { useAuth } from './src/contexts/AuthContext';
import { Language, Task, ChatMessage, User, TaskTemplate } from './types';
import { TASK_TEMPLATES } from './constants';
import { Menu, Loader2, LogOut } from 'lucide-react';
import { tasksService } from './src/services/tasksService';
import { profilesService } from './src/services/profilesService';
import { chatService } from './src/services/chatService';

const App: React.FC = () => {
  const { user, profile, settings, loading: authLoading, signOut } = useAuth();
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [language, setLanguage] = useState<Language>('NL');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Theme State
  const [darkMode, setDarkMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  // Data Loading State
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // App State - Now loaded from database
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Templates State
  const [templates, setTemplates] = useState<TaskTemplate[]>(TASK_TEMPLATES);

  // Current user derived from profile
  const currentUser: User | null = profile ? {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role || 'Accountant',
    avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=3b82f6&color=fff`,
    phone: profile.phone || '',
    website: profile.website || '',
    location: profile.location || '',
    status: profile.status || 'Online',
    bio: profile.bio || ''
  } : null;

  // Load data from database when user is authenticated
  const loadData = useCallback(async () => {
    if (!user) return;

    setDataLoading(true);
    setDataError(null);

    try {
      // Load tasks
      const tasksData = await tasksService.getAll();
      setTasks(tasksData.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        assigneeId: t.assignee_id || '',
        dueDate: t.due_date || '',
        dueTime: t.due_time || '',
        status: t.status || 'TODO',
        priority: t.priority || 'Medium',
        category: t.category || 'General',
        estimatedHours: Number(t.estimated_hours) || 0,
        tags: t.tags || [],
        attachments: []
      })));

      // Load team members (profiles in same organization)
      const profilesData = await profilesService.getAllInOrganization();
      setUsers(profilesData.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role || 'Accountant',
        avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=3b82f6&color=fff`,
        phone: p.phone || '',
        website: p.website || '',
        location: p.location || '',
        status: p.status || 'Offline',
        bio: p.bio || ''
      })));

      // Load chat messages (from general channel)
      try {
        const channels = await chatService.getChannels();
        if (channels.length > 0) {
          const messagesData = await chatService.getMessages(channels[0].id);
          setMessages(messagesData.map(m => ({
            id: m.id,
            userId: m.user_id,
            channelId: m.channel_id,
            text: m.text,
            timestamp: m.created_at || new Date().toISOString()
          })));
        }
      } catch (chatError) {
        console.log('No chat channels yet');
      }

    } catch (error: any) {
      console.error('Error loading data:', error);
      setDataError(error.message || 'Failed to load data');
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  // Load data when authenticated
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Real-time subscription for tasks
  useEffect(() => {
    if (!user) return;

    const tasksSubscription = tasksService.subscribeToChanges((payload) => {
      if (payload.eventType === 'INSERT') {
        const t = payload.new as any;
        const newTask: Task = {
          id: t.id,
          title: t.title,
          description: t.description || '',
          assigneeId: t.assignee_id || '',
          dueDate: t.due_date || '',
          dueTime: t.due_time || '',
          status: t.status || 'TODO',
          priority: t.priority || 'Medium',
          category: t.category || 'General',
          estimatedHours: Number(t.estimated_hours) || 0,
          tags: t.tags || [],
          attachments: []
        };
        setTasks(prev => {
          if (prev.some(task => task.id === newTask.id)) return prev;
          return [newTask, ...prev];
        });
      } else if (payload.eventType === 'UPDATE') {
        const t = payload.new as any;
        setTasks(prev => prev.map(task => 
          task.id === t.id ? {
            ...task,
            title: t.title,
            description: t.description || '',
            assigneeId: t.assignee_id || '',
            dueDate: t.due_date || '',
            dueTime: t.due_time || '',
            status: t.status || 'TODO',
            priority: t.priority || 'Medium',
            category: t.category || 'General',
            estimatedHours: Number(t.estimated_hours) || 0,
            tags: t.tags || []
          } : task
        ));
      } else if (payload.eventType === 'DELETE') {
        const oldId = (payload.old as any).id;
        setTasks(prev => prev.filter(task => task.id !== oldId));
      }
    });

    return () => {
      tasksSubscription.unsubscribe();
    };
  }, [user]);

  // Apply settings from database
  useEffect(() => {
    if (settings) {
      setLanguage(settings.language || 'NL');
      setDarkMode(settings.dark_mode || false);
      setCompactMode(settings.compact_mode || false);
    }
  }, [settings]);

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
    closeSidebar();
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Ładowanie...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return <AuthForm onSuccess={() => loadData()} />;
  }

  // Show error if data failed to load
  if (dataError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Błąd ładowania danych</h2>
          <p className="text-slate-400 mb-4">{dataError}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => loadData()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Spróbuj ponownie
            </button>
            <button 
              onClick={handleLogout} 
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback current user if profile not loaded yet
  const displayUser = currentUser || {
    id: user.id,
    name: user.email?.split('@')[0] || 'User',
    email: user.email || '',
    role: 'Accountant',
    avatar: `https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff`,
    phone: '',
    website: '',
    location: '',
    status: 'Online' as const,
    bio: ''
  };

  const renderContent = () => {
    if (dataLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      );
    }

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
        return <Chat messages={messages} setMessages={setMessages} users={users} currentUser={displayUser} language={language} />;
      case 'team':
        return <Team users={users} language={language} />;
      case 'profile':
        return <Profile currentUser={displayUser} onUpdateUser={handleUpdateUser} language={language} />;
      case 'calendar':
        return <Calendar 
            tasks={tasks} 
            setTasks={setTasks} 
            users={users} 
            currentUser={displayUser} 
            language={language}
            templates={templates}
        />;
      case 'documents':
        return <Documents language={language} />;
      case 'settings':
        return <Settings 
          language={language} 
          setLanguage={setLanguage} 
          currentUser={displayUser}
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
      
      {/* Holographic Logo Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <img 
          src="/logo.jpg" 
          alt="" 
          className="w-[800px] h-[800px] object-contain opacity-[0.015]"
          style={{ 
            filter: 'grayscale(100%) blur(1px)',
            transform: 'rotate(-10deg)'
          }}
        />
      </div>
      
      {/* Sidebar Component - Responsive logic handled inside */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={handleViewChange} 
        language={language} 
        setLanguage={setLanguage}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden w-full relative z-10 transition-all duration-300">
        
        {/* Mobile Header with Hamburger */}
        <header className="flex md:hidden items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-20 shrink-0 transition-colors">
           <div className="flex items-center gap-3">
              <button onClick={toggleSidebar} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Otwórz menu">
                 <Menu className="w-6 h-6" />
              </button>
              <img src="/logo.jpg" alt="Admin Holland" className="w-8 h-8 rounded object-contain" />
              <h1 className="font-bold text-slate-800 dark:text-white text-lg">Admin Holland</h1>
           </div>
           <div className="flex items-center gap-2">
              <NotificationCenter language={language} onNavigate={handleViewChange} />
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                title="Wyloguj"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <img src={displayUser.avatar} alt="Profile" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600" />
           </div>
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
                  <NotificationCenter language={language} onNavigate={handleViewChange} />
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Wyloguj"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{displayUser.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{displayUser.role}</p>
                  </div>
                  <img src={displayUser.avatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-600 shadow-sm object-cover" />
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
