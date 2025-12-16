
import React, { useState, useEffect } from 'react';
import { Task, Language, User, TaskStatus, TaskTemplate, TaskCategory } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, X, Trash2, Save, User as UserIcon, Clock, Target, AlertTriangle, Filter, Wand2, Briefcase, LayoutTemplate, Timer } from 'lucide-react';
import { DICTIONARY, DUTCH_TAX_DEADLINES } from '../constants';

interface CalendarProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  users: User[];
  currentUser: User;
  language: Language;
  templates: TaskTemplate[];
}

type ViewFilter = 'ALL' | 'MINE' | 'DEADLINES';

export const Calendar: React.FC<CalendarProps> = ({ tasks, setTasks, users, currentUser, language, templates }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewFilter, setViewFilter] = useState<ViewFilter>('ALL');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [editingTask, setEditingTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: 'Medium',
    assigneeId: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '',
    category: 'General',
    estimatedHours: 0
  });

  // Smart Builder State
  const [clientName, setClientName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const t = DICTIONARY[language];

  // Dynamic Year Generation
  const currentYear = new Date().getFullYear();
  const futureYears = [currentYear, currentYear + 1, currentYear + 2, currentYear + 3];

  // Logic to auto-generate title based on smart inputs
  useEffect(() => {
    if (!isEditing && isModalOpen) {
       // Only auto-generate for new tasks
       if (selectedTemplate && clientName) {
         const periodStr = selectedPeriod ? ` ${selectedPeriod}` : '';
         const yearStr = selectedYear ? ` ${selectedYear}` : '';
         setEditingTask(prev => ({
           ...prev,
           title: `${selectedTemplate}${periodStr}${yearStr} - ${clientName}`
         }));
       }
    }
  }, [clientName, selectedTemplate, selectedPeriod, selectedYear, isEditing, isModalOpen]);

  // Localization Helpers
  const getLocale = () => {
    switch (language) {
      case 'PL': return 'pl-PL';
      case 'TR': return 'tr-TR';
      case 'NL': return 'nl-NL';
      default: return 'en-US';
    }
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const monthName = capitalize(new Intl.DateTimeFormat(getLocale(), { month: 'long', year: 'numeric' }).format(currentDate));
  
  // Calendar Logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getContentForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;

    let dayTasks: Task[] = [];
    if (viewFilter !== 'DEADLINES') {
        dayTasks = tasks.filter(t => t.dueDate === dateStr);
        if (viewFilter === 'MINE') {
            dayTasks = dayTasks.filter(t => t.assigneeId === currentUser.id);
        }
    }

    let dayDeadlines: any[] = [];
    if (viewFilter === 'ALL' || viewFilter === 'DEADLINES') {
        dayDeadlines = DUTCH_TAX_DEADLINES.filter(d => d.date === dateStr);
    }

    return { dayTasks, dayDeadlines };
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2023, 0, i + 2); 
    return new Intl.DateTimeFormat(getLocale(), { weekday: 'short' }).format(d);
  });

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  // --- Handlers ---

  const handleDayClick = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;

    setEditingTask({
      title: '',
      description: '',
      status: TaskStatus.TODO,
      priority: 'Medium',
      assigneeId: currentUser.id,
      dueDate: dateStr,
      dueTime: '',
      category: 'General',
      estimatedHours: 0
    });
    // Reset smart builders
    setClientName('');
    setSelectedTemplate('');
    setSelectedPeriod('');
    
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleTaskClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setEditingTask(task);
    setIsEditing(true);
    // Try to extract client name from title if possible, else empty
    setClientName(task.title.split('-').pop()?.trim() || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask.title) return;

    if (isEditing && editingTask.id) {
      // Update existing
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...editingTask } as Task : t));
    } else {
      // Create new
      const newTask: Task = {
        ...(editingTask as Task),
        id: Math.random().toString(36).substr(2, 9),
        tags: [],
        attachments: editingTask.attachments || []
      };
      setTasks([...tasks, newTask]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (editingTask.id) {
      setTasks(tasks.filter(t => t.id !== editingTask.id));
      setIsModalOpen(false);
    }
  };

  const applyTemplate = (tpl: TaskTemplate) => {
     setSelectedTemplate(tpl.title);
     
     let desc = tpl.descNL;
     if (language === 'PL') desc = tpl.descPL;
     if (language === 'TR') desc = tpl.descTR;

     setEditingTask(prev => ({
        ...prev,
        description: desc,
        priority: tpl.priority as any,
        category: tpl.category || 'General'
     }));
  };

  return (
    <div className="h-full w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300 p-2 sm:p-6 flex flex-col shadow-[inset_0_0_40px_rgba(0,0,0,0.1)]">
      
      {/* Dynamic Background Orbs for Depth */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />

      {/* Main Glass Panel */}
      <div className="relative z-10 flex-1 flex flex-col bg-white/10 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl overflow-hidden ring-1 ring-white/50">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-b border-white/20 bg-gradient-to-r from-white/20 to-transparent gap-4">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-3 rounded-xl shadow-lg shadow-blue-500/40 border border-blue-400/50 hidden sm:block">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
               <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight drop-shadow-sm">
                 {monthName}
               </h2>
               <p className="text-slate-500 text-sm font-medium">{t.manage_deadlines}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
             {/* Filter Tabs */}
             <div className="flex bg-slate-100/50 backdrop-blur-md p-1 rounded-xl border border-white/40 shadow-inner shrink-0">
                <button 
                  onClick={() => setViewFilter('ALL')}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewFilter === 'ALL' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t.all_tasks}
                </button>
                <button 
                  onClick={() => setViewFilter('MINE')}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewFilter === 'MINE' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t.my_tasks}
                </button>
                <button 
                  onClick={() => setViewFilter('DEADLINES')}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewFilter === 'DEADLINES' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Deadlines
                </button>
             </div>

             <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-100/30 p-1.5 rounded-xl border border-white/40 backdrop-blur-sm shadow-inner shrink-0">
                <button 
                    onClick={goToToday}
                    title="Today"
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-white text-slate-600 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
                >
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="h-6 w-px bg-slate-300/50 mx-1"></div>
                <button onClick={prevMonth} className="p-1.5 sm:p-2 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-all shadow-sm hover:shadow-md">
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button onClick={nextMonth} className="p-1.5 sm:p-2 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-all shadow-sm hover:shadow-md">
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
             </div>
              <button 
                onClick={() => {
                    setEditingTask({
                    title: '',
                    description: '',
                    status: TaskStatus.TODO,
                    priority: 'Medium',
                    assigneeId: currentUser.id,
                    dueDate: new Date().toISOString().split('T')[0],
                    dueTime: '',
                    category: 'General',
                    estimatedHours: 0
                    });
                    setClientName('');
                    setIsEditing(false);
                    setIsModalOpen(true);
                }}
                className="hidden sm:flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl shadow-slate-900/20 transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                <Plus className="w-4 h-4 mr-2" />
                {t.new_task}
             </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-white/10 bg-slate-50/20">
          {weekDays.map((day, idx) => (
            <div key={idx} className="py-2 sm:py-4 text-center text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest shadow-sm">
              {day}
            </div>
          ))}
        </div>

        {/* 3D Tile Grid */}
        <div className="flex-1 p-2 sm:p-4 grid grid-cols-7 grid-rows-5 gap-1 sm:gap-3 overflow-y-auto">
          {days.map((day, idx) => {
            if (!day) return <div key={idx} className="rounded-xl border border-transparent" />;
            
            const { dayTasks, dayDeadlines } = getContentForDay(day);
            const today = isToday(day);

            return (
              <div 
                key={idx} 
                onClick={() => handleDayClick(day)}
                className={`
                  relative rounded-xl sm:rounded-2xl p-1 sm:p-3 flex flex-col justify-between transition-all duration-300 ease-out group cursor-pointer
                  border border-white/60 shadow-sm min-h-[60px] sm:min-h-[100px]
                  ${today 
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 ring-1 sm:ring-2 ring-blue-500/30' 
                    : 'bg-gradient-to-br from-white/40 to-white/10 hover:from-white/80 hover:to-white/40'}
                  
                  hover:scale-[1.05] hover:z-20 hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] hover:border-blue-300/50
                `}
              >
                {/* Glass Shine Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="flex justify-between items-start z-10">
                  <span 
                    className={`
                      text-xs sm:text-lg font-bold flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-colors
                      ${today 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' 
                        : 'text-slate-600 group-hover:text-blue-700 bg-white/50 group-hover:bg-white'}
                    `}
                  >
                    {day}
                  </span>
                  
                  {/* Dots indicator */}
                  {(dayTasks.length > 0 || dayDeadlines.length > 0) && (
                     <div className="flex space-x-0.5 sm:space-x-1 mt-1 sm:mt-0">
                        {dayDeadlines.map((_, i) => (
                           <div key={`d-${i}`} className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-orange-500 shadow-sm" />
                        ))}
                        {dayTasks.slice(0, 3 - dayDeadlines.length).map((t, i) => (
                           <div key={`t-${i}`} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${t.priority === 'High' ? 'bg-red-500' : 'bg-blue-500'} shadow-sm`} />
                        ))}
                     </div>
                  )}
                </div>

                <div className="space-y-1 sm:space-y-1.5 mt-1 sm:mt-2 z-10 overflow-hidden">
                  {/* Render Deadlines First */}
                  {dayDeadlines.map((deadline, i) => (
                    <div 
                        key={`dl-${i}`}
                        className="text-[8px] sm:text-[10px] truncate px-1 sm:px-2 py-0.5 sm:py-1.5 rounded sm:rounded-lg font-bold shadow-sm backdrop-blur-md border border-orange-200 bg-orange-100/90 text-orange-800 flex items-center justify-center sm:justify-start"
                        title={language === 'PL' ? deadline.descriptionPL : language === 'TR' ? deadline.descriptionTR : deadline.descriptionNL}
                    >
                        <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 sm:mr-1 inline-block" />
                        <span className="hidden sm:inline">Tax</span>
                    </div>
                  ))}

                  {/* Render Tasks */}
                  {dayTasks.slice(0, 2 - (dayDeadlines.length > 0 ? 1 : 0)).map((task) => (
                    <div 
                      key={task.id}
                      onClick={(e) => handleTaskClick(e, task)}
                      className={`
                        text-[8px] sm:text-[10px] truncate px-1 sm:px-2 py-0.5 sm:py-1.5 rounded sm:rounded-lg font-medium shadow-sm backdrop-blur-md border transition-all hover:scale-105
                        ${task.status === TaskStatus.DONE ? 'opacity-50 line-through grayscale' : ''}
                        ${task.priority === 'High' 
                          ? 'bg-red-50/90 border-red-200 text-red-700 group-hover:bg-red-100' 
                          : 'bg-blue-50/90 border-blue-200 text-blue-700 group-hover:bg-blue-100'}
                      `}
                    >
                      {task.dueTime && <span className="mr-1 text-slate-500 font-bold">{task.dueTime}</span>}
                      {task.title}
                    </div>
                  ))}
                  
                  {(dayTasks.length + dayDeadlines.length) > 2 && (
                     <div className="text-[8px] sm:text-[10px] text-slate-500 font-medium pl-1">
                       <span className="sm:hidden">+</span> <span className="hidden sm:inline">+ {(dayTasks.length + dayDeadlines.length) - 2} more</span>
                     </div>
                  )}
                </div>

                {/* Bottom Highlight Line for 3D feel */}
                <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Modern Glass Modal with Extended Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/50 w-full sm:w-[700px] h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 flex flex-col">
            {/* Same Modal Header as TaskList, copied for consistency */}
            <div className="p-4 sm:p-6 border-b border-slate-200/60 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white sticky top-0 z-20 shrink-0">
              <div className="flex items-center gap-3">
                 <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    {isEditing ? <Target className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                 </div>
                 <h3 className="text-xl font-bold text-slate-800">
                    {isEditing ? t.edit_task : t.new_task}
                 </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
              {/* Simplified content for Calendar Modal reusing same styles as TaskList */}
              {!isEditing && (
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 shadow-inner">
                    <div className="flex items-center mb-3">
                        <Wand2 className="w-4 h-4 text-blue-500 mr-2" />
                        <label className="text-xs font-bold text-slate-500 uppercase">{t.quick_templates}</label>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                        {templates.map((tpl, idx) => (
                            <button
                                key={tpl.id || idx}
                                type="button"
                                onClick={() => applyTemplate(tpl)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all transform hover:scale-105 ${selectedTemplate === tpl.title ? 'ring-2 ring-offset-1 ring-blue-500' : ''} ${tpl.color}`}
                            >
                                {tpl.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-12 sm:col-span-6">
                             <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.client_name}</label>
                             <div className="relative">
                                <Briefcase className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    placeholder={t.client_name}
                                    className="w-full pl-8 bg-white border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                             </div>
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                             <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.period}</label>
                             <select 
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                             >
                                <option value="">-</option>
                                <option value="Q1">Q1</option>
                                <option value="Q2">Q2</option>
                                <option value="Q3">Q3</option>
                                <option value="Q4">Q4</option>
                                <option value="Jan">Jan</option>
                                <option value="Feb">Feb</option>
                                <option value="Mar">Mar</option>
                             </select>
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                             <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.year}</label>
                             <select 
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                             >
                                {futureYears.map(yr => (
                                    <option key={yr} value={yr}>{yr}</option>
                                ))}
                             </select>
                        </div>
                    </div>
                  </div>
              )}

              {/* Title & Category Row */}
              <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-12 md:col-span-8">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.title}</label>
                    <input
                    type="text"
                    required
                    value={editingTask.title}
                    onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 placeholder-slate-400 shadow-sm"
                    placeholder={t.title}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.category}</label>
                      <div className="relative">
                          <LayoutTemplate className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
                          <select
                            value={editingTask.category || 'General'}
                            onChange={e => setEditingTask({...editingTask, category: e.target.value as TaskCategory})}
                            className="w-full pl-10 bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium text-slate-700"
                          >
                             <option value="General">{t.cat_general}</option>
                             <option value="Tax">{t.cat_tax}</option>
                             <option value="Payroll">{t.cat_payroll}</option>
                             <option value="Audit">{t.cat_audit}</option>
                             <option value="Meeting">{t.cat_meeting}</option>
                             <option value="Advisory">{t.cat_advisory}</option>
                          </select>
                      </div>
                  </div>
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                 <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.dueDate}</label>
                    <div className="relative group">
                       <CalendarIcon className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                       <input
                          type="date"
                          required
                          value={editingTask.dueDate}
                          onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})}
                          className="w-full pl-10 bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer font-medium text-slate-700"
                       />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.dueTime}</label>
                    <div className="relative group">
                       <Clock className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                       <input
                          type="time"
                          value={editingTask.dueTime}
                          onChange={e => setEditingTask({...editingTask, dueTime: e.target.value})}
                          className="w-full pl-10 bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer font-medium text-slate-700"
                       />
                    </div>
                 </div>
              </div>

              {/* Status, Priority & Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.priority}</label>
                    <div className="relative">
                        <select
                        value={editingTask.priority}
                        onChange={e => setEditingTask({...editingTask, priority: e.target.value as any})}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none px-4 font-medium text-slate-700"
                        >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        </select>
                        <div className="absolute right-3 top-3 pointer-events-none">
                            <Filter className="w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.status}</label>
                    <select
                       value={editingTask.status}
                       onChange={e => setEditingTask({...editingTask, status: e.target.value as any})}
                       className="w-full bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                    >
                       {Object.values(TaskStatus).map(s => (
                         <option key={s} value={s}>{s.replace('_', ' ')}</option>
                       ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.estimated_hours}</label>
                    <div className="relative">
                        <Timer className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
                        <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={editingTask.estimatedHours}
                            onChange={e => setEditingTask({...editingTask, estimatedHours: parseFloat(e.target.value)})}
                            className="w-full pl-10 bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                            placeholder="0.0"
                        />
                    </div>
                </div>
              </div>

              <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.assignee}</label>
                   <div className="relative group">
                      <UserIcon className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <select
                         value={editingTask.assigneeId || ''}
                         onChange={e => setEditingTask({...editingTask, assigneeId: e.target.value})}
                         className="w-full pl-10 bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all font-medium text-slate-700"
                      >
                         <option value="">-</option>
                         {users.map(u => (
                           <option key={u.id} value={u.id}>{u.name}</option>
                         ))}
                      </select>
                   </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.description}</label>
                <textarea
                  value={editingTask.description}
                  onChange={e => setEditingTask({...editingTask, description: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none h-28 resize-none transition-all shadow-inner placeholder-slate-400"
                  placeholder={t.description}
                />
              </div>

              <div className="flex justify-between items-center pt-5 border-t border-slate-100 mt-2 sticky bottom-0 bg-white z-10 pb-2">
                 {isEditing ? (
                    <button 
                       type="button" 
                       onClick={handleDelete}
                       className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center text-sm font-bold"
                    >
                       <Trash2 className="w-4 h-4 mr-2" />
                       <span className="hidden sm:inline">{t.delete_task}</span>
                    </button>
                 ) : <div></div>}
                 
                 <div className="flex space-x-3">
                    <button 
                       type="button"
                       onClick={() => setIsModalOpen(false)}
                       className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors"
                    >
                       {t.cancel}
                    </button>
                    <button 
                       type="submit"
                       className="px-6 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-slate-900/40 flex items-center text-sm font-bold transition-all transform hover:-translate-y-0.5"
                    >
                       <Save className="w-4 h-4 mr-2" />
                       {t.save_changes}
                    </button>
                 </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
