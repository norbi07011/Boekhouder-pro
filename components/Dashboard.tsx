
import React from 'react';
import { Task, Language, User, TaskStatus } from '../types';
import { DICTIONARY, DUTCH_TAX_DEADLINES } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CheckCircle, Clock, Calendar as CalendarIcon, AlertTriangle, TrendingUp, Users, PlusCircle, ArrowRight, Activity, Zap, Layers } from 'lucide-react';

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
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, colorClass, delay }) => (
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
              <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-lg">{value}</h3>
          </div>
          <div className={`p-3 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-inner group-hover:scale-110 transition-transform duration-300 group-hover:bg-slate-700`}>
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colorClass}`} />
          </div>
      </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ tasks, language, users, setCurrentView }) => {
  const t = DICTIONARY[language];

  // --- STATS CALCULATIONS ---
  const todoCount = tasks.filter(t => t.status === TaskStatus.TODO).length;
  const inProgressCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const doneCount = tasks.filter(t => t.status === TaskStatus.DONE).length;
  const highPriorityCount = tasks.filter(t => t.priority === 'High' && t.status !== TaskStatus.DONE).length;
  
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = tasks.filter(t => t.dueDate < today && t.status !== TaskStatus.DONE).length;

  const statusData = [
    { name: t.todo, value: todoCount, color: '#94a3b8' },
    { name: t.in_progress, value: inProgressCount, color: '#3b82f6' },
    { name: t.done, value: doneCount, color: '#10b981' },
    { name: t.review, value: tasks.filter(t => t.status === TaskStatus.REVIEW).length, color: '#8b5cf6' },
  ];

  const workloadData = users.map(user => {
      const userTasks = tasks.filter(t => t.assigneeId === user.id && t.status !== TaskStatus.DONE).length;
      return {
          name: user.name.split(' ')[0], 
          tasks: userTasks,
          full_name: user.name
      };
  });

  const sortedDeadlines = [...DUTCH_TAX_DEADLINES].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextDeadline = sortedDeadlines.find(d => new Date(d.date) >= new Date()) || sortedDeadlines[0];
  const daysUntilDeadline = Math.ceil((new Date(nextDeadline.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-8">
      
      {/* --- TOP ROW: WELCOME & QUICK ACTIONS --- */}
      <div className="relative rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl border border-slate-700/50 group">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-slate-900">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 mix-blend-overlay"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-slate-900 to-slate-900"></div>
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="max-w-full">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                        {t.dashboard}
                     </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 tracking-tight leading-tight">
                    {t.welcome}
                  </h1>
                  <p className="text-slate-400 font-medium flex items-center text-sm sm:text-base">
                    <CalendarIcon className="w-4 h-4 mr-2 opacity-70 shrink-0" />
                    {new Date().toLocaleDateString(language === 'PL' ? 'pl-PL' : language === 'TR' ? 'tr-TR' : 'nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0">
                 <button 
                    onClick={() => setCurrentView('tasks')}
                    className="group relative flex items-center justify-center px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_10px_30px_-5px_rgba(37,99,235,0.6)] transform hover:-translate-y-1 overflow-hidden w-full sm:w-auto"
                 >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <PlusCircle className="w-5 h-5 mr-2.5" />
                    {t.new_task}
                 </button>
                 <button 
                    onClick={() => setCurrentView('calendar')}
                    className="flex items-center justify-center px-6 py-3.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 text-slate-200 rounded-2xl font-bold transition-all backdrop-blur-md hover:border-slate-500 w-full sm:w-auto"
                 >
                    <CalendarIcon className="w-5 h-5 mr-2.5" />
                    {t.view_calendar}
                 </button>
              </div>
          </div>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <KPICard 
            title={t.in_progress} 
            value={inProgressCount} 
            icon={Zap} 
            colorClass="text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]"
            delay="delay-0"
        />
        <KPICard 
            title={t.high_priority} 
            value={highPriorityCount} 
            icon={AlertTriangle} 
            colorClass="text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]"
            delay="delay-[100ms]"
        />
        <KPICard 
            title={t.overdue} 
            value={overdueCount} 
            icon={Clock} 
            colorClass={`text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)] ${overdueCount > 0 ? 'animate-pulse' : ''}`}
            delay="delay-[200ms]"
        />
        <KPICard 
            title={t.done} 
            value={doneCount} 
            icon={CheckCircle} 
            colorClass="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]"
            delay="delay-[300ms]"
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
                    </div>
                 </GlassCard>
            </div>

            {/* Recent Activity Table */}
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
                    {tasks.slice(0, 4).map((task) => (
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
                            <div className="flex items-center text-xs font-medium text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm self-start sm:self-auto">
                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                {task.dueDate}
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>

        </div>

        {/* --- RIGHT COLUMN: DEADLINES & INFO --- */}
        <div className="lg:col-span-1 space-y-6 md:space-y-8">
            
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
                    
                    <div className="flex items-end gap-2 mb-6">
                        <span className="text-6xl font-black tracking-tighter drop-shadow-md">{daysUntilDeadline}</span>
                        <span className="text-blue-100 font-medium mb-2 text-lg">{t.days_left}</span>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-colors cursor-default">
                        <p className="font-bold text-lg leading-snug shadow-black drop-shadow-sm">
                            {language === 'PL' ? nextDeadline.descriptionPL : language === 'TR' ? nextDeadline.descriptionTR : nextDeadline.descriptionNL}
                        </p>
                        <div className="mt-3 flex items-center text-blue-100 text-sm font-mono">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {nextDeadline.date}
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming List */}
            <GlassCard hoverEffect className="p-6">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center text-lg">
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg mr-3">
                        <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    {t.upcoming_deadlines}
                </h3>
                <div className="space-y-6 relative pl-2">
                    {/* Connector Line */}
                    <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-slate-200 via-slate-100 to-transparent dark:from-slate-700 dark:via-slate-800"></div>

                    {sortedDeadlines.map((deadline, idx) => {
                        const isPast = new Date(deadline.date) < new Date();
                        const isNext = deadline === nextDeadline;
                        return (
                            <div key={idx} className={`relative flex items-start group ${isPast ? 'opacity-50' : ''}`}>
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
                                    <span className="inline-block mt-1 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                        Tax / Belasting
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </GlassCard>

        </div>

      </div>
    </div>
  );
};
