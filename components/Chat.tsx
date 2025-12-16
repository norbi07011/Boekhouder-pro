
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, User, Language, ChatAttachment } from '../types';
import { DICTIONARY } from '../constants';
import { Send, Paperclip, Search, Hash, Menu, Mic, Image as ImageIcon, Play, Pause, FileText, Check, CheckCheck, MoreVertical, Smile, X, Plus, Palette, Sticker, Film, ArrowLeft } from 'lucide-react';

interface ChatProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  users: User[];
  currentUser: User;
  language: Language;
}

interface Channel {
    id: string;
    name: string;
    type: 'group' | 'dm';
    participants?: string[]; // IDs
    icon?: any;
    color?: string;
}

const INITIAL_CHANNELS: Channel[] = [
    { id: 'general', name: 'General', type: 'group', color: 'bg-blue-500' },
    { id: 'btw', name: 'VAT (BTW)', type: 'group', color: 'bg-orange-500' },
    { id: 'payroll', name: 'Payroll (Loon)', type: 'group', color: 'bg-green-500' },
    { id: 'random', name: 'Random', type: 'group', color: 'bg-purple-500' },
];

const GROUP_COLORS = [
    'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-orange-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
];

const BUSINESS_EMOJIS = [
    '💰', '💶', '💵', '💸', '💳', '🧾', '📊', '📉', '📈', '📋',
    '🖊️', '📅', '📂', '🗂️', '🏦', '⚖️', '📠', '💼', '💻', '🖨️',
    '🤝', '👍', '👎', '👏', '🤞', '🙏', '👀', '🧠', '💡', '🚀',
    '✅', '❌', '⚠️', '❗', '❓', '💯', '🎯', '📢', '🔔', '🔒'
];

const STICKERS = [
    { id: 's1', label: 'APPROVED', color: 'bg-green-600', text: '✅ APPROVED' },
    { id: 's2', label: 'PAID', color: 'bg-blue-600', text: '💸 PAID' },
    { id: 's3', label: 'URGENT', color: 'bg-red-600', text: '🔥 URGENT' },
    { id: 's4', label: 'REVIEW', color: 'bg-orange-500', text: '👀 REVIEW' },
    { id: 's5', label: 'DONE', color: 'bg-emerald-500', text: '🎉 DONE' },
    { id: 's6', label: 'THANKS', color: 'bg-purple-500', text: '🙏 THANKS' },
    { id: 's7', label: 'TAX TIME', color: 'bg-blue-800', text: '🏛️ TAX TIME' },
    { id: 's8', label: 'AUDIT', color: 'bg-slate-700', text: '📋 AUDIT' },
];

const GIFS = [
    { id: 'g1', url: 'https://media.giphy.com/media/l0Ex6kAKAoFRsFh6M/giphy.gif', title: 'Money Rain' },
    { id: 'g2', url: 'https://media.giphy.com/media/3o6gDWzmAzrpi5D0Gc/giphy.gif', title: 'Business Man' },
    { id: 'g3', url: 'https://media.giphy.com/media/xTiTnqUxyWbsAXq7Vi/giphy.gif', title: 'Stonks Chart' },
    { id: 'g4', url: 'https://media.giphy.com/media/LdOyjZ7io5Msw/giphy.gif', title: 'Scrooge McDuck' },
    { id: 'g5', url: 'https://media.giphy.com/media/NBguOjO71f1S/giphy.gif', title: 'Calculator' },
    { id: 'g6', url: 'https://media.giphy.com/media/13ln9K5LWk0QWN/giphy.gif', title: 'Busy Typing' },
];

export const Chat: React.FC<ChatProps> = ({ messages, setMessages, users, currentUser, language }) => {
  const t = DICTIONARY[language];
  
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[0]);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<ChatAttachment | null>(null);

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<'emojis' | 'stickers' | 'gifs'>('emojis');
  const pickerRef = useRef<HTMLDivElement>(null);

  const activeChannel = channels.find(c => c.id === activeChannelId) 
    || { id: activeChannelId, name: users.find(u => u.id === activeChannelId)?.name || 'Unknown', type: 'dm' as const };

  const activeMessages = messages.filter(m => {
      const matchesContext = activeChannel.type === 'group' 
          ? m.channelId === activeChannelId
          : (m.userId === currentUser.id && m.channelId === activeChannelId) || 
            (m.userId === activeChannelId && m.channelId === currentUser.id);
      
      if (!chatSearch.trim()) return matchesContext;
      return matchesContext && m.text.toLowerCase().includes(chatSearch.toLowerCase());
  });

  const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(sidebarSearch.toLowerCase()));
  const filteredUsers = users.filter(u => u.id !== currentUser.id && u.name.toLowerCase().includes(sidebarSearch.toLowerCase()));

  // Auto-close sidebar on mobile on initial load
  useEffect(() => {
    if (window.innerWidth < 768) {
        setIsSidebarOpen(true); // Start with list open on mobile
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages, attachmentPreview, activeChannelId, isEmojiPickerOpen, pickerTab]);

  useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
          if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
              setIsEmojiPickerOpen(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
          document.removeEventListener("mousedown", handleClickOutside);
      };
  }, [pickerRef]);

  const handleCreateGroup = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newGroupName.trim()) return;

      const newChannel: Channel = {
          id: `group-${Date.now()}`,
          name: newGroupName,
          type: 'group',
          color: newGroupColor
      };

      setChannels([...channels, newChannel]);
      setActiveChannelId(newChannel.id);
      setNewGroupName('');
      setIsCreateGroupOpen(false);
      setIsSidebarOpen(false); // Close sidebar on mobile after create
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachmentPreview) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      userId: currentUser.id,
      channelId: activeChannelId, 
      timestamp: new Date().toISOString(),
      attachments: attachmentPreview ? [attachmentPreview] : []
    };

    setMessages([...messages, newMessage]);
    setInputText('');
    setAttachmentPreview(null);
    setIsEmojiPickerOpen(false);
  };

  const handleEmojiClick = (emoji: string) => {
      setInputText(prev => prev + emoji);
  };

  const handleStickerClick = (sticker: typeof STICKERS[0]) => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text: '', 
        userId: currentUser.id,
        channelId: activeChannelId,
        timestamp: new Date().toISOString(),
        attachments: [{
            id: Date.now().toString(),
            type: 'image', 
            url: `https://placehold.co/200x80/${sticker.color.replace('bg-', '').replace('-600', '').replace('-500', '').replace('-800', '').replace('-700', '')}/ffffff?text=${sticker.text.replace(' ', '+')}&font=roboto`,
            name: 'Sticker'
        }]
      };
      setMessages([...messages, newMessage]);
      setIsEmojiPickerOpen(false);
  };

  const handleGifClick = (gif: typeof GIFS[0]) => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text: '', 
        userId: currentUser.id,
        channelId: activeChannelId,
        timestamp: new Date().toISOString(),
        attachments: [{
            id: Date.now().toString(),
            type: 'image', 
            url: gif.url,
            name: 'GIF'
        }]
      };
      setMessages([...messages, newMessage]);
      setIsEmojiPickerOpen(false);
  };

  const getUser = (id: string) => users.find(u => u.id === id) || users[0];

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const isImage = file.type.startsWith('image/');
          const reader = new FileReader();
          
          reader.onload = (event) => {
              setAttachmentPreview({
                  id: Date.now().toString(),
                  type: isImage ? 'image' : 'file',
                  name: file.name,
                  url: event.target?.result as string,
                  size: (file.size / 1024).toFixed(1) + ' KB',
              });
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
            setAttachmentPreview({
                id: Date.now().toString(),
                type: 'voice',
                url: audioUrl,
                name: 'Voice Note'
            });
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (err) {
        console.error('Mic error:', err);
        alert('Microphone access denied.');
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  return (
    <div className="flex h-full bg-slate-100 rounded-2xl shadow-xl overflow-hidden border border-slate-200/60 relative">
      
      {/* --- SIDEBAR (Contact/Channel List) --- */}
      {/* On mobile: width is full, acts as a page. On desktop: width 80px static */}
      <div className={`
          absolute md:static inset-0 z-40 bg-white border-r border-slate-200 flex flex-col
          transition-transform duration-300 transform
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          w-full md:w-80
      `}>
        {/* Sidebar Header */}
        <div className="h-16 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
           <div className="flex items-center gap-3">
              <img src={currentUser.avatar} className="w-9 h-9 rounded-full cursor-pointer hover:opacity-80 transition-opacity" alt="Me"/>
              <span className="font-bold text-slate-700">{t.chat}</span>
           </div>
           <div className="flex gap-2 text-slate-500">
               <button 
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-blue-600"
                  title={t.new_group}
               >
                   <Plus className="w-5 h-5"/>
               </button>
               <button onClick={() => setIsSidebarOpen(false)} className="p-2 md:hidden hover:bg-slate-200 rounded-full transition-colors">
                   <X className="w-5 h-5"/>
               </button>
           </div>
        </div>

        {/* Sidebar Search */}
        <div className="p-3 border-b border-slate-100">
           <div className="relative bg-slate-100 rounded-lg flex items-center px-3 py-2 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input 
                 type="text" 
                 placeholder={t.search} 
                 value={sidebarSearch}
                 onChange={(e) => setSidebarSearch(e.target.value)}
                 className="bg-transparent border-none outline-none text-sm w-full placeholder-slate-400 text-slate-700"
              />
           </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
           
           <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Groups</div>
           {filteredChannels.map(channel => (
               <div 
                  key={channel.id}
                  onClick={() => { setActiveChannelId(channel.id); setIsSidebarOpen(false); }}
                  className={`flex items-center px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors border-l-4 ${activeChannelId === channel.id ? 'bg-blue-50 border-blue-500' : 'border-transparent'}`}
               >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3 shrink-0 ${channel.color}`}>
                      <Hash className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{channel.name}</h4>
                          <span className="text-[10px] text-slate-400"></span> 
                      </div>
                      <p className="text-xs text-slate-500 truncate">Tap to join conversation...</p>
                  </div>
               </div>
           ))}

           <div className="px-4 py-2 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct Messages</div>
           {filteredUsers.map(user => {
               const lastMsg = messages.filter(m => (m.userId === user.id && m.channelId === currentUser.id) || (m.userId === currentUser.id && m.channelId === user.id)).pop();
               
               return (
                <div 
                    key={user.id}
                    onClick={() => { setActiveChannelId(user.id); setIsSidebarOpen(false); }}
                    className={`flex items-center px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors border-l-4 ${activeChannelId === user.id ? 'bg-blue-50 border-blue-500' : 'border-transparent'}`}
                >
                    <div className="relative mr-3 shrink-0">
                        <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt={user.name} />
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${user.status === 'Online' ? 'bg-emerald-500' : user.status === 'Busy' ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{user.name}</h4>
                            <span className="text-[10px] text-slate-400">{lastMsg ? formatTime(lastMsg.timestamp) : ''}</span>
                        </div>
                        <p className={`text-xs truncate ${lastMsg ? 'text-slate-500' : 'text-slate-300 italic'}`}>
                            {lastMsg ? lastMsg.text : 'No messages yet'}
                        </p>
                    </div>
                </div>
               );
           })}
        </div>
      </div>

      {/* --- MAIN CHAT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#e5e5e5] relative h-full">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

        {/* Chat Header */}
        <div className="h-16 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-3 md:px-4 shrink-0 relative z-10 shadow-sm">
           <div className="flex items-center gap-2 md:gap-3 overflow-hidden flex-1">
              <button className="md:hidden mr-1 text-slate-500 hover:bg-slate-200 p-1.5 rounded-full transition-colors" onClick={() => setIsSidebarOpen(true)}>
                 <ArrowLeft className="w-6 h-6" />
              </button>
              
              {activeChannel.type === 'group' ? (
                  <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white shrink-0 ${activeChannel.color || 'bg-blue-500'}`}>
                      <Hash className="w-5 h-5" />
                  </div>
              ) : (
                  <img src={users.find(u => u.id === activeChannelId)?.avatar} className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover shrink-0" alt="User" />
              )}
              
              <div className="flex flex-col min-w-0 flex-1">
                  <h3 className="font-bold text-slate-800 leading-tight truncate text-sm md:text-base">{activeChannel.name}</h3>
                  <span className="text-xs text-slate-500 flex items-center truncate">
                     {activeChannel.type === 'group' ? (
                         <span className="truncate block w-full">Anna, Mehmet, Jan, You</span>
                     ) : (
                         <span className={users.find(u => u.id === activeChannelId)?.status === 'Online' ? 'text-emerald-500 font-bold' : ''}>
                             {users.find(u => u.id === activeChannelId)?.status || 'Offline'}
                         </span>
                     )}
                  </span>
              </div>
           </div>
           
           <div className="flex items-center gap-1 md:gap-3 text-slate-500 shrink-0">
               {isChatSearchOpen ? (
                   <div className="flex items-center bg-white rounded-full border border-slate-300 px-3 py-1 shadow-sm animate-[fadeIn_0.2s] absolute right-4 left-14 md:static md:w-auto z-20">
                       <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                       <input 
                          autoFocus
                          type="text" 
                          value={chatSearch}
                          onChange={(e) => setChatSearch(e.target.value)}
                          placeholder={t.search_messages}
                          className="w-full md:w-48 bg-transparent border-none outline-none text-sm text-slate-700 min-w-[50px]"
                       />
                       <button onClick={() => { setIsChatSearchOpen(false); setChatSearch(''); }} className="ml-2 hover:text-red-500 shrink-0"><X className="w-4 h-4"/></button>
                   </div>
               ) : (
                   <button onClick={() => setIsChatSearchOpen(true)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                       <Search className="w-5 h-5"/>
                   </button>
               )}
               <button className="p-2 hover:bg-slate-200 rounded-full transition-colors"><MoreVertical className="w-5 h-5"/></button>
           </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 relative z-10" ref={scrollRef}>
             {activeMessages.length === 0 && chatSearch && (
                 <div className="text-center text-slate-500 mt-10">
                     No messages found for "{chatSearch}"
                 </div>
             )}
             
             {activeMessages.map((msg, index) => {
                 const isMe = msg.userId === currentUser.id;
                 const sender = getUser(msg.userId);
                 const showName = !isMe && activeChannel.type === 'group' && (index === 0 || activeMessages[index - 1].userId !== msg.userId);

                 return (
                     <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1`}>
                         <div className={`relative max-w-[85%] md:max-w-[65%] min-w-[120px] rounded-lg shadow-sm px-2 py-1.5 ${
                             isMe ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'
                         } ${chatSearch && msg.text.toLowerCase().includes(chatSearch.toLowerCase()) ? 'ring-2 ring-yellow-400' : ''}`}>
                             {showName && (
                                 <p className={`text-[11px] font-bold mb-0.5 ${['text-orange-600', 'text-purple-600', 'text-blue-600', 'text-pink-600'][parseInt(sender.id) % 4]}`}>
                                     {sender.name}
                                 </p>
                             )}

                             {msg.attachments?.map((att) => (
                                 <div key={att.id} className="mb-2 mt-1">
                                     {att.type === 'image' && (
                                         <img src={att.url} alt="attachment" className="rounded-lg max-h-60 object-cover w-full cursor-pointer hover:opacity-90 transition-opacity" />
                                     )}
                                     {att.type === 'file' && (
                                         <div className="flex items-center bg-black/5 p-2 rounded-lg border border-black/5">
                                             <FileText className="w-8 h-8 text-blue-500 mr-2" />
                                             <div className="overflow-hidden">
                                                 <p className="text-xs font-bold truncate">{att.name}</p>
                                                 <p className="text-[10px] text-slate-500 uppercase">{att.size || 'FILE'}</p>
                                             </div>
                                         </div>
                                     )}
                                     {att.type === 'voice' && (
                                         <div className="flex items-center bg-black/5 p-2 rounded-lg gap-2 min-w-[200px]">
                                             <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                                                 <Play className="w-4 h-4 ml-0.5" />
                                             </div>
                                             <div className="h-1 bg-slate-300 flex-1 rounded-full overflow-hidden">
                                                 <div className="h-full bg-blue-500 w-1/3"></div>
                                             </div>
                                             <span className="text-[10px] font-bold text-slate-500">0:15</span>
                                             <audio src={att.url} className="hidden" controls />
                                         </div>
                                     )}
                                 </div>
                             ))}

                             {msg.text && (
                                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                             )}

                             <div className="flex justify-end items-center gap-1 mt-1 select-none">
                                 <span className="text-[10px] text-slate-400">
                                     {formatTime(msg.timestamp)}
                                 </span>
                                 {isMe && (
                                     <span className="text-blue-500">
                                         <CheckCheck className="w-3.5 h-3.5" />
                                     </span>
                                 )}
                             </div>
                             
                             <div className={`absolute top-0 w-2.5 h-2.5 ${isMe ? '-right-2' : '-left-2'}`}>
                                 <svg viewBox="0 0 10 10" className={`w-full h-full ${isMe ? 'text-[#dcf8c6]' : 'text-white'} fill-current transform ${isMe ? '' : 'scale-x-[-1]'}`}>
                                     <path d="M0 0 L10 0 L0 10 Z" />
                                 </svg>
                             </div>
                         </div>
                     </div>
                 )
             })}
        </div>

        {/* Input Area */}
        <div className="bg-slate-50 p-2 sm:p-3 flex items-end gap-2 shrink-0 border-t border-slate-200 relative z-20">
             
             {/* Attachment Preview Modal */}
             {attachmentPreview && (
                 <div className="absolute bottom-full left-0 right-0 bg-slate-100 p-3 border-t border-slate-200 flex items-center gap-4 animate-[slideUp_0.2s]">
                      <div className="relative">
                          {attachmentPreview.type === 'image' ? (
                              <img src={attachmentPreview.url} className="w-16 h-16 object-cover rounded-lg border border-slate-300" />
                          ) : (
                              <div className="w-16 h-16 bg-white border border-slate-300 rounded-lg flex items-center justify-center">
                                  {attachmentPreview.type === 'voice' ? <Mic className="w-6 h-6 text-red-500" /> : <FileText className="w-6 h-6 text-blue-500" />}
                              </div>
                          )}
                          <button 
                             onClick={() => setAttachmentPreview(null)}
                             className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                          >
                              <X className="w-3 h-3" />
                          </button>
                      </div>
                      <div className="flex-1">
                          <p className="text-xs font-bold text-slate-700">{attachmentPreview.name || 'Voice Note'}</p>
                          <p className="text-[10px] text-slate-500">{attachmentPreview.type.toUpperCase()}</p>
                      </div>
                 </div>
             )}
             
             {/* EMOJI / STICKER / GIF PICKER POPUP - FIXED POSITION FOR MOBILE */}
             {isEmojiPickerOpen && (
                 <div ref={pickerRef} className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[100] bg-white rounded-xl shadow-2xl border border-slate-200 w-[95%] max-w-sm h-80 sm:h-96 flex flex-col animate-[fadeIn_0.2s] overflow-hidden">
                    <div className="flex border-b border-slate-100">
                        <button 
                            onClick={() => setPickerTab('emojis')}
                            className={`flex-1 py-3 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1 ${pickerTab === 'emojis' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Smile className="w-4 h-4" /> Emojis
                        </button>
                        <button 
                            onClick={() => setPickerTab('stickers')}
                            className={`flex-1 py-3 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1 ${pickerTab === 'stickers' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Sticker className="w-4 h-4" /> Stickers
                        </button>
                        <button 
                            onClick={() => setPickerTab('gifs')}
                            className={`flex-1 py-3 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1 ${pickerTab === 'gifs' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Film className="w-4 h-4" /> GIFs
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-slate-50/50">
                        {pickerTab === 'emojis' && (
                             <div className="grid grid-cols-6 gap-2">
                                 {BUSINESS_EMOJIS.map(emoji => (
                                     <button 
                                        key={emoji} 
                                        onClick={() => handleEmojiClick(emoji)}
                                        className="text-2xl hover:bg-white hover:scale-125 rounded-lg p-2 transition-all shadow-sm border border-transparent hover:border-slate-100"
                                     >
                                         {emoji}
                                     </button>
                                 ))}
                             </div>
                        )}
                        {pickerTab === 'stickers' && (
                             <div className="grid grid-cols-2 gap-2">
                                 {STICKERS.map(sticker => (
                                     <button
                                        key={sticker.id}
                                        onClick={() => handleStickerClick(sticker)}
                                        className={`${sticker.color} text-white font-bold py-4 px-2 rounded-xl text-xs shadow-md hover:opacity-90 hover:scale-105 transition-all flex items-center justify-center text-center`}
                                     >
                                         {sticker.text}
                                     </button>
                                 ))}
                             </div>
                        )}
                        {pickerTab === 'gifs' && (
                             <div className="grid grid-cols-2 gap-2">
                                 {GIFS.map(gif => (
                                     <button
                                        key={gif.id}
                                        onClick={() => handleGifClick(gif)}
                                        className="relative group rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-200"
                                     >
                                        <img src={gif.url} alt={gif.title} className="w-full h-24 object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-[10px] text-white font-bold uppercase tracking-wider">{gif.title}</span>
                                        </div>
                                     </button>
                                 ))}
                             </div>
                        )}
                    </div>
                 </div>
             )}

             <button 
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                className={`p-2 sm:p-2.5 rounded-full transition-colors shrink-0 ${isEmojiPickerOpen ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
             >
                 {pickerTab === 'gifs' && isEmojiPickerOpen ? <Film className="w-6 h-6" /> : pickerTab === 'stickers' && isEmojiPickerOpen ? <Sticker className="w-6 h-6" /> : <Smile className="w-6 h-6" />}
             </button>
             
             <div className="relative shrink-0">
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 sm:p-2.5 text-slate-500 hover:bg-slate-200 rounded-full transition-colors"
                 >
                    <Paperclip className="w-6 h-6" />
                 </button>
                 <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx"
                 />
             </div>

             <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all min-h-[44px]">
                 <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isRecording ? 'Recording...' : t.send}
                    className="w-full bg-transparent border-none outline-none px-4 py-2 text-sm text-slate-800 placeholder-slate-400 h-full min-w-0"
                    disabled={isRecording}
                 />
             </div>

             {inputText.trim() || attachmentPreview ? (
                 <button 
                    onClick={() => handleSend()}
                    className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 shrink-0"
                 >
                     <Send className="w-5 h-5 ml-0.5" />
                 </button>
             ) : (
                 <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2.5 rounded-full transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 shrink-0 ${
                        isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                 >
                    {isRecording ? <div className="w-5 h-5 bg-white rounded-sm mx-auto" /> : <Mic className="w-5 h-5" />}
                 </button>
             )}
        </div>

      </div>

      {/* --- CREATE GROUP MODAL --- */}
      {isCreateGroupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
               <div className="bg-white rounded-2xl shadow-2xl w-[400px] max-w-full overflow-hidden">
                   <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                       <h3 className="font-bold text-slate-800">{t.new_group}</h3>
                       <button onClick={() => setIsCreateGroupOpen(false)} className="text-slate-400 hover:text-red-500">
                           <X className="w-5 h-5" />
                       </button>
                   </div>
                   <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.group_name}</label>
                           <input 
                              type="text" 
                              required
                              value={newGroupName}
                              onChange={(e) => setNewGroupName(e.target.value)}
                              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                              placeholder="e.g. Audit 2024"
                              autoFocus
                           />
                       </div>
                       
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center">
                               <Palette className="w-4 h-4 mr-1" /> Color
                           </label>
                           <div className="flex gap-2 flex-wrap">
                               {GROUP_COLORS.map(color => (
                                   <button
                                      key={color}
                                      type="button"
                                      onClick={() => setNewGroupColor(color)}
                                      className={`w-8 h-8 rounded-full ${color} transition-transform hover:scale-110 flex items-center justify-center ${newGroupColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                                   >
                                       {newGroupColor === color && <Check className="w-4 h-4 text-white" />}
                                   </button>
                               ))}
                           </div>
                       </div>

                       <div className="pt-2">
                           <button 
                              type="submit"
                              className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all transform hover:-translate-y-0.5"
                           >
                               {t.create_group}
                           </button>
                       </div>
                   </form>
               </div>
          </div>
      )}
    </div>
  );
};
