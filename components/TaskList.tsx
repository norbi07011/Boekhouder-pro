
import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, Language, User, TaskTemplate, TaskAttachment, TaskCategory } from '../types';
import { DICTIONARY } from '../constants';
import { Plus, MoreHorizontal, User as UserIcon, Calendar, Search, Filter, Wand2, Briefcase, X, Clock, Trash2, Save, Target, CheckCircle2, ArrowRight, LayoutTemplate, Settings, Edit2, Palette, Check, Paperclip, Mic, Image as ImageIcon, Play, Pause, FileText, Download, Eye, Maximize2, Hash, FileBarChart, Calculator, Timer } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  language: Language;
  users: User[];
  templates: TaskTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<TaskTemplate[]>>;
  compactMode: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, setTasks, language, users, templates, setTemplates, compactMode }) => {
  const t = DICTIONARY[language];
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // --- TEMPLATE MANAGER STATE ---
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [managerView, setManagerView] = useState<'LIST' | 'EDIT' | 'CREATE'>('LIST');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  
  // Template Form State
  const [templateForm, setTemplateForm] = useState({
      label: '',
      desc: '',
      color: 'bg-blue-100 text-blue-700 border-blue-200'
  });

  const availableColors = [
      { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', name: 'Blue' },
      { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', name: 'Green' },
      { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', name: 'Purple' },
      { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', name: 'Orange' },
      { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', name: 'Red' },
      { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', name: 'Pink' },
      { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', name: 'Teal' },
      { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', name: 'Cyan' },
      { bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-200', name: 'Lime' },
      { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', name: 'Slate' },
  ];

  // --- TASK STATE ---
  const [currentUser] = useState(users[0]); // Simulating logged in user for "My Tasks"
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'MINE'>('ALL');

  const [isEditing, setIsEditing] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '',
    priority: 'Medium',
    assigneeId: '',
    status: TaskStatus.TODO,
    category: 'General',
    estimatedHours: 0,
    attachments: []
  });

  // --- ATTACHMENT STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  
  // Lightbox/Preview State
  const [previewFile, setPreviewFile] = useState<{url: string, type: 'image' | 'pdf'} | null>(null);

  const [clientName, setClientName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Dynamic Year Generation
  const currentYear = new Date().getFullYear();
  const futureYears = [currentYear, currentYear + 1, currentYear + 2, currentYear + 3];

  // --- EFFECTS ---

  useEffect(() => {
    if (!isEditing && isModalOpen) {
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

  // Clean up timer on unmount
  useEffect(() => {
      return () => {
          if (timerRef.current) clearInterval(timerRef.current);
      };
  }, []);

  // --- HANDLERS ---

  const handleOpenModal = (task?: Task) => {
      if (task) {
          setIsEditing(true);
          setEditingTask(task);
          setClientName(task.title.split('-').pop()?.trim() || '');
      } else {
          setIsEditing(false);
          setEditingTask({
            title: '',
            description: '',
            dueDate: new Date().toISOString().split('T')[0],
            dueTime: '',
            priority: 'Medium',
            assigneeId: '',
            status: TaskStatus.TODO,
            category: 'General',
            estimatedHours: 0,
            attachments: []
          });
          setClientName('');
          setSelectedTemplate('');
          setSelectedPeriod('');
      }
      setIsModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask.title) return;

    if (isEditing && editingTask.id) {
        setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...editingTask } as Task : t));
    } else {
        const task: Task = {
            ...(editingTask as Task),
            id: Math.random().toString(36).substr(2, 9),
            tags: [],
            attachments: editingTask.attachments || []
        };
        setTasks([...tasks, task]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
      if (editingTask.id) {
          setTasks(tasks.filter(t => t.id !== editingTask.id));
          setIsModalOpen(false);
      }
  };

  // --- ATTACHMENT HANDLERS ---

  const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const isImage = file.type.startsWith('image/');
          const reader = new FileReader();
          
          reader.onload = (event) => {
              const newAttachment: TaskAttachment = {
                  id: Date.now().toString(),
                  type: isImage ? 'image' : 'file',
                  name: file.name,
                  url: event.target?.result as string,
                  size: (file.size / 1024).toFixed(1) + ' KB',
                  timestamp: new Date().toISOString()
              };
              setEditingTask(prev => ({
                  ...prev,
                  attachments: [...(prev.attachments || []), newAttachment]
              }));
          };
          reader.readAsDataURL(file);
      }
  };

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
              audioChunksRef.current.push(event.data);
          };

          mediaRecorder.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const audioUrl = URL.createObjectURL(audioBlob);
              
              // Calculate duration from start time
              const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
              const durationStr = formatDuration(durationSec);

              const newAttachment: TaskAttachment = {
                  id: Date.now().toString(),
                  type: 'voice',
                  name: `${t.voice_note} (${durationStr})`,
                  url: audioUrl,
                  timestamp: new Date().toISOString()
              };
              setEditingTask(prev => ({
                  ...prev,
                  attachments: [...(prev.attachments || []), newAttachment]
              }));
              
              // Stop tracks
              stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
          setRecordingDuration(0);
          startTimeRef.current = Date.now();
          
          timerRef.current = setInterval(() => {
              setRecordingDuration(prev => prev + 1);
          }, 1000);

      } catch (err) {
          console.error('Error accessing microphone:', err);
          alert('Microphone access denied or not available.');
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
      }
  };

  const removeAttachment = (id: string) => {
      setEditingTask(prev => ({
          ...prev,
          attachments: prev.attachments?.filter(a => a.id !== id)
      }));
  };

  const downloadFile = (url: string, name: string) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- TEMPLATE MANAGER HANDLERS ---

  const openManager = () => {
      setManagerView('LIST');
      setIsManagerOpen(true);
  };

  const startCreateTemplate = () => {
      setTemplateForm({ label: '', desc: '', color: availableColors[0].bg + ' ' + availableColors[0].text + ' ' + availableColors[0].border });
      setManagerView('CREATE');
  };

  const startEditTemplate = (tpl: TaskTemplate) => {
      setEditingTemplateId(tpl.id || '');
      const currentDesc = language === 'PL' ? tpl.descPL : language === 'TR' ? tpl.descTR : tpl.descNL;
      setTemplateForm({ 
          label: tpl.label, 
          desc: currentDesc, 
          color: tpl.color 
      });
      setManagerView('EDIT');
  };

  const handleDeleteTemplate = (id: string) => {
      setTemplates(templates.filter(t => t.id !== id));
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
      e.preventDefault();
      if (!templateForm.label) return;

      if (managerView === 'CREATE') {
          const newTpl: TaskTemplate = {
              id: `custom-${Date.now()}`,
              label: templateForm.label,
              title: templateForm.label,
              descPL: templateForm.desc,
              descTR: templateForm.desc,
              descNL: templateForm.desc,
              priority: 'Medium',
              color: templateForm.color
          };
          setTemplates([...templates, newTpl]);
      } else if (managerView === 'EDIT' && editingTemplateId) {
          setTemplates(templates.map(t => t.id === editingTemplateId ? {
              ...t,
              label: templateForm.label,
              title: templateForm.label,
              descPL: templateForm.desc,
              descTR: templateForm.desc,
              descNL: templateForm.desc,
              color: templateForm.color
          } : t));
      }

      setManagerView('LIST');
  };

  const moveTask = (e: React.MouseEvent, taskId: string, newStatus: TaskStatus) => {
    e.stopPropagation();
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
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

  const filteredTasks = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesUser = filterType === 'ALL' || task.assigneeId === currentUser.id;
      return matchesSearch && matchesUser;
  });

  const columns = [
    { id: TaskStatus.TODO, label: t.todo, color: 'from-slate-400/20 to-slate-400/5 border-slate-300' },
    { id: TaskStatus.IN_PROGRESS, label: t.in_progress, color: 'from-blue-400/20 to-blue-400/5 border-blue-300' },
    { id: TaskStatus.REVIEW, label: t.review, color: 'from-purple-400/20 to-purple-400/5 border-purple-300' },
    { id: TaskStatus.DONE, label: t.done, color: 'from-green-400/20 to-green-400/5 border-green-300' },
  ];

  const getStatusLabel = (status: TaskStatus) => {
      switch (status) {
          case TaskStatus.TODO: return t.todo;
          case TaskStatus.IN_PROGRESS: return t.in_progress;
          case TaskStatus.REVIEW: return t.review;
          case TaskStatus.DONE: return t.done;
          default: return status;
      }
  };

  const getStatusColorStyles = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO: 
        return { container: 'bg-slate-100 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' };
      case TaskStatus.IN_PROGRESS: 
        return { container: 'bg-blue-50 border-blue-100', text: 'text-blue-600', dot: 'bg-blue-500' };
      case TaskStatus.REVIEW: 
        return { container: 'bg-purple-50 border-purple-100', text: 'text-purple-600', dot: 'bg-purple-500' };
      case TaskStatus.DONE: 
        return { container: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-600', dot: 'bg-emerald-500' };
      default: 
        return { container: 'bg-slate-50 border-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' };
    }
  };

  const getCategoryIcon = (cat?: TaskCategory) => {
      switch(cat) {
          case 'Tax': return <FileBarChart className="w-3.5 h-3.5" />;
          case 'Payroll': return <UserIcon className="w-3.5 h-3.5" />;
          case 'Audit': return <Search className="w-3.5 h-3.5" />;
          case 'Meeting': return <UserIcon className="w-3.5 h-3.5" />; // Group icon
          case 'Advisory': return <Wand2 className="w-3.5 h-3.5" />;
          default: return <Hash className="w-3.5 h-3.5" />;
      }
  };

  const getCategoryLabel = (cat?: TaskCategory) => {
      switch(cat) {
          case 'Tax': return t.cat_tax;
          case 'Payroll': return t.cat_payroll;
          case 'Audit': return t.cat_audit;
          case 'Meeting': return t.cat_meeting;
          case 'Advisory': return t.cat_advisory;
          default: return t.cat_general;
      }
  };

  return (
    <div className="h-full w-full relative overflow-hidden flex flex-col">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-400/10 rounded-full blur-[80px] pointer-events-none" />
      
      {/* Lightbox / Preview Overlay */}
      {previewFile && (
          <div 
             className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-[fadeIn_0.2s]"
             onClick={() => setPreviewFile(null)}
          >
             <button 
                 className="absolute top-4 right-4 text-white hover:text-red-400 p-2 bg-white/10 rounded-full transition-colors z-[70]"
                 onClick={() => setPreviewFile(null)}
             >
                 <X className="w-8 h-8" />
             </button>
             {previewFile.type === 'image' ? (
                 <img 
                     src={previewFile.url} 
                     alt="Full preview" 
                     className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl object-contain"
                     onClick={(e) => e.stopPropagation()} 
                 />
             ) : (
                 <iframe 
                    src={previewFile.url} 
                    className="w-full h-full max-w-5xl max-h-[85vh] bg-white rounded-xl shadow-2xl border-none"
                    title="Document Preview"
                    onClick={(e) => e.stopPropagation()}
                 />
             )}
          </div>
      )}

      {/* Header Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 z-10 gap-4">
        <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{t.tasks}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Manage client work & deadlines</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm">
           {/* Search */}
           <div className="relative group w-full sm:w-auto">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder={t.search} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-transparent border-none focus:ring-0 text-sm w-full sm:w-48 transition-all outline-none text-slate-700 dark:text-slate-200 font-medium placeholder-slate-400"
              />
           </div>
           
           <div className="hidden sm:block h-6 w-px bg-slate-300 dark:bg-slate-600 mx-1" />

           {/* Filter Toggles */}
           <div className="flex items-center gap-2">
               <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 flex-1 sm:flex-none">
                  <button 
                    onClick={() => setFilterType('ALL')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'ALL' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  >
                    {t.all_tasks}
                  </button>
                  <button 
                    onClick={() => setFilterType('MINE')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'MINE' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  >
                    {t.my_tasks}
                  </button>
               </div>
               
               <button
                 onClick={openManager}
                 className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl flex items-center shadow-sm border border-slate-200 dark:border-slate-600 transition-all"
                 title={t.manage_templates}
               >
                 <Settings className="w-4 h-4" />
               </button>

               <button
                 onClick={() => handleOpenModal()}
                 className="bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 ml-auto sm:ml-0"
               >
                 <Plus className="w-4 h-4 sm:mr-2" />
                 <span className="text-sm font-bold whitespace-nowrap hidden sm:inline">{t.new_task}</span>
               </button>
           </div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 overflow-x-auto pb-4 z-10 custom-scrollbar">
        <div className="flex h-full space-x-5 min-w-[1200px] px-1">
          {columns.map(col => (
            <div key={col.id} className={`flex-1 flex flex-col bg-gradient-to-b ${col.color} backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]`}>
              <div className="flex items-center justify-between mb-4 px-2 pb-3 border-b border-white/30 dark:border-white/10">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase text-xs">{col.label}</h3>
                <span className="bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs px-2.5 py-1 rounded-lg font-bold shadow-sm border border-slate-100 dark:border-slate-600">
                  {filteredTasks.filter(t => t.status === col.id).length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                {filteredTasks.filter(t => t.status === col.id).map(task => {
                  const statusStyles = getStatusColorStyles(task.status);
                  const hasAttachments = task.attachments && task.attachments.length > 0;
                  const hasImages = task.attachments?.some(a => a.type === 'image');
                  const hasVoice = task.attachments?.some(a => a.type === 'voice');

                  // --- COMPACT MODE RENDER ---
                  if (compactMode) {
                      return (
                        <div 
                          key={task.id} 
                          onClick={() => handleOpenModal(task)}
                          className="group relative bg-white/95 dark:bg-slate-800/95 p-2.5 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 mb-2.5"
                        >
                            {/* Priority Indicator - Minimalist Line */}
                            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${
                                task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-orange-500' : 'bg-blue-400'
                            }`} />

                            <div className="pl-3">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-200 text-xs leading-relaxed line-clamp-2">{task.title}</h4>
                                     {/* Status Dot */}
                                     <div className={`w-2 h-2 shrink-0 rounded-full mt-1 ${statusStyles.dot}`} title={getStatusLabel(task.status)} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {/* Avatar - Smaller */}
                                        {task.assigneeId ? (
                                            <img src={users.find(u => u.id === task.assigneeId)?.avatar} className="w-5 h-5 rounded-full object-cover border border-slate-100 dark:border-slate-600 shadow-sm" alt="Assignee" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600"><UserIcon className="w-3 h-3 text-slate-400" /></div>
                                        )}
                                        
                                        {/* Date - Minimal */}
                                        <div className={`flex items-center text-[10px] font-bold ${new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE ? 'text-red-500' : 'text-slate-400'}`}>
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                                            {task.dueTime && <span className="ml-1 text-slate-500"> {task.dueTime}</span>}
                                        </div>
                                    </div>

                                    {/* Attachments Icon */}
                                    {hasAttachments && (
                                        <div className="flex items-center gap-1 text-slate-400 bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">
                                            {hasVoice ? <Mic className="w-3 h-3 text-red-400" /> : <Paperclip className="w-3 h-3" />}
                                            <span className="text-[9px] font-bold">{task.attachments.length}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Hover Actions Overlay */}
                            <div className="absolute inset-0 bg-slate-900/5 dark:bg-black/20 hidden group-hover:flex items-center justify-center rounded-xl backdrop-blur-[1px] z-20 animate-[fadeIn_0.15s]">
                                <div className="bg-white dark:bg-slate-800 p-1 rounded-lg shadow-lg flex gap-1 border border-slate-200 dark:border-slate-600">
                                   {Object.values(TaskStatus).filter(s => s !== task.status).map(s => {
                                       let icon = <CheckCircle2 className="w-3.5 h-3.5" />;
                                       if(s === TaskStatus.TODO) icon = <Clock className="w-3.5 h-3.5" />;
                                       if(s === TaskStatus.IN_PROGRESS) icon = <ArrowRight className="w-3.5 h-3.5" />;
                                       return (<button key={s} onClick={(e) => moveTask(e, task.id, s)} title={`${t.move_to} ${s}`} className="p-1.5 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-600 rounded-md transition-colors">{icon}</button>)
                                   })}
                                </div>
                            </div>
                        </div>
                      )
                  }

                  // --- STANDARD MODE RENDER ---
                  return (
                    <div 
                      key={task.id} 
                      onClick={() => handleOpenModal(task)}
                      className="group relative bg-white/95 dark:bg-slate-800/95 p-4 rounded-2xl shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-white/60 dark:border-slate-700 hover:border-blue-300/50 transition-all duration-300 cursor-pointer hover:-translate-y-1"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Priority Bar */}
                      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-lg ${
                          task.priority === 'High' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : task.priority === 'Medium' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'bg-blue-400'
                      }`} />
                      
                      <div className="pl-4">
                          {/* Header: Badges */}
                          <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                  {/* Category Badge */}
                                  <div className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-wider border border-slate-200 dark:border-slate-600">
                                      {getCategoryIcon(task.category)}
                                      <span className="truncate max-w-[80px]">{getCategoryLabel(task.category)}</span>
                                  </div>

                                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border shadow-sm ${statusStyles.container}`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${statusStyles.dot}`} />
                                      <span className={`text-[10px] font-bold uppercase tracking-wider ${statusStyles.text} truncate max-w-[80px]`}>
                                          {getStatusLabel(task.status)}
                                      </span>
                                  </div>
                              </div>
                              <button className="text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="w-4 h-4" />
                              </button>
                          </div>
                          
                          {/* Content */}
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1.5 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm">{task.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 font-medium leading-relaxed">{task.description}</p>
                          
                          {/* Attachment Indicators */}
                          {hasAttachments && (
                             <div className="flex gap-2 mb-4 bg-slate-50 dark:bg-slate-700/50 p-1.5 rounded-lg w-fit">
                                {hasImages && <ImageIcon className="w-3.5 h-3.5 text-blue-500" />}
                                {hasVoice && <Mic className="w-3.5 h-3.5 text-red-500" />}
                                {!hasImages && !hasVoice && <Paperclip className="w-3.5 h-3.5 text-slate-400" />}
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                    {task.attachments.length} Attachments
                                </span>
                             </div>
                          )}

                          {/* Footer */}
                          <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700/60">
                              <div className="flex items-center gap-2">
                                  {task.assigneeId ? (
                                      <img src={users.find(u => u.id === task.assigneeId)?.avatar} alt="User" className="w-6 h-6 rounded-full border border-slate-100 dark:border-slate-600 shadow-sm object-cover" />
                                  ) : (
                                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400"><UserIcon className="w-3 h-3" /></div>
                                  )}
                                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                      {task.assigneeId ? users.find(u => u.id === task.assigneeId)?.name.split(' ')[0] : 'Unassigned'}
                                  </span>
                              </div>
                              <div className={`flex items-center text-[10px] font-bold px-2 py-1 rounded-lg ${new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-100 dark:border-slate-600'}`}>
                                  <Calendar className="w-3 h-3 mr-1.5" />
                                  {task.dueDate}
                                  {task.dueTime && <span className="ml-1 border-l border-slate-300 dark:border-slate-500 pl-1">{task.dueTime}</span>}
                              </div>
                          </div>
                      </div>
                      
                      {/* Hover Actions Overlay */}
                      <div className="absolute inset-0 bg-slate-900/5 dark:bg-black/20 hidden group-hover:flex items-center justify-center rounded-2xl backdrop-blur-[1px] z-20 animate-[fadeIn_0.15s]">
                        <div className="bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-xl flex gap-1 border border-white/50 dark:border-slate-600">
                           {Object.values(TaskStatus).filter(s => s !== task.status).map(s => {
                               let icon = <CheckCircle2 className="w-4 h-4" />;
                               if(s === TaskStatus.TODO) icon = <Clock className="w-4 h-4" />;
                               if(s === TaskStatus.IN_PROGRESS) icon = <ArrowRight className="w-4 h-4" />;
                               return (<button key={s} onClick={(e) => moveTask(e, task.id, s)} title={`${t.move_to} ${s}`} className="p-2 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded-lg transition-colors">{icon}</button>)
                           })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- TEMPLATE MANAGER MODAL --- */}
      {isManagerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
            {/* ... (Existing Template Manager Code - largely unchanged) ... */}
            <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-w-full max-h-[85vh] flex flex-col overflow-hidden ring-1 ring-black/5">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="bg-slate-200 p-1.5 rounded-lg">
                           <LayoutTemplate className="w-5 h-5 text-slate-700" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">
                           {managerView === 'LIST' ? t.manage_templates : managerView === 'CREATE' ? t.add_new_template : t.edit}
                        </h3>
                    </div>
                    <button onClick={() => setIsManagerOpen(false)} className="text-slate-400 hover:bg-slate-200 p-1.5 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    {managerView === 'LIST' && (
                        <div className="space-y-3">
                            <button 
                                onClick={startCreateTemplate}
                                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold text-sm hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 mb-4"
                            >
                                <Plus className="w-4 h-4" />
                                {t.add_new_template}
                            </button>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 ml-1">{t.system_template}</h4>
                            {templates.map((tpl) => (
                                <div key={tpl.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg ${tpl.color.split(' ')[0]} border ${tpl.color.split(' ')[2]}`} />
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{tpl.label}</p>
                                            <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
                                                {language === 'PL' ? tpl.descPL : language === 'TR' ? tpl.descTR : tpl.descNL}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => startEditTemplate(tpl)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteTemplate(tpl.id!)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {(managerView === 'CREATE' || managerView === 'EDIT') && (
                        <form onSubmit={handleSaveTemplate} className="space-y-5">
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.template_name}</label>
                                <input 
                                    type="text"
                                    required
                                    value={templateForm.label}
                                    onChange={(e) => setTemplateForm({...templateForm, label: e.target.value})}
                                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                                    placeholder="e.g. Onboarding, Audit..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.description}</label>
                                <textarea 
                                    value={templateForm.desc}
                                    onChange={(e) => setTemplateForm({...templateForm, desc: e.target.value})}
                                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none placeholder-slate-400"
                                    placeholder="..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center">
                                    <Palette className="w-3.5 h-3.5 mr-1" />
                                    {t.select_color}
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {availableColors.map((col) => {
                                        const colorClass = `${col.bg} ${col.text} ${col.border}`;
                                        const isSelected = templateForm.color === colorClass;
                                        return (
                                            <button
                                                key={col.name}
                                                type="button"
                                                onClick={() => setTemplateForm({...templateForm, color: colorClass})}
                                                className={`h-10 rounded-lg border-2 flex items-center justify-center transition-all ${col.bg} ${col.border} ${isSelected ? 'ring-2 ring-offset-2 ring-slate-400 scale-105' : 'hover:scale-105'}`}
                                                title={col.name}
                                            >
                                                {isSelected && <Check className={`w-4 h-4 ${col.text}`} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setManagerView('LIST')}
                                    className="flex-1 py-2.5 text-slate-600 font-bold text-sm bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    {t.cancel}
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-2.5 text-white font-bold text-sm bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg shadow-slate-900/20 transition-all transform hover:-translate-y-0.5"
                                >
                                    {t.save_template}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Main Create/Edit Task Modal - Responsive Width */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/50 w-full sm:w-[700px] h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 flex flex-col">
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
            
            <form onSubmit={handleSaveTask} className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
              
              {!isEditing && (
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 shadow-inner">
                    <div className="flex items-center mb-3 justify-between">
                        <div className="flex items-center">
                            <Wand2 className="w-4 h-4 text-blue-500 mr-2" />
                            <label className="text-xs font-bold text-slate-500 uppercase">{t.quick_templates}</label>
                        </div>
                        <button type="button" onClick={openManager} className="text-[10px] text-blue-600 font-bold hover:underline flex items-center">
                            <Settings className="w-3 h-3 mr-1" />
                            {t.manage_templates}
                        </button>
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
                       <Calendar className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
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

              {/* ATTACHMENTS SECTION */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                      <label className="block text-xs font-bold text-slate-500 uppercase">{t.attachments}</label>
                      <div className="flex gap-2">
                         <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            className="hidden" 
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                         />
                         <button 
                             type="button"
                             onClick={() => fileInputRef.current?.click()}
                             className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-400 transition-all"
                         >
                             <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                             <span className="hidden sm:inline">{t.add_attachment}</span>
                             <span className="sm:hidden">Add</span>
                         </button>
                         <button 
                             type="button"
                             onClick={isRecording ? stopRecording : startRecording}
                             className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                 isRecording 
                                 ? 'bg-red-100 text-red-600 border border-red-200 animate-pulse' 
                                 : 'bg-white border border-slate-300 text-slate-600 hover:text-red-600 hover:border-red-400'
                             }`}
                         >
                             {isRecording ? (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-red-600 mr-2"/>
                                    {formatDuration(recordingDuration)}
                                </>
                             ) : (
                                <>
                                    <Mic className="w-3.5 h-3.5 mr-1.5" />
                                    <span className="hidden sm:inline">{t.record_voice}</span>
                                    <span className="sm:hidden">Rec</span>
                                </>
                             )}
                         </button>
                      </div>
                  </div>

                  {(!editingTask.attachments || editingTask.attachments.length === 0) && (
                      <div 
                        className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-400 text-sm cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                          {t.drop_files}
                      </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                      {editingTask.attachments?.map((att) => (
                          <div key={att.id} className="relative group bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center overflow-hidden">
                              <button 
                                  onClick={() => removeAttachment(att.id)}
                                  type="button"
                                  className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              >
                                  <X className="w-4 h-4" />
                              </button>
                              
                              {att.type === 'image' && (
                                  <div className="w-full h-24 mb-2 rounded-lg overflow-hidden bg-slate-100 relative group/img">
                                      <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                           <button 
                                              type="button"
                                              onClick={() => setPreviewFile({url: att.url, type: 'image'})}
                                              className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm"
                                           >
                                               <Maximize2 className="w-5 h-5" />
                                           </button>
                                           <button 
                                              type="button"
                                              onClick={() => downloadFile(att.url, att.name)}
                                              className="ml-2 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm"
                                           >
                                               <Download className="w-5 h-5" />
                                           </button>
                                      </div>
                                  </div>
                              )}
                              
                              {att.type === 'file' && (
                                  <div 
                                    className={`w-full h-24 mb-2 rounded-lg bg-blue-50 flex flex-col items-center justify-center relative group/file ${att.name.toLowerCase().endsWith('.pdf') ? 'cursor-pointer hover:bg-blue-100 transition-colors' : ''}`}
                                    onClick={() => {
                                        if (att.name.toLowerCase().endsWith('.pdf')) {
                                            setPreviewFile({url: att.url, type: 'pdf'});
                                        }
                                    }}
                                  >
                                      <FileText className="w-8 h-8 text-blue-400 mb-1" />
                                      <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover/file:opacity-100 transition-opacity rounded-lg gap-2">
                                           {att.name.toLowerCase().endsWith('.pdf') && (
                                               <button 
                                                   type="button"
                                                   onClick={(e) => {
                                                       e.stopPropagation();
                                                       setPreviewFile({url: att.url, type: 'pdf'});
                                                   }}
                                                   className="p-2 bg-white text-blue-600 rounded-lg shadow-md hover:bg-blue-50"
                                                   title="Preview PDF"
                                               >
                                                   <Eye className="w-4 h-4" />
                                               </button>
                                           )}
                                           <button 
                                              type="button"
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  downloadFile(att.url, att.name);
                                              }}
                                              className="p-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700"
                                              title="Download"
                                           >
                                               <Download className="w-4 h-4" />
                                           </button>
                                      </div>
                                  </div>
                              )}

                              {att.type === 'voice' && (
                                  <div className="w-full h-24 mb-2 rounded-lg bg-orange-50 flex flex-col items-center justify-center p-2">
                                      <div className="w-full flex items-center justify-center mb-1">
                                          <audio src={att.url} controls className="w-full h-8" />
                                      </div>
                                  </div>
                              )}

                              <span className="text-xs font-bold text-slate-700 truncate w-full px-1">{att.name}</span>
                              {att.size && <span className="text-[10px] text-slate-400">{att.size}</span>}
                          </div>
                      ))}
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
                       <span className="sm:hidden">Delete</span>
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
