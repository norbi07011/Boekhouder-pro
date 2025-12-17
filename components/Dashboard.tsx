
import React, { useState, useEffect } from 'react';
import { Task, Language, User, TaskStatus } from '../types';
import { DICTIONARY } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CheckCircle, Clock, Calendar as CalendarIcon, AlertTriangle, TrendingUp, Users, PlusCircle, ArrowRight, Activity, Zap, Layers, RefreshCw } from 'lucide-react';
import { dashboardService, DashboardStats, TaxDeadline, RecentActivity, TeamWorkload } from '../src/services/dashboardService';

interface DashboardProps {
  tasks: Task[];
  language: Language;
  users: User[];
  setCurrentView: (view: string) => void;
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = false }) => (
  <div className={`
      relative overflow-hidden rounded-3xl backdrop-blur-xl border border-slate-200/60
      bg-gradient-to-br from-white/80 via-slate-50/50 to-white/40 shadow-sm
      dark:bg-gradient-to-br dark:from-slate-800/80 dark:via-slate-900/50 dark:to-slate-800/40 dark:border-slate-700/60
      ${hoverEffect ? 'transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)] hover:border-blue-300/50 hover:-translate-y-1' : ''}
      ${className}
  `}>
      {children}
  </div>
);

interface KPICardProps {
    title: string;
    value: number;
    icon: any;
    colorClass: string;
    delay: string;
    loading?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, colorClass, delay, loading }) => (
  <div className={`
      group relative p-5 rounded-3xl overflow-hidden transition-all duration-500 ease-out cursor-default
      bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50
      hover:shadow-[0_0_40px_-5px_rgba(59,130,246,0.3)] hover:border-blue-500/50 hover:scale-[1.02]
      ${delay} animate-[fadeIn_0.5s_ease-out_both]
  `}>
      {/* Inner Glow Effect */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10 flex justify-between items-start">
          <div>
              <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 group-hover:text-blue-300 transition-colors truncate">{title}</p>
              {loading ? (
                <div className="h-10 w-16 animate-pulse bg-slate-700 rounded" />
              ) : (
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-lg">{value}</h3>
              )}
          </div>
          <div className={`p-3 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-inner group-hover:scale-110 transition-transform duration-300 group-hover:bg-slate-700`}>
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colorClass}`} />
          </div>
      </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ tasks, language, users, setCurrentView }) => {
  const t = DICTIONARY[language];

  // --- STATE FOR DATABASE DATA ---
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    todoCount: 0,
    inProgressCount: 0,
    reviewCount: 0,
    doneCount: 0,
    highPriorityCount: 0,
    overdueCount: 0,
    totalTasks: 0
  });
  const [deadlines, setDeadlines] = useState<TaxDeadline[]>([]);
  const [nextDeadline, setNextDeadline] = useState<TaxDeadline | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [teamWorkload, setTeamWorkload] = useState<TeamWorkload[]>([]);

  // --- LOAD DATA FROM DATABASE ---
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, deadlinesData, nextDeadlineData, activityData, workloadData] = await Promise.all([
        dashboardService.getTaskStats(),
        dashboardService.getUpcomingDeadlines(5),
        dashboardService.getNextDeadline(),
        dashboardService.getRecentActivity(4),
        dashboardService.getTeamWorkload()
      ]);

      setStats(statsData);
      setDeadlines(deadlinesData);
      setNextDeadline(nextDeadlineData);
      setRecentActivity(activityData);
      setTeamWorkload(workloadData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // --- CHART DATA FROM DATABASE ---
  const statusData = [
    { name: t.todo, value: stats.todoCount, color: '#94a3b8' },
    { name: t.in_progress, value: stats.inProgressCount, color: '#3b82f6' },
    { name: t.done, value: stats.doneCount, color: '#10b981' },
    { name: t.review, value: stats.reviewCount, color: '#8b5cf6' },
  ];

  const workloadData = teamWorkload.map(w => ({
    name: w.name.split(' ')[0],
    tasks: w.taskCount,
    full_name: w.name
  }));

  // Calculate days until next deadline
  const daysUntilDeadline = nextDeadline ? dashboardService.daysUntil(nextDeadline.date) : 0;

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-8">
      
      {/* --- TOP ROW: WELCOME & QUICK ACTIONS --- */}
      <div className="relative rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl border border-slate-700/50 group">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
          </div>
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/30 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <p className="text-blue-200/80 text-xs font-semibold tracking-wider uppercase mb-1">{new Date().toLocaleDateString(language === 'NL' ? 'nl-NL' : language === 'TR' ? 'tr-TR' : 'pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-1">{t.welcome}</h1>
                  <p className="text-slate-400 flex items-center text-sm">
                      <Zap className="w-4 h-4 text-yellow-400 mr-2 animate-pulse" />
                      <span className="text-slate-300 font-semibold">{stats.totalTasks}</span>&nbsp;{language === 'NL' ? 'taken actief' : language === 'TR' ? 'görev aktif' : 'zadań aktywnych'}
                  </p>
              </div>
              <div className="flex gap-3">
                  <button 
                    onClick={loadDashboardData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-700/50 border border-slate-600 hover:bg-slate-600/50 text-slate-300 hover:text-white font-semibold text-sm transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Laden...' : 'Vernieuwen'}
                  </button>
                  <button onClick={() => setCurrentView('tasks')} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all">
                      <PlusCircle className="w-4 h-4" />
                      {t.new_task}
                  </button>
                  <button onClick={() => setCurrentView('calendar')} className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-700/50 border border-slate-600 hover:bg-slate-600/50 text-slate-300 hover:text-white font-semibold text-sm transition-all">
                      <CalendarIcon className="w-4 h-4" />
                      {t.calendar}
                      <ArrowRight className="w-4 h-4"/>
                  </button>
              </div>
          </div>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard 
            title={t.in_progress} 
            value={stats.inProgressCount} 
            icon={Activity} 
            colorClass="text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            delay="delay-[0ms]"
            loading={loading}
        />
        <KPICard 
            title={t.high_priority} 
            value={stats.highPriorityCount} 
            icon={AlertTriangle} 
            colorClass="text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]"
            delay="delay-[100ms]"
            loading={loading}
        />
        <KPICard 
            title={t.overdue} 
            value={stats.overdueCount} 
            icon={Clock} 
            colorClass={`text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)] ${stats.overdueCount > 0 ? 'animate-pulse' : ''}`}
            delay="delay-[200ms]"
            loading={loading}
        />
        <KPICard 
            title={t.done} 
            value={stats.doneCount} 
            icon={CheckCircle} 
            colorClass="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]"
            delay="delay-[300ms]"
            loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* --- LEFT COLUMN: CHARTS --- */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                 {/* Pie Chart */}
                 <GlassCard hoverEffect className="p-4 md:p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center text-lg">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg mr-3">
                            <Layers className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        {t.task_distribution}
                    </h3>
                    <div className="h-64 w-full">
                        {loading ? (
                          <div className="h-full flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                              data={statusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                              >
                              {statusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                              </Pie>
                              <Tooltip 
                                  contentStyle={{ 
                                      borderRadius: '16px', 
                                      border: '1px solid rgba(255,255,255,0.2)', 
                                      background: 'rgba(30, 41, 59, 0.9)',
                                      color: '#fff',
                                      backdropFilter: 'blur(10px)',
                                      boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)' 
                                  }} 
                              />
                              <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                          </PieChart>
                          </ResponsiveContainer>
                        )}
                    </div>
                 </GlassCard>

                 {/* Workload Bar Chart */}
                 <GlassCard hoverEffect className="p-4 md:p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center text-lg">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg mr-3">
                            <Users className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        {t.team_workload}
                    </h3>
                    <div className="h-64 w-full">
                        {loading ? (
                          <div className="h-full flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                          </div>
                        ) : workloadData.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                            {language === 'PL' ? 'Brak danych o zespole' : language === 'TR' ? 'Takım verisi yok' : 'Geen teamgegevens'}
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={workloadData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                  <Tooltip 
                                      cursor={{fill: '#f1f5f9'}} 
                                      contentStyle={{ 
                                          borderRadius: '16px', 
                                          border: '1px solid rgba(255,255,255,0.2)', 
                                          background: 'rgba(30, 41, 59, 0.9)',
                                          color: '#fff',
                                          backdropFilter: 'blur(10px)',
                                          boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)'
                                      }} 
                                  />
                                  <Bar dataKey="tasks" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={30}>
                                      {workloadData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                                      ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                        )}
                    </div>
                 </GlassCard>
            </div>

            {/* Recent Activity Table - NOW FROM DATABASE! */}
            <GlassCard hoverEffect className="p-0">
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/30">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center text-lg">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg mr-3">
                            <Activity className="w-5 h-5 text-blue-500" />
                        </div>
                        {t.recent_activity}
                    </h3>
                    <button onClick={() => setCurrentView('tasks')} className="px-4 py-1.5 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">
                        {t.all_tasks} &rarr;
                    </button>
                </div>
                <div className="p-2">
                    {loading ? (
                      <div className="p-8 flex justify-center">
                        <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                      </div>
                    ) : recentActivity.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        {language === 'PL' ? 'Brak ostatniej aktywności' : language === 'TR' ? 'Son aktivite yok' : 'Geen recente activiteit'}
                      </div>
                    ) : (
                      recentActivity.map((task) => (
                        <div key={task.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700 mb-1 gap-2">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${
                                    task.priority === 'High' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 
                                    task.priority === 'Medium' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>
                                   {task.priority === 'High' ? <AlertTriangle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors truncate">{task.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[250px]">{task.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                                  task.status === 'DONE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                  task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                  task.status === 'REVIEW' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {task.status === 'DONE' ? t.done : task.status === 'IN_PROGRESS' ? t.in_progress : task.status === 'REVIEW' ? t.review : t.todo}
                                </span>
                                <div className="flex items-center text-xs font-medium text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                                    {task.dueDate || '-'}
                                </div>
                            </div>
                        </div>
                      ))
                    )}
                </div>
            </GlassCard>

        </div>

        {/* --- RIGHT COLUMN: DEADLINES & INFO --- */}
        <div className="lg:col-span-1 space-y-6 md:space-y-8">
            
            {/* Next Deadline Card - NOW FROM DATABASE! */}
            <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl group">
                <div className="absolute inset-0 bg-blue-600">
                     <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-500"></div>
                     <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
                     <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-blue-300/20 rounded-full blur-2xl"></div>
                </div>

                <div className="relative z-10 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider">
                            {t.next_deadline}
                        </span>
                        <TrendingUp className="w-5 h-5 text-blue-200" />
                    </div>
                    
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-16 w-24 bg-white/20 rounded mb-6" />
                        <div className="h-20 bg-white/10 rounded-2xl" />
                      </div>
                    ) : nextDeadline ? (
                      <>
                        <div className="flex items-end gap-2 mb-6">
                            <span className={`text-6xl font-black tracking-tighter drop-shadow-md ${daysUntilDeadline < 0 ? 'text-red-300' : daysUntilDeadline <= 7 ? 'text-yellow-300' : ''}`}>
                              {daysUntilDeadline}
                            </span>
                            <span className="text-blue-100 font-medium mb-2 text-lg">{t.days_left}</span>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-colors cursor-default">
                            <p className="font-bold text-lg leading-snug shadow-black drop-shadow-sm">
                                {language === 'PL' ? nextDeadline.descriptionPL : language === 'TR' ? nextDeadline.descriptionTR : nextDeadline.descriptionNL}
                            </p>
                            <div className="mt-3 flex items-center text-blue-100 text-sm font-mono">
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                {new Date(nextDeadline.date).toLocaleDateString(language === 'NL' ? 'nl-NL' : language === 'TR' ? 'tr-TR' : 'pl-PL')}
                            </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-blue-100">
                        {language === 'PL' ? 'Brak nadchodzących terminów' : language === 'TR' ? 'Yaklaşan son tarih yok' : 'Geen aanstaande deadlines'}
                      </div>
                    )}
                </div>
            </div>

            {/* Upcoming List - NOW FROM DATABASE! */}
            <GlassCard hoverEffect className="p-6">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center text-lg">
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg mr-3">
                        <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    {t.upcoming_deadlines}
                </h3>
                {loading ? (
                  <div className="p-8 flex justify-center">
                    <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                  </div>
                ) : deadlines.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    {language === 'PL' ? 'Brak nadchodzących terminów' : language === 'TR' ? 'Yaklaşan son tarih yok' : 'Geen aanstaande deadlines'}
                  </div>
                ) : (
                  <div className="space-y-6 relative pl-2">
                      {/* Connector Line */}
                      <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-slate-200 via-slate-100 to-transparent dark:from-slate-700 dark:via-slate-800"></div>

                      {deadlines.map((deadline, idx) => {
                          const daysLeft = dashboardService.daysUntil(deadline.date);
                          const isNext = idx === 0;
                          const isPast = daysLeft < 0;
                          return (
                              <div key={deadline.id} className={`relative flex items-start group ${isPast ? 'opacity-50' : ''}`}>
                                  <div className={`
                                      relative z-10 w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg shrink-0 transition-transform group-hover:scale-110
                                      ${isNext ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border-slate-50'}
                                  `}>
                                      <span className="text-lg font-black leading-none">{new Date(deadline.date).getDate()}</span>
                                      <span className="text-[10px] font-bold uppercase mt-0.5">{new Date(deadline.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                                  </div>
                                  <div className="ml-4 pt-1">
                                      <p className={`text-sm font-medium leading-snug transition-colors ${isNext ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white'}`}>
                                           {language === 'PL' ? deadline.descriptionPL : language === 'TR' ? deadline.descriptionTR : deadline.descriptionNL}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="inline-block text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                            Tax / Belasting
                                        </span>
                                        <span className={`text-[10px] font-bold ${daysLeft <= 7 ? 'text-orange-500' : daysLeft <= 30 ? 'text-blue-500' : 'text-slate-400'}`}>
                                          {daysLeft} {language === 'PL' ? 'dni' : language === 'TR' ? 'gün' : 'dagen'}
                                        </span>
                                      </div>
                                  </div>
                              </div>
                          )
                      })}
                  </div>
                )}
            </GlassCard>

        </div>

      </div>
    </div>
  );
};
