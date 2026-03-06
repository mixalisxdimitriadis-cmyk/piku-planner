import React, { useState, useEffect } from 'react';
import { Play, Square, Plus, X, Clock, Users, Calendar, CheckCircle2, Circle, Timer, FolderKanban, Trash2, Edit3, ChevronLeft, ChevronRight, Save, Moon, Sun, FileText, Link, Paperclip, CheckSquare, Square as SquareIcon, ChevronDown, ChevronUp, BarChart3, Euro, Tag } from 'lucide-react';

const defaultClients = [
  { id: 1, name: 'Creative Agency', color: '#FF6B6B' },
  { id: 2, name: 'Tech Startup', color: '#4ECDC4' },
  { id: 3, name: 'Marketing Co', color: '#845EF7' },
];

const defaultCategories = [
  { id: 1, name: 'Web Design', color: '#228BE6' },
  { id: 2, name: 'Social Media', color: '#40C057' },
  { id: 3, name: 'Motion Design', color: '#FA5252' },
  { id: 4, name: 'Project Mgmt', color: '#FAB005' },
];

const defaultTasks = [];

const columns = [
  { id: 'todo', title: 'To Do', icon: Circle, color: '#868E96' },
  { id: 'inprogress', title: 'In Progress', icon: Timer, color: '#228BE6' },
  { id: 'done', title: 'Done', icon: CheckCircle2, color: '#40C057' },
];

const priorities = [
  { id: 'low', name: 'Low', color: '#40C057' },
  { id: 'medium', name: 'Medium', color: '#FAB005' },
  { id: 'high', name: 'High', color: '#FA5252' },
];

// Helper functions for localStorage
const loadFromStorage = (key, defaultValue) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
};

export default function PikuPlanner() {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [view, setView] = useState('board');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAddTask, setShowAddTask] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showCatMgr, setShowCatMgr] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', clientId: '', categoryId: '', priority: 'medium', hourlyRate: 50, startDate: '', deadline: '' });
  const [newClient, setNewClient] = useState({ name: '', color: '#228BE6' });
  const [newCat, setNewCat] = useState({ name: '', color: '#228BE6' });
  const [tracking, setTracking] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [dragged, setDragged] = useState(null);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [dark, setDark] = useState(true);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newAtt, setNewAtt] = useState({ type: 'link', name: '', url: '' });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [statsMonth, setStatsMonth] = useState(new Date());

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTasks = loadFromStorage('piku_tasks', defaultTasks);
    const savedClients = loadFromStorage('piku_clients', defaultClients);
    const savedCategories = loadFromStorage('piku_categories', defaultCategories);
    const savedDark = loadFromStorage('piku_dark', true);
    
    setTasks(savedTasks);
    setClients(savedClients);
    setCategories(savedCategories);
    setDark(savedDark);
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (isLoaded) {
      saveToStorage('piku_tasks', tasks);
    }
  }, [tasks, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      saveToStorage('piku_clients', clients);
    }
  }, [clients, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      saveToStorage('piku_categories', categories);
    }
  }, [categories, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      saveToStorage('piku_dark', dark);
    }
  }, [dark, isLoaded]);

  useEffect(() => {
    let i; if (tracking) i = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(i);
  }, [tracking]);

  const fmt = s => `${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor((s%3600)/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const fmtH = h => { const hr = Math.floor(h); const m = Math.round((h-hr)*60); return m > 0 ? `${hr}h ${m}m` : `${hr}h`; };

  const startTrack = id => { setTracking(id); setElapsed(0); };
  const stopTrack = () => {
    if (tracking && elapsed > 0) {
      const hrs = Math.round((elapsed/3600)*100)/100;
      setTasks(tasks.map(t => t.id === tracking ? {...t, timeSpent: t.timeSpent + Math.max(hrs, 0.01)} : t));
    }
    setTracking(null); setElapsed(0);
  };

  const onDragStart = (e, t) => { setDragged(t); e.dataTransfer.effectAllowed = 'move'; };
  const onDrop = (e, status) => { e.preventDefault(); if (dragged) { setTasks(tasks.map(t => t.id === dragged.id ? {...t, status} : t)); setDragged(null); } };

  const addTask = status => {
    if (newTask.title && newTask.clientId && newTask.categoryId) {
      setTasks([...tasks, { id: Date.now(), ...newTask, clientId: +newTask.clientId, categoryId: +newTask.categoryId, hourlyRate: +newTask.hourlyRate, status, timeSpent: 0, notes: '', checklist: [], attachments: [] }]);
      setNewTask({ title: '', clientId: '', categoryId: '', priority: 'medium', hourlyRate: 50, startDate: '', deadline: '' });
      setShowAddTask(null);
    }
  };

  const updateTask = (id, k, v) => setTasks(tasks.map(t => t.id === id ? {...t, [k]: ['hourlyRate','timeSpent'].includes(k) ? +v||0 : ['clientId','categoryId'].includes(k) ? +v : v} : t));
  const deleteTask = id => { if (tracking === id) stopTrack(); setTasks(tasks.filter(t => t.id !== id)); setEditing(null); setExpanded(null); };

  const addClient = () => { if (newClient.name) { setClients([...clients, { id: Date.now(), ...newClient }]); setNewClient({ name: '', color: '#228BE6' }); setShowAddClient(false); } };
  const deleteClient = id => { setClients(clients.filter(c => c.id !== id)); setTasks(tasks.filter(t => t.clientId !== id)); if (selectedClient === id) setSelectedClient(null); };

  const addCat = () => { if (newCat.name) { setCategories([...categories, { id: Date.now(), ...newCat }]); setNewCat({ name: '', color: '#228BE6' }); } };
  const deleteCat = id => { const count = tasks.filter(t => t.categoryId === id).length; if (count > 0) { alert(`Cannot delete - used in ${count} tasks`); return; } setCategories(categories.filter(c => c.id !== id)); };

  const addCheckItem = tid => { if (!newCheckItem.trim()) return; setTasks(tasks.map(t => t.id === tid ? {...t, checklist: [...t.checklist, {id: Date.now(), text: newCheckItem, done: false}]} : t)); setNewCheckItem(''); };
  const toggleCheck = (tid, iid) => setTasks(tasks.map(t => t.id === tid ? {...t, checklist: t.checklist.map(c => c.id === iid ? {...c, done: !c.done} : c)} : t));
  const delCheck = (tid, iid) => setTasks(tasks.map(t => t.id === tid ? {...t, checklist: t.checklist.filter(c => c.id !== iid)} : t));

  const addAtt = tid => { if (!newAtt.name || !newAtt.url) return; setTasks(tasks.map(t => t.id === tid ? {...t, attachments: [...t.attachments, {id: Date.now(), ...newAtt, path: newAtt.type === 'file' ? newAtt.url : undefined, url: newAtt.type === 'link' ? newAtt.url : undefined}]} : t)); setNewAtt({type:'link',name:'',url:''}); };
  const delAtt = (tid, aid) => setTasks(tasks.map(t => t.id === tid ? {...t, attachments: t.attachments.filter(a => a.id !== aid)} : t));

  const getClient = id => clients.find(c => c.id === id);
  const getCat = id => categories.find(c => c.id === id);
  const getPri = id => priorities.find(p => p.id === id);
  const filtered = selectedClient ? tasks.filter(t => t.clientId === selectedClient) : tasks;
  const colTasks = status => filtered.filter(t => t.status === status);
  const totalH = tasks.reduce((s,t) => s + t.timeSpent, 0);
  const totalE = tasks.reduce((s,t) => s + t.timeSpent * t.hourlyRate, 0);
  const clientH = id => tasks.filter(t => t.clientId === id).reduce((s,t) => s + t.timeSpent, 0);
  const clientE = id => tasks.filter(t => t.clientId === id).reduce((s,t) => s + t.timeSpent * t.hourlyRate, 0);

  const getMonthlyStats = (month) => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const monthTasks = tasks.filter(t => {
      if (!t.startDate) return false;
      const taskDate = new Date(t.startDate);
      return taskDate.getFullYear() === year && taskDate.getMonth() === m;
    });
    return {
      hours: monthTasks.reduce((sum, t) => sum + t.timeSpent, 0),
      earnings: monthTasks.reduce((sum, t) => sum + (t.timeSpent * t.hourlyRate), 0),
      taskCount: monthTasks.length
    };
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const getTasksForDate = (date) => {
    if (!date) return { starting: [], due: [] };
    const dateStr = date.toISOString().split('T')[0];
    return {
      starting: tasks.filter(t => t.startDate === dateStr),
      due: tasks.filter(t => t.deadline === dateStr)
    };
  };

  const getTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return {
      due: tasks.filter(t => t.deadline === today),
      starting: tasks.filter(t => t.startDate === today),
      inProgress: tasks.filter(t => t.status === 'inprogress')
    };
  };

  const monthNames = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
  const monthNamesShort = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαι', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
  const currentMonthStats = getMonthlyStats(statsMonth);

  const th = { bg: dark ? 'bg-slate-900' : 'bg-slate-50', card: dark ? 'bg-slate-800' : 'bg-white', border: dark ? 'border-slate-700' : 'border-slate-200', text: dark ? 'text-slate-100' : 'text-slate-800', muted: dark ? 'text-slate-400' : 'text-slate-500', input: dark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200', col: dark ? 'bg-slate-800/50' : 'bg-slate-100', hover: dark ? 'hover:bg-slate-700' : 'hover:bg-slate-100', sel: dark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-50 text-blue-700' };

  // Show loading state
  if (!isLoaded) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${th.bg}`}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-3xl mx-auto mb-4">🦊</div>
          <p className={th.text}>Loading Piku Planner...</p>
        </div>
      </div>
    );
  }

  const TaskCard = ({ task: t }) => {
    const cl = getClient(t.clientId), cat = getCat(t.categoryId), pri = getPri(t.priority);
    const isTrack = tracking === t.id, isEdit = editing === t.id, isExp = expanded === t.id;
    const earn = t.timeSpent * t.hourlyRate, chkDone = t.checklist?.filter(c=>c.done).length || 0, chkTot = t.checklist?.length || 0;

    return (
      <div draggable={!isEdit && !isExp} onDragStart={e => onDragStart(e, t)} className={`${th.card} rounded-lg border ${th.border} p-3 cursor-move hover:shadow-md transition-all group ${dragged?.id === t.id ? 'opacity-50' : ''} ${isTrack ? 'ring-2 ring-red-400' : ''}`}>
        {isEdit ? (
          <div className="space-y-2">
            <input value={t.title} onChange={e => updateTask(t.id, 'title', e.target.value)} className={`w-full px-2 py-1 text-sm border rounded ${th.input}`} />
            <div className="grid grid-cols-2 gap-2">
              <select value={t.clientId} onChange={e => updateTask(t.id, 'clientId', e.target.value)} className={`px-2 py-1 text-xs border rounded ${th.input}`}>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={t.categoryId} onChange={e => updateTask(t.id, 'categoryId', e.target.value)} className={`px-2 py-1 text-xs border rounded ${th.input}`}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={t.startDate||''} onChange={e => updateTask(t.id, 'startDate', e.target.value)} className={`px-2 py-1 text-xs border rounded ${th.input}`} />
              <input type="date" value={t.deadline||''} onChange={e => updateTask(t.id, 'deadline', e.target.value)} className={`px-2 py-1 text-xs border rounded ${th.input}`} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={t.hourlyRate} onChange={e => updateTask(t.id, 'hourlyRate', e.target.value)} placeholder="€/h" className={`px-2 py-1 text-xs border rounded ${th.input}`} />
              <input type="number" step="0.5" value={t.timeSpent} onChange={e => updateTask(t.id, 'timeSpent', e.target.value)} placeholder="Hours" className={`px-2 py-1 text-xs border rounded ${th.input}`} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="flex-1 px-2 py-1 bg-emerald-500 text-white text-xs rounded flex items-center justify-center gap-1"><Save className="w-3 h-3"/>Save</button>
              <button onClick={() => deleteTask(t.id)} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded"><Trash2 className="w-3 h-3"/></button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className={`font-medium ${th.text} text-sm`}>{t.title}</h3>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => setExpanded(isExp ? null : t.id)} className={`p-1 rounded ${th.hover} ${th.muted}`}>{isExp ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}</button>
                <button onClick={() => setEditing(t.id)} className={`p-1 rounded ${th.hover} ${th.muted}`}><Edit3 className="w-3 h-3"/></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              <span className="text-xs px-1.5 py-0.5 rounded" style={{backgroundColor:`${cl?.color}20`,color:cl?.color}}>{cl?.name}</span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{backgroundColor:`${cat?.color}20`,color:cat?.color}}>{cat?.name}</span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{backgroundColor:`${pri?.color}20`,color:pri?.color}}>{pri?.name}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {chkTot > 0 && <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${chkDone===chkTot?'bg-emerald-500/20 text-emerald-400':dark?'bg-slate-700':'bg-slate-100'} ${th.muted}`}><CheckSquare className="w-3 h-3"/>{chkDone}/{chkTot}</span>}
              {t.notes && <span className={`text-xs px-1.5 py-0.5 rounded ${dark?'bg-slate-700':'bg-slate-100'} ${th.muted}`}><FileText className="w-3 h-3"/></span>}
              {t.attachments?.length > 0 && <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${dark?'bg-slate-700':'bg-slate-100'} ${th.muted}`}><Paperclip className="w-3 h-3"/>{t.attachments.length}</span>}
            </div>
            <div className={`text-xs ${th.muted} mb-2 flex items-center gap-2 flex-wrap`}>
              <span className="text-amber-500 bg-amber-500/20 px-1.5 py-0.5 rounded">€{t.hourlyRate}/h</span>
              {t.startDate && <span>{t.startDate}</span>}
              {t.deadline && <span className="text-red-400">→ {t.deadline}</span>}
            </div>

            {isExp && (
              <div className={`mt-3 pt-3 border-t ${th.border} space-y-3`}>
                <div>
                  <label className={`text-xs ${th.muted} flex items-center gap-1 mb-1`}><FileText className="w-3 h-3"/>Notes</label>
                  <textarea value={t.notes || ''} onChange={e => updateTask(t.id, 'notes', e.target.value)} rows={2} placeholder="Σημειώσεις..." className={`w-full px-2 py-1 text-xs border rounded resize-none ${th.input}`}/>
                </div>
                <div>
                  <label className={`text-xs ${th.muted} flex items-center gap-1 mb-1`}><CheckSquare className="w-3 h-3"/>Checklist</label>
                  {(t.checklist || []).map(c => (
                    <div key={c.id} className={`flex items-center gap-2 py-1 px-2 rounded ${th.hover} group/c`}>
                      <button onClick={() => toggleCheck(t.id, c.id)} className={c.done ? 'text-emerald-400' : th.muted}>{c.done ? <CheckSquare className="w-4 h-4"/> : <SquareIcon className="w-4 h-4"/>}</button>
                      <span className={`flex-1 text-xs ${c.done ? 'line-through '+th.muted : th.text}`}>{c.text}</span>
                      <button onClick={() => delCheck(t.id, c.id)} className="opacity-0 group-hover/c:opacity-100 text-red-400"><X className="w-3 h-3"/></button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-1">
                    <input value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCheckItem(t.id)} placeholder="Νέο item..." className={`flex-1 px-2 py-1 text-xs border rounded ${th.input}`}/>
                    <button onClick={() => addCheckItem(t.id)} className="px-2 py-1 bg-blue-500 text-white text-xs rounded"><Plus className="w-3 h-3"/></button>
                  </div>
                </div>
                <div>
                  <label className={`text-xs ${th.muted} flex items-center gap-1 mb-1`}><Paperclip className="w-3 h-3"/>Attachments</label>
                  {(t.attachments || []).map(a => (
                    <div key={a.id} className={`flex items-center gap-2 py-1 px-2 rounded mb-1 ${dark?'bg-slate-700/50':'bg-slate-50'} group/a`}>
                      {a.type === 'link' ? <Link className="w-3 h-3 text-blue-400"/> : <FileText className="w-3 h-3 text-amber-400"/>}
                      <span className={`flex-1 text-xs truncate ${th.text}`}>{a.name}</span>
                      {a.type === 'link' && <a href={a.url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs">Open</a>}
                      <button onClick={() => delAtt(t.id, a.id)} className="opacity-0 group-hover/a:opacity-100 text-red-400"><X className="w-3 h-3"/></button>
                    </div>
                  ))}
                  <div className={`p-2 rounded ${dark?'bg-slate-700/30':'bg-slate-50'}`}>
                    <div className="flex gap-2 mb-1">
                      <button onClick={() => setNewAtt({...newAtt, type:'link'})} className={`flex-1 py-1 text-xs rounded flex items-center justify-center gap-1 ${newAtt.type==='link'?'bg-blue-500 text-white':dark?'bg-slate-600':'bg-slate-200'}`}><Link className="w-3 h-3"/>Link</button>
                      <button onClick={() => setNewAtt({...newAtt, type:'file'})} className={`flex-1 py-1 text-xs rounded flex items-center justify-center gap-1 ${newAtt.type==='file'?'bg-amber-500 text-white':dark?'bg-slate-600':'bg-slate-200'}`}><FileText className="w-3 h-3"/>File</button>
                    </div>
                    <input value={newAtt.name} onChange={e => setNewAtt({...newAtt, name: e.target.value})} placeholder="Όνομα..." className={`w-full px-2 py-1 text-xs border rounded mb-1 ${th.input}`}/>
                    <input value={newAtt.url} onChange={e => setNewAtt({...newAtt, url: e.target.value})} placeholder={newAtt.type==='link'?'https://...':'C:/path/file.pdf'} className={`w-full px-2 py-1 text-xs border rounded mb-1 ${th.input}`}/>
                    <button onClick={() => addAtt(t.id)} className="w-full py-1 bg-emerald-500 text-white text-xs rounded flex items-center justify-center gap-1"><Plus className="w-3 h-3"/>Add</button>
                  </div>
                </div>
              </div>
            )}

            <div className={`flex items-center justify-between pt-2 border-t ${th.border}`}>
              <div className="flex items-center gap-2">
                <Clock className={`w-3 h-3 ${th.muted}`}/>
                <span className={`text-xs font-mono ${th.muted}`}>{fmtH(t.timeSpent)}</span>
                <span className="text-xs text-emerald-400">€{earn.toFixed(0)}</span>
              </div>
              {t.status !== 'done' && (isTrack ? (
                <button onClick={stopTrack} className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs"><Square className="w-3 h-3"/>{fmt(elapsed)}</button>
              ) : (
                <button onClick={() => startTrack(t.id)} disabled={tracking} className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${tracking ? `${dark?'bg-slate-700':'bg-slate-100'} ${th.muted}` : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'}`}><Play className="w-3 h-3"/>Start</button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${th.bg}`}>
      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      `}</style>
      
      <header className={`${th.card} border-b ${th.border} px-4 py-2 flex items-center justify-between flex-wrap gap-2`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm">🦊</div>
          <span className={`font-bold ${th.text}`}>Piku Planner</span>
          <div className={`flex ${dark?'bg-slate-700':'bg-slate-100'} rounded-lg p-0.5`}>
            {[{id:'board',icon:FolderKanban,label:'Board'},{id:'calendar',icon:Calendar,label:'Calendar'},{id:'clients',icon:Users,label:'Clients'},{id:'reports',icon:BarChart3,label:'Reports'}].map(v => (
              <button key={v.id} onClick={() => setView(v.id)} className={`px-3 py-1.5 rounded text-xs flex items-center gap-1.5 ${view===v.id ? dark?'bg-slate-600 text-white':'bg-white shadow text-slate-800' : th.muted}`}>
                <v.icon className="w-3.5 h-3.5"/>{v.label}
              </button>
            ))}
          </div>
        </div>
        {tracking && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
            <span className={`text-sm ${th.muted} max-w-24 truncate`}>{tasks.find(t=>t.id===tracking)?.title}</span>
            <span className="font-mono text-red-400">{fmt(elapsed)}</span>
            <button onClick={stopTrack} className="p-1 rounded bg-red-500/30 text-red-400"><Square className="w-3 h-3"/></button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${dark?'bg-slate-700':'bg-slate-100'}`}>
            <button onClick={() => setStatsMonth(new Date(statsMonth.getFullYear(), statsMonth.getMonth() - 1))} className={`p-0.5 rounded ${th.hover}`}><ChevronLeft className="w-4 h-4"/></button>
            <span className={`text-xs font-medium w-12 text-center ${th.muted}`}>{monthNamesShort[statsMonth.getMonth()]}</span>
            <button onClick={() => setStatsMonth(new Date(statsMonth.getFullYear(), statsMonth.getMonth() + 1))} className={`p-0.5 rounded ${th.hover}`}><ChevronRight className="w-4 h-4"/></button>
          </div>
          <div className={`flex items-center gap-2 px-2 py-1 rounded ${dark?'bg-violet-500/20':'bg-violet-50'}`}>
            <Clock className="w-4 h-4 text-violet-400"/>
            <span className="font-mono text-violet-400 text-sm">{currentMonthStats.hours.toFixed(1)}h</span>
          </div>
          <div className={`flex items-center gap-2 px-2 py-1 rounded ${dark?'bg-emerald-500/20':'bg-emerald-50'}`}>
            <Euro className="w-4 h-4 text-emerald-400"/>
            <span className="text-emerald-400 text-sm font-semibold">€{currentMonthStats.earnings.toFixed(0)}</span>
          </div>
          <div className={`flex items-center gap-2 px-2 py-1 rounded ${dark?'bg-amber-500/10 border border-amber-500/30':'bg-amber-50 border border-amber-200'}`}>
            <span className={`text-xs ${th.muted}`}>Σύνολο:</span>
            <span className="font-mono text-xs text-amber-400">{totalH.toFixed(1)}h</span>
            <span className="text-amber-400">•</span>
            <span className="font-semibold text-xs text-amber-400">€{totalE.toFixed(0)}</span>
          </div>
          <button onClick={() => setDark(!dark)} className={`p-1.5 rounded ${th.hover} ${th.muted}`}>{dark ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {(view === 'board' || view === 'calendar') && (
          <aside className={`w-52 ${th.card} border-r ${th.border} flex flex-col flex-shrink-0`}>
            <div className={`p-2 border-b ${th.border}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${th.muted} uppercase`}>Clients</span>
                <button onClick={() => setShowAddClient(true)} className={`p-1 rounded ${th.hover}`}><Plus className={`w-3.5 h-3.5 ${th.muted}`}/></button>
              </div>
              {showAddClient && (
                <div className={`mb-2 p-2 rounded-lg ${dark?'bg-slate-700':'bg-slate-50'} space-y-2`}>
                  <input value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} placeholder="Client name..." className={`w-full px-2 py-1 text-sm border rounded ${th.input}`}/>
                  <div className="flex gap-2">
                    <input type="color" value={newClient.color} onChange={e => setNewClient({...newClient, color: e.target.value})} className="w-8 h-8 rounded cursor-pointer"/>
                    <button onClick={addClient} className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded">Add</button>
                    <button onClick={() => setShowAddClient(false)} className={`px-2 py-1 text-xs rounded ${dark?'bg-slate-600':'bg-slate-200'}`}><X className="w-3 h-3"/></button>
                  </div>
                </div>
              )}
              <button onClick={() => setSelectedClient(null)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm ${!selectedClient ? th.sel : `${th.hover} ${th.text}`}`}>
                <Users className="w-4 h-4"/>All ({tasks.length})
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-1">
              {clients.map(c => (
                <div key={c.id} className="group flex items-center">
                  <button onClick={() => setSelectedClient(selectedClient===c.id?null:c.id)} className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded text-sm ${selectedClient===c.id ? th.sel : `${th.hover} ${th.text}`}`}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:c.color}}/><span className="truncate">{c.name}</span>
                    <span className={`ml-auto text-xs ${dark?'bg-slate-600':'bg-slate-200'} px-1.5 rounded`}>{tasks.filter(t=>t.clientId===c.id).length}</span>
                  </button>
                  <button onClick={() => deleteClient(c.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/20 rounded"><Trash2 className="w-3 h-3"/></button>
                </div>
              ))}
            </div>
            <div className={`p-2 border-t ${th.border}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${th.muted} uppercase`}>Categories</span>
                <button onClick={() => setShowCatMgr(!showCatMgr)} className={`p-1 rounded ${th.hover} ${showCatMgr?'bg-blue-500/20 text-blue-400':''}`}><Tag className={`w-3.5 h-3.5 ${showCatMgr?'text-blue-400':th.muted}`}/></button>
              </div>
              {showCatMgr && (
                <div className={`mb-2 p-2 rounded-lg ${dark?'bg-slate-700':'bg-slate-50'} space-y-2`}>
                  <div className="flex gap-2">
                    <input value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} placeholder="Category..." className={`flex-1 px-2 py-1 text-xs border rounded ${th.input}`}/>
                    <input type="color" value={newCat.color} onChange={e => setNewCat({...newCat, color: e.target.value})} className="w-6 h-6 rounded cursor-pointer"/>
                    <button onClick={addCat} className="px-2 py-1 bg-blue-500 text-white text-xs rounded"><Plus className="w-3 h-3"/></button>
                  </div>
                </div>
              )}
              <div className="space-y-1 max-h-32 overflow-auto">
                {categories.map(c => (
                  <div key={c.id} className={`flex items-center justify-between py-1 px-1 rounded ${th.hover} group`}>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded" style={{backgroundColor:c.color}}/><span className={`text-xs ${th.text}`}>{c.name}</span></div>
                    <button onClick={() => deleteCat(c.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400"><Trash2 className="w-3 h-3"/></button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        {view === 'board' && (
          <main className="flex-1 p-4 overflow-x-auto">
            <div className="flex gap-4 h-full min-w-max">
              {columns.map(col => {
                const Icon = col.icon;
                return (
                  <div key={col.id} className={`w-80 flex flex-col ${th.col} rounded-xl`} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, col.id)}>
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{color:col.color}}/>
                        <span className={`font-semibold text-sm ${th.text}`}>{col.title}</span>
                        <span className={`text-xs ${dark?'bg-slate-700':'bg-white'} px-2 py-0.5 rounded-full ${th.muted}`}>{colTasks(col.id).length}</span>
                      </div>
                      <button onClick={() => setShowAddTask(col.id)} className={`p-1 rounded ${th.hover} ${th.muted}`}><Plus className="w-4 h-4"/></button>
                    </div>
                    {showAddTask === col.id && (
                      <div className={`mx-3 mb-3 p-3 ${th.card} rounded-lg border ${th.border} space-y-2`}>
                        <input placeholder="Task title..." value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className={`w-full px-2 py-1.5 text-sm border rounded ${th.input}`}/>
                        <div className="grid grid-cols-2 gap-2">
                          <select value={newTask.clientId} onChange={e => setNewTask({...newTask, clientId: e.target.value})} className={`px-2 py-1.5 text-xs border rounded ${th.input}`}>
                            <option value="">Client...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <select value={newTask.categoryId} onChange={e => setNewTask({...newTask, categoryId: e.target.value})} className={`px-2 py-1.5 text-xs border rounded ${th.input}`}>
                            <option value="">Category...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className={`px-2 py-1.5 text-xs border rounded ${th.input}`}>
                            {priorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <input type="number" value={newTask.hourlyRate} onChange={e => setNewTask({...newTask, hourlyRate: e.target.value})} placeholder="€/h" className={`px-2 py-1.5 text-xs border rounded ${th.input}`}/>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="date" value={newTask.startDate} onChange={e => setNewTask({...newTask, startDate: e.target.value})} className={`px-2 py-1.5 text-xs border rounded ${th.input}`}/>
                          <input type="date" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} className={`px-2 py-1.5 text-xs border rounded ${th.input}`}/>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => addTask(col.id)} className="flex-1 px-3 py-1.5 bg-blue-500 text-white text-xs rounded">Add Task</button>
                          <button onClick={() => setShowAddTask(null)} className={`px-3 py-1.5 text-xs rounded ${dark?'bg-slate-600':'bg-slate-200'}`}>Cancel</button>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 overflow-auto p-2 pt-0 space-y-2">
                      {colTasks(col.id).map(t => <TaskCard key={t.id} task={t}/>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        )}

        {view === 'calendar' && (
          <main className="flex-1 p-4 overflow-auto">
            <div className="max-w-5xl mx-auto">
              <div className={`mb-6 p-4 ${th.card} rounded-xl border ${th.border}`}>
                <h3 className={`font-semibold ${th.text} mb-3 flex items-center gap-2`}><Calendar className="w-5 h-5 text-blue-400"/>Σήμερα</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className={`text-xs ${th.muted} mb-2`}>🚀 Ξεκινούν σήμερα</div>
                    {getTodayTasks().starting.length === 0 ? <p className={`text-xs ${th.muted}`}>Κανένα task</p> : getTodayTasks().starting.map(task => (
                      <div key={task.id} className="text-sm py-1 px-2 rounded bg-blue-500/20 text-blue-400 mb-1">{task.title}</div>
                    ))}
                  </div>
                  <div>
                    <div className={`text-xs ${th.muted} mb-2`}>⚠️ Deadlines σήμερα</div>
                    {getTodayTasks().due.length === 0 ? <p className={`text-xs ${th.muted}`}>Κανένα deadline</p> : getTodayTasks().due.map(task => (
                      <div key={task.id} className="text-sm py-1 px-2 rounded bg-red-500/20 text-red-400 mb-1">{task.title}</div>
                    ))}
                  </div>
                  <div>
                    <div className={`text-xs ${th.muted} mb-2`}>🔄 Σε εξέλιξη</div>
                    {getTodayTasks().inProgress.length === 0 ? <p className={`text-xs ${th.muted}`}>Κανένα task</p> : getTodayTasks().inProgress.map(task => (
                      <div key={task.id} className="text-sm py-1 px-2 rounded bg-amber-500/20 text-amber-400 mb-1">{task.title}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className={`p-2 rounded-lg ${th.hover}`}><ChevronLeft className="w-5 h-5"/></button>
                <h2 className={`text-lg font-semibold ${th.text}`}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className={`p-2 rounded-lg ${th.hover}`}><ChevronRight className="w-5 h-5"/></button>
              </div>

              <div className={`${th.card} rounded-xl border ${th.border} p-4`}>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'].map(day => (
                    <div key={day} className={`text-center text-xs font-medium ${th.muted} py-2`}>{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentMonth).map((date, i) => {
                    const dayTasks = date ? getTasksForDate(date) : { starting: [], due: [] };
                    const isToday = date && date.toDateString() === new Date().toDateString();
                    return (
                      <div key={i} className={`min-h-24 p-1.5 rounded-lg border ${date ? `${dark?'bg-slate-800/50 border-slate-700':'bg-white border-slate-100'} hover:border-blue-400` : 'border-transparent'} ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
                        {date && (
                          <>
                            <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-400' : th.muted}`}>{date.getDate()}</div>
                            <div className="space-y-0.5">
                              {dayTasks.starting.slice(0, 2).map(task => {
                                const client = getClient(task.clientId);
                                return (
                                  <div key={`start-${task.id}`} className="text-xs px-1 py-0.5 rounded truncate" style={{ backgroundColor: `${client?.color}30`, color: client?.color }}>
                                    🚀 {task.title}
                                  </div>
                                );
                              })}
                              {dayTasks.due.slice(0, 2).map(task => (
                                <div key={`due-${task.id}`} className="text-xs px-1 py-0.5 rounded truncate bg-red-500/20 text-red-400">⚠️ {task.title}</div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className={`flex gap-4 justify-center mt-4 text-xs ${th.muted}`}>
                <span>🚀 Start Date</span>
                <span>⚠️ Deadline</span>
              </div>
            </div>
          </main>
        )}

        {view === 'clients' && (
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${th.text}`}>Clients</h2>
                <button onClick={() => setShowAddClient(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"><Plus className="w-4 h-4"/>Add Client</button>
              </div>
              <div className="grid gap-4">
                {clients.map(c => {
                  const ct = tasks.filter(t => t.clientId === c.id);
                  return (
                    <div key={c.id} className={`${th.card} rounded-xl border ${th.border} p-5`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white" style={{backgroundColor:c.color}}>{c.name[0]}</div>
                          <div><h3 className={`font-semibold ${th.text}`}>{c.name}</h3><p className={`text-sm ${th.muted}`}>{ct.length} tasks</p></div>
                        </div>
                        <button onClick={() => deleteClient(c.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 className="w-4 h-4"/></button>
                      </div>
                      <div className="grid grid-cols-5 gap-3">
                        <div className={`text-center p-3 rounded-lg ${dark?'bg-slate-700':'bg-slate-50'}`}><div className={`text-2xl font-bold ${th.muted}`}>{ct.filter(t=>t.status==='todo').length}</div><div className={`text-xs ${th.muted}`}>To Do</div></div>
                        <div className={`text-center p-3 rounded-lg ${dark?'bg-blue-500/20':'bg-blue-50'}`}><div className="text-2xl font-bold text-blue-400">{ct.filter(t=>t.status==='inprogress').length}</div><div className={`text-xs ${th.muted}`}>Progress</div></div>
                        <div className={`text-center p-3 rounded-lg ${dark?'bg-emerald-500/20':'bg-emerald-50'}`}><div className="text-2xl font-bold text-emerald-400">{ct.filter(t=>t.status==='done').length}</div><div className={`text-xs ${th.muted}`}>Done</div></div>
                        <div className={`text-center p-3 rounded-lg ${dark?'bg-violet-500/20':'bg-violet-50'}`}><div className="text-2xl font-bold text-violet-400 font-mono">{clientH(c.id).toFixed(1)}h</div><div className={`text-xs ${th.muted}`}>Hours</div></div>
                        <div className={`text-center p-3 rounded-lg ${dark?'bg-amber-500/20':'bg-amber-50'}`}><div className="text-2xl font-bold text-amber-400">€{clientE(c.id).toFixed(0)}</div><div className={`text-xs ${th.muted}`}>Earnings</div></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        )}

        {view === 'reports' && (
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className={`text-xl font-bold ${th.text}`}>Reports</h2>
              
              <div className={`${th.card} rounded-xl border ${th.border} p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold ${th.text}`}>📊 Μηνιαία Στατιστικά</h3>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${dark?'bg-slate-700':'bg-slate-100'}`}>
                    <button onClick={() => setStatsMonth(new Date(statsMonth.getFullYear(), statsMonth.getMonth() - 1))} className={`p-1 rounded ${th.hover}`}><ChevronLeft className="w-4 h-4"/></button>
                    <span className={`text-sm font-medium w-28 text-center ${th.text}`}>{monthNames[statsMonth.getMonth()]} {statsMonth.getFullYear()}</span>
                    <button onClick={() => setStatsMonth(new Date(statsMonth.getFullYear(), statsMonth.getMonth() + 1))} className={`p-1 rounded ${th.hover}`}><ChevronRight className="w-4 h-4"/></button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className={`text-center p-4 ${dark?'bg-slate-700':'bg-slate-50'} rounded-xl`}><div className={`text-3xl font-bold ${th.text}`}>{currentMonthStats.taskCount}</div><div className={`text-sm ${th.muted}`}>Tasks</div></div>
                  <div className={`text-center p-4 ${dark?'bg-violet-500/20':'bg-violet-50'} rounded-xl`}><div className="text-3xl font-bold text-violet-400 font-mono">{currentMonthStats.hours.toFixed(1)}h</div><div className={`text-sm ${th.muted}`}>Hours</div></div>
                  <div className={`text-center p-4 ${dark?'bg-emerald-500/20':'bg-emerald-50'} rounded-xl`}><div className="text-3xl font-bold text-emerald-400">€{currentMonthStats.earnings.toFixed(0)}</div><div className={`text-sm ${th.muted}`}>Earnings</div></div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className={`${th.card} rounded-xl border ${th.border} p-5 text-center`}><div className={`text-3xl font-bold ${th.text}`}>{tasks.length}</div><div className={`text-sm ${th.muted}`}>Total Tasks</div></div>
                <div className={`${th.card} rounded-xl border ${th.border} p-5 text-center`}><div className="text-3xl font-bold text-emerald-400">{tasks.filter(t=>t.status==='done').length}</div><div className={`text-sm ${th.muted}`}>Done</div></div>
                <div className={`${th.card} rounded-xl border ${th.border} p-5 text-center`}><div className="text-3xl font-bold text-violet-400 font-mono">{totalH.toFixed(1)}h</div><div className={`text-sm ${th.muted}`}>Total Hours</div></div>
                <div className={`${th.card} rounded-xl border ${th.border} p-5 text-center`}><div className="text-3xl font-bold text-amber-400">€{totalE.toFixed(0)}</div><div className={`text-sm ${th.muted}`}>Total Earnings</div></div>
              </div>

              <div className={`${th.card} rounded-xl border ${th.border} p-5`}>
                <h3 className={`font-semibold ${th.text} mb-4`}>Earnings by Client</h3>
                {clients.map(c => {
                  const earn = clientE(c.id);
                  const max = Math.max(...clients.map(cl=>clientE(cl.id)),1);
                  return (
                    <div key={c.id} className="flex items-center gap-4 mb-3">
                      <div className="w-28 flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor:c.color}}/><span className={`text-sm truncate ${th.text}`}>{c.name}</span></div>
                      <div className={`flex-1 h-6 ${dark?'bg-slate-700':'bg-slate-100'} rounded-full overflow-hidden`}><div className="h-full rounded-full" style={{width:`${(earn/max)*100}%`,backgroundColor:c.color}}/></div>
                      <span className="text-sm text-emerald-400 w-20 text-right font-semibold">€{earn.toFixed(0)}</span>
                    </div>
                  );
                })}
              </div>

              <div className={`${th.card} rounded-xl border ${th.border} p-5`}>
                <h3 className={`font-semibold ${th.text} mb-4`}>Time by Category</h3>
                <div className="grid grid-cols-4 gap-3">
                  {categories.map(c => {
                    const hrs = tasks.filter(t=>t.categoryId===c.id).reduce((s,t)=>s+t.timeSpent,0);
                    return (
                      <div key={c.id} className="text-center p-4 rounded-xl" style={{backgroundColor:`${c.color}20`}}>
                        <div className="text-xl font-bold font-mono" style={{color:c.color}}>{hrs.toFixed(1)}h</div>
                        <div className={`text-xs ${th.muted} mt-1`}>{c.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
