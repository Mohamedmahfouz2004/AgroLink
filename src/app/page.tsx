'use client';

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { useStore, Role, User } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Truck, Wallet, Users, Settings, LogOut, Menu, 
  Search, Bell, Sun, Moon, Plus, FileText, ChevronRight, Activity, DollarSign, Calendar, Map, MapPin, ArrowLeft, Trash2, Pencil, Archive, AlertTriangle, CheckCircle, Info, X
} from 'lucide-react';
import clsx from 'clsx';
import { format, isToday } from 'date-fns';
import { fetchAllData } from './actions';

// ===== Custom Modal System =====
type ModalType = 'alert' | 'confirm' | 'prompt' | 'select' | 'form';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface ModalState {
  type: ModalType;
  title: string;
  message?: string;
  inputLabel?: string;
  inputDefault?: string;
  options?: { value: string; label: string }[];
  fields?: FormField[];
  variant?: 'success' | 'error' | 'warning' | 'info';
  resolve: (value: any) => void;
}

const ModalContext = createContext<{
  showAlert: (title: string, variant?: 'success' | 'error' | 'warning' | 'info') => Promise<void>;
  showConfirm: (title: string, message?: string) => Promise<boolean>;
  showPrompt: (title: string, inputLabel?: string, defaultValue?: string) => Promise<string | null>;
  showSelect: (title: string, options: { value: string; label: string }[]) => Promise<string | null>;
  showForm: (title: string, fields: FormField[]) => Promise<Record<string, string> | null>;
}>({
  showAlert: async () => {},
  showConfirm: async () => false,
  showPrompt: async () => null,
  showSelect: async () => null,
  showForm: async () => null,
});

function useModal() { return useContext(ModalContext); }

function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const showAlert = useCallback((title: string, variant: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    return new Promise<void>((resolve) => {
      setModal({ type: 'alert', title, variant, resolve });
    });
  }, []);

  const showConfirm = useCallback((title: string, message?: string) => {
    return new Promise<boolean>((resolve) => {
      setModal({ type: 'confirm', title, message, resolve });
    });
  }, []);

  const showPrompt = useCallback((title: string, inputLabel?: string, defaultValue?: string) => {
    return new Promise<string | null>((resolve) => {
      setInputValue(defaultValue || '');
      setModal({ type: 'prompt', title, inputLabel, inputDefault: defaultValue, resolve });
    });
  }, []);

  const showSelect = useCallback((title: string, options: { value: string; label: string }[]) => {
    return new Promise<string | null>((resolve) => {
      setSelectedValue(options[0]?.value || '');
      setModal({ type: 'select', title, options, resolve });
    });
  }, []);

  const showForm = useCallback((title: string, fields: FormField[]) => {
    return new Promise<Record<string, string> | null>((resolve) => {
      const initial: Record<string, string> = {};
      fields.forEach(f => {
        initial[f.name] = f.type === 'select' && f.options?.length ? f.options[0].value : '';
      });
      setFormValues(initial);
      setModal({ type: 'form', title, fields, resolve });
    });
  }, []);

  const close = (value: any) => {
    modal?.resolve(value);
    setModal(null);
  };

  useEffect(() => {
    if (modal?.type === 'prompt' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [modal]);

  const variantIcon = {
    success: <CheckCircle size={28} className="text-green-500" />,
    error: <AlertTriangle size={28} className="text-red-500" />,
    warning: <AlertTriangle size={28} className="text-yellow-500" />,
    info: <Info size={28} className="text-blue-500" />,
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt, showSelect, showForm }}>
      {children}
      <AnimatePresence>
        {modal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => { if (modal.type !== 'alert') close(modal.type === 'confirm' ? false : null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border/50"
            >
              {/* Close button */}
              <button onClick={() => close(modal.type === 'confirm' ? false : modal.type === 'alert' ? undefined : null)} className="absolute top-4 left-4 text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                {modal.variant && variantIcon[modal.variant]}
                <h2 className="text-xl font-bold">{modal.title}</h2>
              </div>

              {modal.message && <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{modal.message}</p>}

              {/* Prompt input */}
              {modal.type === 'prompt' && (
                <div className="mb-4">
                  {modal.inputLabel && <label className="block text-sm font-medium mb-2">{modal.inputLabel}</label>}
                  <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') close(inputValue || null); }}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-colors"
                    placeholder="اكتب هنا..."
                  />
                </div>
              )}

              {/* Select dropdown */}
              {modal.type === 'select' && (
                <div className="mb-4 space-y-2 max-h-[300px] overflow-y-auto">
                  {modal.options?.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSelectedValue(opt.value); close(opt.value); }}
                      className={clsx(
                        "w-full text-right p-3 rounded-xl border transition-all",
                        selectedValue === opt.value 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-border/50 bg-secondary/30 hover:bg-secondary/50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Form inputs */}
              {modal.type === 'form' && modal.fields && (
                <div className="mb-4 space-y-4 max-h-[60vh] overflow-y-auto p-1">
                  {modal.fields.map(f => (
                    <div key={f.name}>
                      <label className="block text-sm font-medium mb-2">{f.label}</label>
                      {f.type === 'select' ? (
                        <select
                          value={formValues[f.name] || ''}
                          onChange={e => setFormValues(prev => ({ ...prev, [f.name]: e.target.value }))}
                          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-colors appearance-none"
                        >
                          <option value="" disabled>اختر...</option>
                          {f.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={f.type}
                          value={formValues[f.name] || ''}
                          onChange={e => setFormValues(prev => ({ ...prev, [f.name]: e.target.value }))}
                          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:border-primary outline-none transition-colors"
                          placeholder={f.placeholder}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                {modal.type === 'alert' && (
                  <button onClick={() => close(undefined)} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                    تمام
                  </button>
                )}
                {modal.type === 'confirm' && (
                  <>
                    <button onClick={() => close(false)} className="flex-1 bg-secondary text-foreground py-2.5 rounded-xl font-medium hover:bg-secondary/80 transition-colors">
                      إلغاء
                    </button>
                    <button onClick={() => close(true)} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                      تأكيد
                    </button>
                  </>
                )}
                {(modal.type === 'prompt' || modal.type === 'form') && (
                  <>
                    <button onClick={() => close(null)} className="flex-1 bg-secondary text-foreground py-2.5 rounded-xl font-medium hover:bg-secondary/80 transition-colors">
                      إلغاء
                    </button>
                    <button onClick={() => close(modal.type === 'form' ? formValues : (inputValue || null))} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors">
                      تأكيد
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}

export const formatArabicDate = (dString: string, includeTime = false) => {
  if (!dString) return '';
  const d = new Date(dString);
  const dayName = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(d);
  const dateFormatted = format(d, includeTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy');
  return `${dayName} ${dateFormatted}`;
};

export const getLocalTodayString = () => format(new Date(), 'yyyy-MM-dd');


export default function Dashboard() {
  const { currentUser, login, logout, transactions, truckRegistrations, expenses } = useStore();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Function to sync DB state
    const syncDb = () => {
      fetchAllData().then(data => {
        useStore.getState().initStore(data);
      }).catch(err => {
        console.error("Failed to load data from DB:", err);
      });
    };

    // Load data immediately
    syncDb();

    // Auto-refresh every 5 seconds to get live updates from workers
    const interval = setInterval(syncDb, 5000);

    return () => clearInterval(interval);
  }, []); // Remove theme dependency so it doesn't re-poll excessively

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1280;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };

  if (!mounted) return null;

  if (!currentUser) {
    return <LoginView onLogin={login} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'FARM_ADMIN', 'WORKER'] },
    { id: 'farms', label: 'المزارع', icon: Map, roles: ['SUPER_ADMIN'] },
    { id: 'trucks', label: 'العربيات', icon: Truck, roles: ['FARM_ADMIN', 'WORKER'] },
    { id: 'transactions', label: 'المعاملات المالية', icon: Activity, roles: ['SUPER_ADMIN', 'FARM_ADMIN'] },
    { id: 'expenses', label: 'الماليات والمصروفات', icon: Wallet, roles: ['WORKER'] },
    { id: 'reports', label: 'التقارير', icon: FileText, roles: ['SUPER_ADMIN', 'FARM_ADMIN'] },
    { id: 'closures', label: 'التقفيلات', icon: Archive, roles: ['SUPER_ADMIN', 'FARM_ADMIN'] },
    { id: 'users', label: 'المستخدمين', icon: Users, roles: ['SUPER_ADMIN'] },
    { id: 'settings', label: 'الإعدادات', icon: Settings, roles: ['SUPER_ADMIN'] },
  ];

  const allowedMenus = menuItems.filter(m => m.roles.includes(currentUser.role));

  return (
    <ModalProvider>
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Navbar */}
      <header className="relative h-16 glass border-b border-border/50 flex items-center justify-between px-4 sm:px-8 z-20 shrink-0 gap-4 print:hidden">
        <div className="flex items-center gap-4 lg:gap-8 flex-1 min-w-0">
          
          {/* Hamburger for Mobile (Right side in RTL) */}
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-secondary/50 text-muted-foreground xl:hidden shrink-0">
              <Menu size={20} />
            </button>
          )}

          {/* Desktop Logo */}
          <div onClick={() => setActiveTab('dashboard')} className="hidden xl:flex items-center gap-3 shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-white flex items-center justify-center text-xl shadow-lg shadow-red-500/20">
              🍅
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              أجرو لينك
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-1 flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {allowedMenus.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={clsx(
                  "flex items-center gap-2 px-3 xl:px-4 py-2 rounded-xl transition-all duration-200 shrink-0",
                  activeTab === item.id 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <item.icon size={18} className={activeTab === item.id ? "text-white" : ""} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Centered Logo */}
        {isMobile && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none xl:hidden">
            <div onClick={() => setActiveTab('dashboard')} className="flex items-center gap-2 pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-white flex items-center justify-center text-lg shadow-lg shadow-red-500/20">
                🍅
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                أجرو لينك
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 xl:gap-4 shrink-0">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-secondary/80 text-muted-foreground transition-colors relative z-10">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="relative hidden sm:block z-10">
            <button 
              onClick={() => setUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex flex-col text-right">
                <span className="text-sm font-semibold leading-tight">{currentUser.fullName}</span>
                <span className="text-[10px] text-muted-foreground leading-none">{currentUser.role.replace('_', ' ')}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {currentUser.fullName.charAt(0)}
              </div>
            </button>
            
            <AnimatePresence>
              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-2 left-0 w-48 glass rounded-2xl border border-border/50 shadow-xl z-50 overflow-hidden"
                  >
                    <button 
                      onClick={() => {
                        setUserMenuOpen(false);
                        setLogoutModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 transition-colors text-sm font-medium"
                    >
                      <LogOut size={16} />
                      تسجيل خروج
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar (Overlay + Sidebar) */}
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" 
                onClick={() => setSidebarOpen(false)} 
              />
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-[280px] glass border-l border-border/50 flex flex-col justify-between z-50"
              >
                <div className="flex flex-col h-full">
                  <div className="h-16 flex items-center px-6 border-b border-border/50 justify-between">
                    <span className="font-bold text-xl text-primary">القائمة</span>
                    <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-md hover:bg-secondary/50 text-muted-foreground">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                    {allowedMenus.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                        className={clsx(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                          activeTab === item.id 
                            ? "bg-primary text-white shadow-md shadow-primary/20" 
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        )}
                      >
                        <item.icon size={20} className={activeTab === item.id ? "text-white" : ""} />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </nav>
                  <div className="p-4 border-t border-border/50">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/30 mb-2">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                        {currentUser.fullName.charAt(0)}
                      </div>
                      <div className="flex flex-col text-left min-w-0">
                        <span className="text-sm font-semibold truncate">{currentUser.fullName}</span>
                        <span className="text-xs text-muted-foreground truncate">{currentUser.role.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setLogoutModalOpen(true); setSidebarOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={20} />
                      <span className="font-medium">تسجيل خروج</span>
                    </button>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative print:p-0 print:overflow-visible">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardOverview setActiveTab={setActiveTab} />}
              {activeTab === 'farms' && <FarmsView />}
              {activeTab === 'trucks' && <TrucksView />}
              {activeTab === 'transactions' && <TransactionsView />}
              {activeTab === 'expenses' && <WorkerFinancesView />}
              {activeTab === 'reports' && <ReportsView />}
              {activeTab === 'closures' && <ClosuresView />}
              {activeTab === 'users' && <UsersView />}
              {activeTab === 'settings' && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Logout Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setLogoutModalOpen(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="glass rounded-3xl p-6 w-full max-w-sm relative z-10 border border-border/50 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
                <LogOut size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2">تسجيل خروج</h2>
              <p className="text-muted-foreground mb-6">هل أنت متأكد أنك تريد تسجيل الخروج من النظام؟</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setLogoutModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border/50 hover:bg-secondary/50 font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  onClick={() => {
                    setLogoutModalOpen(false);
                    logout();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  تأكيد الخروج
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </ModalProvider>
  );
}

function DashboardOverview({ setActiveTab }: { setActiveTab: (t: string) => void }) {
  const { transactions, truckRegistrations, currentUser, farms, users } = useStore();
  
  let filteredTransactions = transactions;
  let filteredTrucks = truckRegistrations;

  if (currentUser?.role === 'WORKER') {
    filteredTransactions = transactions.filter(t => t.workerId === currentUser.id);
    filteredTrucks = truckRegistrations.filter(t => t.workerId === currentUser.id);
  } else if (currentUser?.role === 'FARM_ADMIN') {
    filteredTransactions = transactions.filter(t => t.farmId === currentUser.farmId);
    filteredTrucks = truckRegistrations.filter(t => t.farmId === currentUser.farmId);
  }

  const totalReceived = filteredTransactions.filter(t => t.type === 'RECEIPT').reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = filteredTransactions.filter(t => t.type !== 'RECEIPT').reduce((sum, t) => sum + t.amount, 0);
  const remainingBalance = totalReceived - totalSpent;
  const totalTrucksCount = filteredTrucks.length;
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">نظرة عامة</h1>
          <p className="text-muted-foreground">تابع الأرقام المالية والتشغيلية {currentUser?.role === 'SUPER_ADMIN' ? 'لكل المزارع' : 'للمزرعة'}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={currentUser?.role === 'SUPER_ADMIN' ? "إجمالي المسلم للمزارع" : "الفلوس اللي استلمتها"} value={`${totalReceived.toFixed(2)}`} icon={Wallet} />
        <StatCard title={currentUser?.role === 'SUPER_ADMIN' ? "إجمالي المصروفات (التشغيل)" : "الفلوس اللي اتصرفت"} value={`${totalSpent.toFixed(2)}`} icon={Activity} />
        <StatCard title={currentUser?.role === 'SUPER_ADMIN' ? "الرصيد المتبقي بالمزارع" : "الفلوس اللي فاضلة"} value={`${remainingBalance.toFixed(2)}`} icon={DollarSign} />
        <StatCard title={currentUser?.role === 'SUPER_ADMIN' ? "إجمالي العربيات بالمزارع" : "عدد العربيات"} value={totalTrucksCount.toString()} icon={Truck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className={clsx("glass rounded-2xl p-6 border border-border/50 shadow-sm", currentUser?.role === 'SUPER_ADMIN' ? "col-span-1 lg:col-span-3" : "col-span-1 lg:col-span-2")}>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><Activity size={20} className="text-primary"/> أحدث الحركات</h2>
          <div className="space-y-4">
            {filteredTransactions.slice(0, 5).map(trx => (
              <div key={trx.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/30 transition-colors border border-transparent hover:border-border/50">
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                    trx.type === 'RECEIPT' ? "bg-green-500/10 text-green-500" :
                    trx.type === 'EXPENSE' ? "bg-red-500/10 text-red-500" :
                    "bg-blue-500/10 text-blue-500"
                  )}>
                    {trx.type === 'RECEIPT' ? '+' : '-'}
                  </div>
                  <div>
                    <p className="font-medium">{trx.description}</p>
                    <p className="text-xs text-muted-foreground">{trx.referenceNumber} • {formatArabicDate(trx.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={clsx(
                    "font-bold",
                    trx.type === 'RECEIPT' ? "text-green-500" : "text-foreground"
                  )}>
                    <span dir="ltr" className="inline-block">{trx.type === 'RECEIPT' ? '+' : '-'}${trx.amount.toFixed(2)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trx.type === 'RECEIPT' ? 'استلام نقدية' : 
                     trx.type === 'EXPENSE' ? 'مصروف' : 
                     trx.type === 'CUSTODY' ? 'عهدة سيارة' : 
                     trx.type === 'OVERNIGHT' ? 'مبيت سيارة' : trx.type}
                  </p>
                </div>
              </div>
            ))}
            {filteredTransactions.length === 0 && (
              <div className="text-center text-muted-foreground py-8">مفيش حركات لسه.</div>
            )}
          </div>
        </div>

        {currentUser?.role !== 'SUPER_ADMIN' && (
          <div className="glass rounded-2xl p-6 border border-border/50 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">إجراءات سريعة</h2>
            <div className="grid grid-cols-2 gap-4">
               <div onClick={() => setActiveTab('trucks')} className="bg-secondary/30 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-primary hover:text-white transition-colors cursor-pointer group">
                 <Truck size={24} className="text-primary group-hover:text-white" />
                 <span className="text-sm font-medium">عربية جديدة</span>
               </div>
               <div onClick={() => setActiveTab('transactions')} className="bg-secondary/30 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-primary hover:text-white transition-colors cursor-pointer group">
                 <Wallet size={24} className="text-primary group-hover:text-white" />
                 <span className="text-sm font-medium">ضيف مصروف</span>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, action }: any) {
  return (
    <div className="glass rounded-2xl p-6 relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 text-primary/5 group-hover:text-primary/10 transition-colors">
        <Icon size={120} />
      </div>
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Icon size={18} />
            <h3 className="font-medium">{title}</h3>
          </div>
          <p className="text-4xl font-bold tracking-tight mb-2">{value}</p>
          {trend && <p className="text-sm text-green-500">{trend}</p>}
        </div>
        {action && (
          <div className="mt-2 z-20">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}

function TrucksView() {
  const { truckRegistrations, truckTypes, registerTruck, updateTruck, currentUser, users, farms } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editingTruckId, setEditingTruckId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'TODAY' | 'ALL' | 'RANGE'>('TODAY');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchL1, setSearchL1] = useState('');
  const [searchL2, setSearchL2] = useState('');
  const [searchL3, setSearchL3] = useState('');
  const [searchNum, setSearchNum] = useState('');
  
  let userTrucks = truckRegistrations;
  if (currentUser?.role === 'WORKER') {
    userTrucks = truckRegistrations.filter(t => t.workerId === currentUser.id);
  } else if (currentUser?.role === 'FARM_ADMIN') {
    userTrucks = truckRegistrations.filter(t => t.farmId === currentUser.farmId);
  }

  const displayedTrucks = userTrucks.filter(truck => {
    if (searchL1 && !truck.truckNumber.includes(searchL1)) return false;
    if (searchL2 && !truck.truckNumber.includes(searchL2)) return false;
    if (searchL3 && !truck.truckNumber.includes(searchL3)) return false;
    if (searchNum && !truck.truckNumber.includes(searchNum)) return false;
    
    if (filterMode === 'ALL') return true;
    
    const truckDate = new Date(truck.date);
    
    if (filterMode === 'TODAY') {
      return isToday(truckDate);
    }
    
    if (filterMode === 'RANGE') {
      if (fromDate) {
        const fDate = new Date(fromDate);
        fDate.setHours(0,0,0,0);
        if (truckDate < fDate) return false;
      }
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23,59,59,999);
        if (truckDate > tDate) return false;
      }
      return true;
    }
    
    return true;
  });

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const handleFormChange = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const l1 = formData.get('letter1') as string;
    const l2 = formData.get('letter2') as string;
    const l3 = formData.get('letter3') as string;
    const nums = formData.get('truckNumbers') as string;
    
    if (!l1 || !l2 || !l3 || !nums) {
      setDuplicateWarning(null);
      return;
    }
    
    const truckNumber = `${l1} ${l2} ${l3} - ${nums}`.trim();
    const today = getLocalTodayString();
    const farmId = (formData.get('farmId') as string) || currentUser!.farmId;
    if (!farmId) return;
    
    const existing = truckRegistrations.find(t => 
      t.truckNumber === truckNumber && 
      t.farmId === farmId && 
      t.date.startsWith(today) &&
      t.id !== editingTruckId
    );
    
    if (existing) {
      const worker = users.find(u => u.id === existing.workerId);
      setDuplicateWarning(`العربية دي متسجلة النهاردة عن طريق ${worker?.fullName || 'عامل آخر'}`);
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const l1 = formData.get('letter1') as string;
    const l2 = formData.get('letter2') as string;
    const l3 = formData.get('letter3') as string;
    const nums = formData.get('truckNumbers') as string;
    const truckNumber = `${l1} ${l2} ${l3} - ${nums}`.trim();

    const payload = {
      truckNumber,
      truckTypeId: formData.get('truckTypeId') as string,
      farmId: (formData.get('farmId') as string) || currentUser!.farmId!,
      workerId: currentUser!.id,
      custodyAmount: parseFloat(formData.get('custodyAmount') as string) || 0,
      overnightAmount: parseFloat(formData.get('overnightAmount') as string) || 0,
      driverName: formData.get('driverName') as string,
      driverPhone: formData.get('driverPhone') as string,
      truckLoad: parseFloat(formData.get('truckLoad') as string) || 0,
      truckLoadUnit: formData.get('truckLoadUnit') as 'TON' | 'CRATE',
    };

    let result;
    if (editingTruckId) {
      result = updateTruck(editingTruckId, payload);
    } else {
      result = registerTruck(payload);
    }
    
    if (result.success) {
      setIsOpen(false);
      setEditingTruckId(null);
      setDuplicateWarning(null);
    } else {
      setDuplicateWarning(result.error || null);
    }
  };

  const editingTruck = editingTruckId ? truckRegistrations.find(t => t.id === editingTruckId) : null;
  let l1='', l2='', l3='', num='';
  if (editingTruck) {
    const parts = editingTruck.truckNumber.split('-');
    const letters = parts[0]?.trim().split(' ') || [];
    l1 = letters[0] || ''; l2 = letters[1] || ''; l3 = letters[2] || '';
    num = parts[1]?.trim() || '';
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">العربيات</h1>
        <button onClick={() => { setEditingTruckId(null); setIsOpen(true); }} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
          <Plus size={18} /> تسجيل عربية
        </button>
      </div>

      <div className="glass rounded-2xl p-4 border border-border/50 flex flex-wrap gap-6 items-end">
        <div>
          <label className="block text-xs font-medium mb-1 text-muted-foreground">البحث برقم العربية</label>
          <div className="flex gap-2 items-center" dir="rtl">
            <input 
              value={searchL1} onChange={(e) => setSearchL1(e.target.value)}
              maxLength={1} className="w-10 h-10 shrink-0 text-center font-bold bg-secondary/50 border border-border rounded-lg focus:border-primary outline-none" placeholder="أ" 
            />
            <input 
              value={searchL2} onChange={(e) => setSearchL2(e.target.value)}
              maxLength={1} className="w-10 h-10 shrink-0 text-center font-bold bg-secondary/50 border border-border rounded-lg focus:border-primary outline-none" placeholder="ب" 
            />
            <input 
              value={searchL3} onChange={(e) => setSearchL3(e.target.value)}
              maxLength={1} className="w-10 h-10 shrink-0 text-center font-bold bg-secondary/50 border border-border rounded-lg focus:border-primary outline-none" placeholder="ج" 
            />
            <span className="text-muted-foreground font-bold shrink-0">-</span>
            <div className="relative w-32 sm:w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                value={searchNum} onChange={(e) => setSearchNum(e.target.value)}
                maxLength={4} type="text" inputMode="numeric" pattern="[0-9]*"
                className="w-full h-10 text-center font-bold tracking-widest bg-secondary/50 border border-border rounded-lg pl-8 pr-2 focus:border-primary outline-none" placeholder="1234" 
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 text-muted-foreground">التاريخ</label>
          <select 
            value={filterMode} 
            onChange={(e) => setFilterMode(e.target.value as any)}
            className="bg-secondary/50 border border-border rounded-lg h-10 px-4 text-sm focus:border-primary outline-none"
          >
            <option value="TODAY">اليوم فقط</option>
            <option value="ALL">كل الأيام</option>
            <option value="RANGE">فترة محددة</option>
          </select>
        </div>

        {filterMode === 'RANGE' && (
          <>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">من</label>
              <input 
                type="date" 
                lang="en-GB"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-secondary/50 border border-border rounded-lg h-10 px-4 text-sm focus:border-primary outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">إلى</label>
              <input 
                type="date" 
                lang="en-GB"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-secondary/50 border border-border rounded-lg h-10 px-4 text-sm focus:border-primary outline-none" 
              />
            </div>
          </>
        )}
      </div>

      <div className="glass rounded-2xl overflow-x-auto border border-border/50">
        <table className="w-full min-w-[800px] text-center border-collapse">
          <thead>
            <tr className="bg-secondary/30 border-b border-border/50">
              <th className="p-4 font-medium text-muted-foreground whitespace-nowrap">رقم العربية</th>
              <th className="p-4 font-medium text-muted-foreground whitespace-nowrap">النوع</th>
              <th className="p-4 font-medium text-muted-foreground whitespace-nowrap">السواق</th>
              <th className="p-4 font-medium text-muted-foreground whitespace-nowrap">رقم التليفون</th>
              <th className="p-4 font-medium text-muted-foreground whitespace-nowrap">الحمولة</th>
              <th className="p-4 font-medium text-muted-foreground whitespace-nowrap">العهدة</th>
              <th className="p-4 font-medium text-muted-foreground whitespace-nowrap">المبيت</th>
              <th className="p-4 font-medium text-muted-foreground whitespace-nowrap">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {displayedTrucks.map(truck => (
              <tr key={truck.id} className="border-b border-border/10 hover:bg-secondary/10">
                <td className="p-4 font-medium" dir="rtl">{truck.truckNumber}</td>
                <td className="p-4">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                    {truckTypes.find(t => t.id === truck.truckTypeId)?.name}
                  </span>
                </td>
                <td className="p-4 font-medium">{truck.driverName || '-'}</td>
                <td className="p-4 text-muted-foreground">
                  <span dir="ltr">{truck.driverPhone || '-'}</span>
                </td>
                <td className="p-4">{truck.truckLoad ? `${truck.truckLoad} ${truck.truckLoadUnit === 'CRATE' ? 'قفص' : 'طن'}` : '-'}</td>
                <td className="p-4">${truck.custodyAmount.toFixed(2)}</td>
                <td className="p-4">${truck.overnightAmount.toFixed(2)}</td>
                <td className="p-4 text-muted-foreground text-sm" dir="rtl">{formatArabicDate(truck.date, true)}</td>
                <td className="p-4">
                  <button onClick={() => { setEditingTruckId(truck.id); setIsOpen(true); }} className="text-blue-500 hover:text-blue-600 transition-colors p-1" title="تعديل">
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {displayedTrucks.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  {filterMode === 'TODAY' && !(searchL1 || searchL2 || searchL3 || searchNum) ? 'مفيش عربيات متسجلة انهارده.' : 'مفيش نتائج مطابقة للبحث.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border/50">
            <h2 className="text-2xl font-bold mb-6">{editingTruckId ? 'تعديل بيانات العربية' : 'تسجيل عربية'}</h2>
            <form key={editingTruckId || 'new'} onSubmit={handleRegister} onChange={handleFormChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">رقم العربية</label>
                <div className="flex gap-2 items-center" dir="rtl">
                  <input required name="letter1" defaultValue={l1} maxLength={1} className="w-10 h-11 shrink-0 text-center font-bold text-lg bg-secondary/50 border border-border rounded-lg focus:border-primary outline-none" placeholder="أ" />
                  <input required name="letter2" defaultValue={l2} maxLength={1} className="w-10 h-11 shrink-0 text-center font-bold text-lg bg-secondary/50 border border-border rounded-lg focus:border-primary outline-none" placeholder="ب" />
                  <input required name="letter3" defaultValue={l3} maxLength={1} className="w-10 h-11 shrink-0 text-center font-bold text-lg bg-secondary/50 border border-border rounded-lg focus:border-primary outline-none" placeholder="ج" />
                  <span className="text-muted-foreground font-bold shrink-0">-</span>
                  <input required name="truckNumbers" defaultValue={num} maxLength={4} type="text" inputMode="numeric" pattern="[0-9]*" className="min-w-0 flex-1 h-11 text-center font-bold text-lg tracking-widest bg-secondary/50 border border-border rounded-lg px-2 focus:border-primary outline-none" placeholder="1234" />
                </div>
                {duplicateWarning && (
                  <p className="text-red-500 text-sm mt-2 font-bold">{duplicateWarning}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">اسم السواق</label>
                  <input required name="driverName" defaultValue={editingTruck?.driverName} className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">رقم التليفون</label>
                  <input required name="driverPhone" defaultValue={editingTruck?.driverPhone} type="tel" dir="ltr" className="w-full text-right bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label className="block text-sm font-medium mb-1">النوع</label>
                  <select required name="truckTypeId" defaultValue={editingTruck?.truckTypeId} className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none">
                    {truckTypes.filter(t => t.isActive || t.id === editingTruck?.truckTypeId).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-medium mb-1">الحمولة</label>
                  <div className="flex gap-2">
                    <input required type="number" step="0.1" name="truckLoad" defaultValue={editingTruck?.truckLoad} className="min-w-0 flex-1 bg-secondary/50 border border-border rounded-lg px-2 py-2 focus:border-primary outline-none" placeholder="الكمية" />
                    <select required name="truckLoadUnit" defaultValue={editingTruck?.truckLoadUnit} className="w-20 shrink-0 bg-secondary/50 border border-border rounded-lg px-1 py-2 focus:border-primary outline-none text-sm">
                      <option value="TON">طن</option>
                      <option value="CRATE">قفص</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {currentUser?.role === 'SUPER_ADMIN' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">المزرعة</label>
                    <select required name="farmId" defaultValue={editingTruck?.farmId || ''} className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none">
                      <option value="" disabled>اختر المزرعة...</option>
                      {farms.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">العهدة</label>
                  <input type="number" step="0.01" name="custodyAmount" defaultValue={editingTruck?.custodyAmount || 0} className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المبيت</label>
                  <input type="number" step="0.01" name="overnightAmount" defaultValue={editingTruck?.overnightAmount || 0} className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => { setIsOpen(false); setEditingTruckId(null); }} className="flex-1 bg-secondary text-foreground py-2 rounded-lg font-medium">إلغاء</button>
                <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg font-medium">{editingTruckId ? 'حفظ التعديلات' : 'تسجيل'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function FarmsView() {
  const { farms, truckRegistrations, transactions, users, addReceipt, addFarm } = useStore();
  const { showAlert, showConfirm, showPrompt, showSelect, showForm } = useModal();
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const todayStr = getLocalTodayString();
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [showReceiptsModal, setShowReceiptsModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);

  if (selectedFarmId) {
    const farm = farms.find(f => f.id === selectedFarmId);
    let farmTrucks = truckRegistrations.filter(t => t.farmId === selectedFarmId);
    let farmTransactions = transactions.filter(t => t.farmId === selectedFarmId);
    const farmUsers = users.filter(u => u.farmId === selectedFarmId);
    
    if (fromDate) {
      const fDate = new Date(fromDate);
      fDate.setHours(0,0,0,0);
      farmTrucks = farmTrucks.filter(t => new Date(t.date) >= fDate);
      farmTransactions = farmTransactions.filter(t => new Date(t.date) >= fDate);
    }
    if (toDate) {
      const tDate = new Date(toDate);
      tDate.setHours(23,59,59,999);
      farmTrucks = farmTrucks.filter(t => new Date(t.date) <= tDate);
      farmTransactions = farmTransactions.filter(t => new Date(t.date) <= tDate);
    }

    const totalReceived = farmTransactions.filter(t => t.type === 'RECEIPT').reduce((sum, t) => sum + t.amount, 0);
    const totalSpent = farmTransactions.filter(t => t.type !== 'RECEIPT').reduce((sum, t) => sum + t.amount, 0);

    return (
      <div className="space-y-6">
        <button onClick={() => { setSelectedFarmId(null); setFromDate(''); setToDate(''); }} className="text-muted-foreground hover:text-foreground mb-4">
          &rarr; عودة للمزارع
        </button>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{farm?.name}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {!fromDate && !toDate && 'كل العربيات والحركات المالية (بدون تحديد فترة)'}
              {fromDate && !toDate && `عربيات وحركات من ${formatArabicDate(fromDate)}`}
              {!fromDate && toDate && `عربيات وحركات حتى ${formatArabicDate(toDate)}`}
              {fromDate && toDate && (fromDate === toDate ? `عربيات وحركات ${formatArabicDate(fromDate)}` : `عربيات وحركات الفترة من ${formatArabicDate(fromDate)} إلى ${formatArabicDate(toDate)}`)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={async () => {
                const formValues = await showForm('تسليم عهدة', [
                  { name: 'amount', label: 'أدخل المبلغ (مثال: 5000)', type: 'number', placeholder: 'اكتب هنا...' },
                  { name: 'workerId', label: 'اختر العامل أو المدير', type: 'select', options: farmUsers.map(u => ({ value: u.id, label: u.fullName })) }
                ]);
                
                if (!formValues || !formValues.amount || !formValues.workerId) return;

                const workerId = formValues.workerId;
                if (!farmUsers.find((u: any) => u.id === workerId)) {
                  await showAlert('عامل غير صحيح', 'error');
                  return;
                }
                
                addReceipt(parseFloat(formValues.amount), workerId, selectedFarmId!, `تسليم عهدة نقدي للمزرعة`);
                await showAlert('تم تسجيل العهدة بنجاح!', 'success');
            }} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors">
              <Plus size={18} /> تسليم فلوس
            </button>
            <button onClick={async () => {
                const confirmed = await showConfirm(`حفظ تقفيل ${fromDate === toDate ? 'اليوم ' + formatArabicDate(fromDate) : 'الفترة المحددة'}`, 'هذا الإجراء سيقوم بحفظ التقفيل في سجل التقفيلات للطباعة والرجوع إليه لاحقاً.');
                if (!confirmed) return;
                
                const { addClosure, currentUser } = useStore.getState();
                addClosure({
                  farmId: selectedFarmId!,
                  date: fromDate || new Date().toISOString(),
                  closedByUserId: currentUser!.id,
                  totalReceived,
                  totalSpent,
                  trucksCount: farmTrucks.length,
                });

                await showAlert('تم حفظ التقفيل بنجاح! يمكنك مراجعته وطباعته من صفحة التقفيلات.', 'success');
            }} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
              <Archive size={18} /> تقفيل اليوم
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center bg-secondary/30 p-4 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
             <label className="text-sm font-medium">من تاريخ:</label>
             <input type="date" lang="en-GB" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-secondary/50 border border-border rounded-lg h-10 px-4 text-sm focus:border-primary outline-none" />
          </div>
          <div className="flex items-center gap-2">
             <label className="text-sm font-medium">إلى تاريخ:</label>
             <input type="date" lang="en-GB" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-secondary/50 border border-border rounded-lg h-10 px-4 text-sm focus:border-primary outline-none" />
          </div>
          {(fromDate !== todayStr || toDate !== todayStr) && (
            <button onClick={() => { setFromDate(todayStr); setToDate(todayStr); }} className="text-sm text-red-500 hover:text-red-600 mr-auto font-medium transition-colors">
               عرض حركات اليوم فقط
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard 
            title="إجمالي المسلم" 
            value={`${totalReceived.toFixed(2)}`} 
            icon={Wallet} 
            action={
              <button 
                onClick={() => setShowReceiptsModal(true)} 
                className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg font-bold transition-colors border border-primary/20"
              >
                عرض التفاصيل
              </button>
            }
          />
          <StatCard 
            title="إجمالي المصروف" 
            value={`${totalSpent.toFixed(2)}`} 
            icon={Activity} 
            action={
              <button 
                onClick={() => setShowExpensesModal(true)} 
                className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-lg font-bold transition-colors border border-red-500/20"
              >
                عرض التفاصيل
              </button>
            }
          />
          <StatCard title="عدد العربيات" value={farmTrucks.length.toString()} icon={Truck} />
        </div>

        <div className="glass rounded-2xl overflow-x-auto border border-border/50 mt-6">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="p-4 font-medium">العربية</th>
                <th className="p-4 font-medium">السواق</th>
                <th className="p-4 font-medium">رقم السواق</th>
                <th className="p-4 font-medium">المسجل (العامل)</th>
                <th className="p-4 font-medium">العهدة</th>
                <th className="p-4 font-medium">المبيت</th>
                <th className="p-4 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {farmTrucks.map(t => {
                const worker = users.find(u => u.id === t.workerId);
                return (
                  <tr key={t.id} className="border-b border-border/10 hover:bg-secondary/10">
                    <td className="p-4 font-bold">{t.truckNumber}</td>
                    <td className="p-4">{t.driverName || '-'}</td>
                    <td className="p-4 font-mono text-muted-foreground" dir="ltr">{t.driverPhone || '-'}</td>
                    <td className="p-4 text-primary font-bold">{worker?.fullName}</td>
                    <td className="p-4">${t.custodyAmount.toFixed(2)}</td>
                    <td className="p-4">${t.overnightAmount.toFixed(2)}</td>
                    <td className="p-4 text-sm text-muted-foreground" dir="rtl">{formatArabicDate(t.date)}</td>
                  </tr>
                )
              })}
              {farmTrucks.length === 0 && <tr><td colSpan={6} className="p-8 text-muted-foreground">مفيش عربيات مسجلة في المزرعة دي لسه.</td></tr>}
            </tbody>
          </table>
        </div>

        {showReceiptsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl p-6 shadow-2xl border border-border/50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">تفاصيل الفلوس المستلمة</h2>
                <button onClick={() => setShowReceiptsModal(false)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>
              
              <div className="overflow-x-auto border border-border/50 rounded-xl">
                <table className="w-full text-center text-sm border-collapse">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border/50">
                      <th className="p-3 font-medium">المبلغ</th>
                      <th className="p-3 font-medium">التفاصيل</th>
                      <th className="p-3 font-medium">المسجل</th>
                      <th className="p-3 font-medium">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmTransactions.filter(t => t.type === 'RECEIPT').map(trx => {
                      const worker = users.find(u => u.id === trx.workerId);
                      return (
                        <tr key={trx.id} className="border-b border-border/10 hover:bg-secondary/10">
                          <td className="p-3 font-bold text-green-500" dir="ltr">+${trx.amount.toFixed(2)}</td>
                          <td className="p-3 truncate max-w-[200px]" title={trx.description}>{trx.description || '-'}</td>
                          <td className="p-3">{worker?.fullName || '-'}</td>
                          <td className="p-3 text-muted-foreground text-xs" dir="rtl">{formatArabicDate(trx.date)}</td>
                        </tr>
                      )
                    })}
                    {farmTransactions.filter(t => t.type === 'RECEIPT').length === 0 && (
                      <tr><td colSpan={4} className="p-6 text-muted-foreground text-center">مفيش فلوس اتسلمت في الفترة دي.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 text-center">
                <button onClick={() => setShowReceiptsModal(false)} className="bg-secondary text-foreground px-6 py-2 rounded-lg font-medium hover:bg-secondary/80 transition-colors">
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showExpensesModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl p-6 shadow-2xl border border-border/50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">تفاصيل المصروفات</h2>
                <button onClick={() => setShowExpensesModal(false)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>
              
              <div className="overflow-x-auto border border-border/50 rounded-xl">
                <table className="w-full text-center text-sm border-collapse">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border/50">
                      <th className="p-3 font-medium">نوع الحركة</th>
                      <th className="p-3 font-medium">المبلغ</th>
                      <th className="p-3 font-medium">التفاصيل</th>
                      <th className="p-3 font-medium">المسجل</th>
                      <th className="p-3 font-medium">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmTransactions.filter(t => t.type !== 'RECEIPT').map(trx => {
                      const worker = users.find(u => u.id === trx.workerId);
                      return (
                        <tr key={trx.id} className="border-b border-border/10 hover:bg-secondary/10">
                          <td className="p-3">
                            <span className={clsx(
                              "px-2 py-1 rounded-md text-xs font-medium",
                              trx.type === 'EXPENSE' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                            )}>
                              {trx.type === 'EXPENSE' ? 'مصروف' : 
                               trx.type === 'CUSTODY' ? 'عهدة سيارة' : 
                               trx.type === 'OVERNIGHT' ? 'مبيت سيارة' : trx.type}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-red-500" dir="ltr">-${trx.amount.toFixed(2)}</td>
                          <td className="p-3 truncate max-w-[200px]" title={trx.description}>{trx.description || '-'}</td>
                          <td className="p-3">{worker?.fullName || '-'}</td>
                          <td className="p-3 text-muted-foreground text-xs" dir="rtl">{formatArabicDate(trx.date)}</td>
                        </tr>
                      )
                    })}
                    {farmTransactions.filter(t => t.type !== 'RECEIPT').length === 0 && (
                      <tr><td colSpan={5} className="p-6 text-muted-foreground text-center">مفيش مصروفات اتسجلت في الفترة دي.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 text-center">
                <button onClick={() => setShowExpensesModal(false)} className="bg-secondary text-foreground px-6 py-2 rounded-lg font-medium hover:bg-secondary/80 transition-colors">
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">إدارة المزارع</h1>
        <button onClick={async () => {
          const name = await showPrompt('إضافة مزرعة جديدة', 'اسم المزرعة');
          if (name) addFarm(name);
        }} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
          <Plus size={18} /> إضافة مزرعة
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farms.map(f => {
           const truckCount = truckRegistrations.filter(t => t.farmId === f.id).length;
           return (
             <div key={f.id} onClick={() => setSelectedFarmId(f.id)} className="glass p-6 rounded-2xl cursor-pointer border border-transparent hover:border-primary transition-all group relative overflow-hidden">
               <div className="absolute -right-6 -top-6 text-primary/5 group-hover:text-primary/10 transition-colors">
                 <Map size={120} />
               </div>
               <div className="relative z-10">
                 <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                   <MapPin size={20} className="text-primary" />
                   {f.name}
                 </h3>
                 <p className="text-muted-foreground">إجمالي العربيات: {truckCount}</p>
               </div>
             </div>
           )
        })}
        {farms.length === 0 && <p className="text-muted-foreground col-span-full">مفيش مزارع متسجلة.</p>}
      </div>
    </div>
  )
}

function UsersView() {
  const { users, farms, addUser, updateUser } = useStore();
  const { showConfirm } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: formData.get('fullName') as string,
      username: formData.get('username') as string,
      role: formData.get('role') as Role,
      farmId: (formData.get('farmId') as string) || undefined,
      passwordHash: formData.get('passwordHash') as string || 'password',
      isActive: true,
    };
    
    if (editUser) {
      updateUser(editUser.id, data);
    } else {
      addUser(data as any);
    }
    
    setIsOpen(false);
    setEditUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">إدارة المستخدمين</h1>
        <button onClick={() => { setEditUser(null); setIsOpen(true); }} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
          <Plus size={18} /> إضافة مستخدم
        </button>
      </div>

      <div className="glass rounded-2xl overflow-x-auto border border-border/50">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-secondary/30 border-b border-border/50">
              <th className="p-4 font-medium text-muted-foreground">الكود</th>
              <th className="p-4 font-medium text-muted-foreground">الاسم</th>
              <th className="p-4 font-medium text-muted-foreground">اسم الدخول</th>
              <th className="p-4 font-medium text-muted-foreground">الصلاحية</th>
              <th className="p-4 font-medium text-muted-foreground">المزرعة التابع لها</th>
              <th className="p-4 font-medium text-muted-foreground">الحالة</th>
              <th className="p-4 font-medium text-muted-foreground">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-border/10 hover:bg-secondary/10">
                <td className="p-4 font-mono text-sm text-muted-foreground">{u.id}</td>
                <td className="p-4 font-bold">{u.fullName}</td>
                <td className="p-4">{u.username}</td>
                <td className="p-4">
                  <span className={clsx("px-3 py-1 rounded-full text-xs font-medium", u.role === 'SUPER_ADMIN' ? 'bg-red-500/10 text-red-500' : u.role === 'FARM_ADMIN' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500')}>
                    {u.role === 'SUPER_ADMIN' ? 'مدير نظام' : u.role === 'FARM_ADMIN' ? 'مدير مزرعة' : 'عامل'}
                  </span>
                </td>
                <td className="p-4">{farms.find(f => f.id === u.farmId)?.name || '-'}</td>
                <td className="p-4">
                  <button onClick={() => updateUser(u.id, { isActive: !u.isActive })} className={clsx("px-3 py-1 rounded-full text-xs font-medium transition-colors", u.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500')}>
                    {u.isActive ? 'نشط' : 'موقوف'}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => { setEditUser(u); setIsOpen(true); }} className="text-blue-500/70 hover:text-blue-500 transition-colors p-1" title="تعديل">
                      <Pencil size={18} />
                    </button>
                    <button onClick={async () => { const ok = await showConfirm('إيقاف الحساب', 'هل تريد إيقاف هذا الحساب؟'); if(ok) updateUser(u.id, { isActive: false }); }} className="text-red-500/70 hover:text-red-500 transition-colors p-1" title="إيقاف">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border/50">
            <h2 className="text-2xl font-bold mb-6">{editUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">الاسم بالكامل</label>
                <input required defaultValue={editUser?.fullName} name="fullName" className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">اسم الدخول (Username)</label>
                <input required defaultValue={editUser?.username} name="username" dir="ltr" className="w-full text-right bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">كلمة المرور</label>
                <input required defaultValue={editUser?.passwordHash || 'password'} name="passwordHash" className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الصلاحية</label>
                <select required defaultValue={editUser?.role} name="role" className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none">
                  <option value="WORKER">عامل</option>
                  <option value="FARM_ADMIN">مدير مزرعة</option>
                  <option value="SUPER_ADMIN">مدير نظام</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">المزرعة (اختياري)</label>
                <select name="farmId" defaultValue={editUser?.farmId || ''} className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none">
                  <option value="">-- بدون مزرعة --</option>
                  {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => { setIsOpen(false); setEditUser(null); }} className="flex-1 bg-secondary text-foreground py-2 rounded-lg font-medium">إلغاء</button>
                <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg font-medium">{editUser ? 'تعديل' : 'إضافة'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function SettingsView() {
  const { 
    truckTypes, expenseCategories, addTruckType, toggleTruckType, deleteTruckType, 
    addExpenseCategory, toggleExpenseCategory, deleteExpenseCategory, currentUser 
  } = useStore();
  const { showPrompt, showConfirm } = useModal();
  
  if (currentUser?.role !== 'SUPER_ADMIN') {
    return <div>غير مصرح لك</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">إعدادات النظام</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass rounded-2xl p-6 border border-border/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">أنواع العربيات</h2>
            <button onClick={async () => {
              const name = await showPrompt('إضافة نوع عربية', 'اسم النوع الجديد');
              if (name) addTruckType(name);
            }} className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-lg font-medium hover:bg-primary/20 transition-colors">
              + إضافة جديد
            </button>
          </div>
          <div className="space-y-3">
            {truckTypes.map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                <span className={clsx("font-medium", !t.isActive && "line-through text-muted-foreground")}>{t.name}</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => toggleTruckType(t.id)}
                    className={clsx(
                      "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                      t.isActive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                    )}
                  >
                    {t.isActive ? 'مفعل' : 'موقوف'}
                  </button>
                  <button 
                    onClick={async () => { const ok = await showConfirm(`مسح "${t.name}"`, 'هل أنت متأكد؟'); if (ok) deleteTruckType(t.id); }} 
                    className="text-red-500/70 hover:text-red-500 transition-colors p-1"
                    title="مسح"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-border/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">بنود المصروفات</h2>
            <button onClick={async () => {
              const name = await showPrompt('إضافة بند مصروفات', 'اسم البند الجديد');
              if (name) addExpenseCategory(name);
            }} className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-lg font-medium hover:bg-primary/20 transition-colors">
              + إضافة جديد
            </button>
          </div>
          <div className="space-y-3">
            {expenseCategories.map(c => (
              <div key={c.id} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                <span className={clsx("font-medium", !c.isActive && "line-through text-muted-foreground")}>{c.name}</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => toggleExpenseCategory(c.id)}
                    className={clsx(
                      "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                      c.isActive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                    )}
                  >
                    {c.isActive ? 'مفعل' : 'موقوف'}
                  </button>
                  <button 
                    onClick={async () => { const ok = await showConfirm(`مسح "${c.name}"`, 'هل أنت متأكد؟'); if (ok) deleteExpenseCategory(c.id); }} 
                    className="text-red-500/70 hover:text-red-500 transition-colors p-1"
                    title="مسح"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginView({ onLogin }: { onLogin: (username: string, password: string) => { success: boolean; error?: string } | void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim()) {
      setError('اكتب اسم المستخدم');
      return;
    }
    if (!password.trim()) {
      setError('اكتب كلمة المرور');
      return;
    }
    
    const result = onLogin(username, password);
    if (result && !result.success && result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-10 rounded-3xl max-w-md w-full border border-border/50 shadow-2xl"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-xl shadow-red-500/30">
            🍅
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">أجرو لينك</h1>
          <p className="text-muted-foreground">سجل دخول لحسابك</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl mb-6 text-sm text-center font-medium"
          >
            ⚠️ {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">اسم المستخدم</label>
            <input 
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              className="w-full bg-secondary/50 border border-border focus:border-primary rounded-xl px-4 py-3 outline-none transition-colors"
              placeholder="اكتب اسم الدخول..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">كلمة المرور</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full bg-secondary/50 border border-border focus:border-primary rounded-xl px-4 py-3 outline-none transition-colors pl-12"
                placeholder="اكتب كلمة المرور..."
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-primary/20">
            دخول
          </button>
        </form>

      </motion.div>
    </div>
  )
}

function ReportsView() {
  const { transactions, users, farms, currentUser } = useStore();
  
  // If the user is FARM_ADMIN, only show their farm.
  const visibleFarms = currentUser?.role === 'SUPER_ADMIN' 
    ? farms 
    : farms.filter(f => f.id === currentUser?.farmId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">التقارير المالية</h1>
          <p className="text-muted-foreground">تفاصيل المصروفات والعهد لكل مزرعة والعمال المسؤولين عنها.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {visibleFarms.map(farm => {
          const farmTrx = transactions.filter(t => t.farmId === farm.id);
          const farmRec = farmTrx.filter(t => t.type === 'RECEIPT').reduce((sum, t) => sum + t.amount, 0);
          const farmSpent = farmTrx.filter(t => t.type !== 'RECEIPT').reduce((sum, t) => sum + t.amount, 0);
          const farmBalance = farmRec - farmSpent;

          const farmWorkers = users.filter(u => u.farmId === farm.id && u.role !== 'SUPER_ADMIN');

          return (
            <div key={farm.id} className="glass rounded-3xl p-6 md:p-8 border border-border/50 shadow-sm relative overflow-hidden">
              <div className="absolute -left-10 -top-10 text-primary/5 pointer-events-none">
                 <Map size={200} />
              </div>
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-border/50 pb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-inner">
                      <MapPin size={24} />
                    </div>
                    {farm.name}
                  </h2>
                  <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                    <div className="bg-secondary/40 px-5 py-3 rounded-2xl flex-1 lg:flex-none border border-border/50 shadow-sm">
                      <span className="text-muted-foreground text-sm block mb-1">إجمالي المسلم</span>
                      <span className="font-bold text-xl">${farmRec.toFixed(2)}</span>
                    </div>
                    <div className="bg-secondary/40 px-5 py-3 rounded-2xl flex-1 lg:flex-none border border-border/50 shadow-sm">
                      <span className="text-muted-foreground text-sm block mb-1">إجمالي المصروف</span>
                      <span className="font-bold text-xl">${farmSpent.toFixed(2)}</span>
                    </div>
                    <div className={clsx("px-5 py-3 rounded-2xl flex-1 lg:flex-none border shadow-sm", farmBalance >= 0 ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20")}>
                      <span className={clsx("text-sm block mb-1", farmBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>المتبقي بالمزرعة</span>
                      <span className={clsx("font-bold text-xl", farmBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                        {farmBalance >= 0 ? '+' : '-'}${Math.abs(farmBalance).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Users size={20} className="text-primary"/> تفاصيل عهد العمال والمديرين
                  </h3>
                  {farmWorkers.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {farmWorkers.map(worker => {
                        const workerTrx = transactions.filter(t => t.workerId === worker.id);
                        const wRec = workerTrx.filter(t => t.type === 'RECEIPT').reduce((sum, t) => sum + t.amount, 0);
                        const wSpent = workerTrx.filter(t => t.type !== 'RECEIPT').reduce((sum, t) => sum + t.amount, 0);
                        const wBalance = wRec - wSpent;

                        return (
                          <div key={worker.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 p-5 bg-background/60 hover:bg-background/80 transition-all rounded-2xl border border-border/50 shadow-sm group">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-secondary text-foreground flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-110 transition-transform">
                                {worker.fullName.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-lg block">{worker.fullName}</span>
                                <span className="text-sm px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{worker.role === 'FARM_ADMIN' ? 'مدير مزرعة' : 'عامل'}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm w-full sm:w-auto justify-end bg-secondary/30 p-3 rounded-xl border border-border/30">
                              <div className="flex flex-col items-center px-2">
                                <span className="text-xs text-muted-foreground mb-1">استلم</span>
                                <span className="font-bold">${wRec.toFixed(2)}</span>
                              </div>
                              <div className="w-px h-8 bg-border/50"></div>
                              <div className="flex flex-col items-center px-2">
                                <span className="text-xs text-muted-foreground mb-1">صرف</span>
                                <span className="font-bold">${wSpent.toFixed(2)}</span>
                              </div>
                              <div className="w-px h-8 bg-border/50"></div>
                              <div className="flex flex-col items-center px-2">
                                <span className="text-xs text-muted-foreground mb-1">المتبقي</span>
                                <span className={clsx("font-bold text-base", wBalance >= 0 ? "text-green-500" : "text-red-500")}>
                                  {wBalance >= 0 ? '+' : '-'}${Math.abs(wBalance).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-10 bg-secondary/20 rounded-2xl border border-dashed border-border/50">مفيش عمال متسجلين في المزرعة دي لسه.</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {visibleFarms.length === 0 && (
          <div className="text-center py-16 text-muted-foreground glass rounded-3xl border border-border/50">مفيش مزارع متسجلة في النظام.</div>
        )}
      </div>
    </div>
  )
}

function TransactionsView() {
  const { transactions, users, farms, currentUser } = useStore();
  const [filterWorkerId, setFilterWorkerId] = useState<string>('ALL');
  const [filterFarmId, setFilterFarmId] = useState<string>('ALL');
  const [filterFromDate, setFilterFromDate] = useState<string>('');
  const [filterToDate, setFilterToDate] = useState<string>('');
  
  const visibleTransactions = transactions.filter(t => {
    if (t.type === 'CUSTODY' || t.type === 'OVERNIGHT') return false;
    if (currentUser?.role === 'SUPER_ADMIN') return true;
    return t.farmId === currentUser?.farmId;
  });

  const involvedWorkerIds = Array.from(new Set(visibleTransactions.map(t => t.workerId).filter(Boolean)));
  const involvedWorkers = users.filter(u => involvedWorkerIds.includes(u.id));

  let filteredTransactions = visibleTransactions;

  if (filterFarmId !== 'ALL') {
    filteredTransactions = filteredTransactions.filter(t => t.farmId === filterFarmId);
  }

  if (filterWorkerId !== 'ALL') {
    filteredTransactions = filteredTransactions.filter(t => t.workerId === filterWorkerId);
  }
  
  if (filterFromDate) {
    const fDate = new Date(filterFromDate);
    fDate.setHours(0,0,0,0);
    filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= fDate);
  }
  
  if (filterToDate) {
    const tDate = new Date(filterToDate);
    tDate.setHours(23,59,59,999);
    filteredTransactions = filteredTransactions.filter(t => new Date(t.date) <= tDate);
  }

  const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let workerTotals = null;
  if (filterWorkerId !== 'ALL' || filterFarmId !== 'ALL') {
    const wRec = filteredTransactions.filter(t => t.type === 'RECEIPT').reduce((sum, t) => sum + t.amount, 0);
    const wSpent = filteredTransactions.filter(t => t.type !== 'RECEIPT').reduce((sum, t) => sum + t.amount, 0);
    workerTotals = { wRec, wSpent, wBalance: wRec - wSpent };
  }

  const handleExportExcel = () => {
    const tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; direction: rtl; font-family: sans-serif; }
          th, td { border: 1px solid #000; padding: 10px; text-align: center; vertical-align: middle; }
          th { background-color: #f2f2f2; font-weight: bold; font-size: 14pt; }
          .header-row { background-color: #e6e6e6; font-size: 16pt; font-weight: bold; height: 50px; text-align: right; padding-right: 15px; }
          .amount-green { color: #166534; font-weight: bold; }
          .amount-red { color: #991b1b; font-weight: bold; }
          .text-left { text-align: left; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="8" class="header-row">
              تم التصدير بواسطة: ${currentUser?.fullName}
              ${filterFarmId !== 'ALL' ? ` | المزرعة: ${farms.find(f => f.id === filterFarmId)?.name}` : ''}
              ${filterWorkerId !== 'ALL' ? ` | العامل: ${users.find(u => u.id === filterWorkerId)?.fullName}` : ''}
              ${filterFromDate ? ` | من: ${filterFromDate}` : ''} 
              ${filterToDate ? ` | إلى: ${filterToDate}` : ''}
            </td>
          </tr>
          <tr>
            <th>رقم المرجع</th>
            <th>النوع</th>
            <th>المبلغ</th>
            <th>البيان</th>
            <th>المزرعة</th>
            <th>اللي سلم</th>
            <th>اللي استلم</th>
            <th>التاريخ</th>
          </tr>
          ${sortedTransactions.map(trx => {
            const isReceipt = trx.type === 'RECEIPT';
            const farm = farms.find(f => f.id === trx.farmId);
            const worker = users.find(u => u.id === trx.workerId);
            const typeStr = trx.type === 'RECEIPT' ? 'تسليم عهدة' : 
                            trx.type === 'EXPENSE' ? 'مصروف' : 
                            trx.type === 'CUSTODY' ? 'عهدة سيارة' : 
                            trx.type === 'OVERNIGHT' ? 'مبيت سيارة' : trx.type;
            const amountStr = (isReceipt ? '+' : '-') + trx.amount.toFixed(2);
            const dateStr = formatArabicDate(trx.date, true);
            
            const payer = isReceipt ? 'الإدارة' : (worker?.fullName || '-');
            const receiver = isReceipt ? (worker?.fullName || '-') : 
                             (trx.type === 'CUSTODY' || trx.type === 'OVERNIGHT') ? 'السائق' : 'جهة المصروف';

            return `
              <tr>
                <td class="text-left" style="mso-number-format:'\\@';">${trx.referenceNumber}</td>
                <td>${typeStr}</td>
                <td class="${isReceipt ? 'amount-green' : 'amount-red'}" dir="ltr" style="mso-number-format:'\\@';">${amountStr}</td>
                <td>${trx.description || '-'}</td>
                <td>${farm?.name || '-'}</td>
                <td>${payer}</td>
                <td>${receiver}</td>
                <td class="text-left" style="mso-number-format:'\\@';">${dateStr}</td>
              </tr>
            `;
          }).join('')}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Transactions_${format(new Date(), 'yyyyMMdd_HHmm')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="hidden print:block mb-8 text-center" dir="rtl">
        <h1 className="text-3xl font-bold mb-4">تقرير المعاملات المالية - أجرو لينك</h1>
        <div className="grid grid-cols-2 gap-4 text-right border-2 border-black p-4 mb-4 font-bold text-sm bg-gray-50">
          <div>تم الإصدار بواسطة: {currentUser?.fullName} ({currentUser?.role === 'SUPER_ADMIN' ? 'مدير نظام' : 'مدير مزرعة'})</div>
          <div>تاريخ التقرير: {format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
          {filterFarmId !== 'ALL' && <div>المزرعة: {farms.find(f => f.id === filterFarmId)?.name}</div>}
          {filterWorkerId !== 'ALL' && <div>تم التصفية للعامل: {users.find(u => u.id === filterWorkerId)?.fullName}</div>}
          {filterFromDate && <div>من تاريخ: {filterFromDate}</div>}
          {filterToDate && <div>إلى تاريخ: {filterToDate}</div>}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">المعاملات المالية</h1>
          <p className="text-muted-foreground">سجل تفصيلي بكل حركة مالية (استلام، صرف، عهد).</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm">
            <FileText size={18} /> Excel
          </button>
          <button onClick={() => window.print()} className="bg-secondary text-foreground hover:bg-secondary/80 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm">
            <Activity size={18} /> طباعة
          </button>
        </div>
      </div>

      <div className="glass p-4 rounded-xl border border-border/50 mb-6 flex flex-col xl:flex-row gap-4 xl:items-center justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-4">
          {currentUser?.role === 'SUPER_ADMIN' && (
            <div className="flex items-center gap-2">
               <label className="text-sm font-medium whitespace-nowrap">المزرعة:</label>
               <select 
                  value={filterFarmId} 
                  onChange={e => setFilterFarmId(e.target.value)}
                  className="bg-secondary/50 border border-border rounded-lg h-10 px-4 text-sm focus:border-primary outline-none min-w-[150px]"
               >
                  <option value="ALL">الكل</option>
                  {farms.map(f => (
                     <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
               </select>
            </div>
          )}
          <div className="flex items-center gap-2">
             <label className="text-sm font-medium whitespace-nowrap">اللي استلم:</label>
             <select 
                value={filterWorkerId} 
                onChange={e => setFilterWorkerId(e.target.value)}
                className="bg-secondary/50 border border-border rounded-lg h-10 px-4 text-sm focus:border-primary outline-none min-w-[150px]"
             >
                <option value="ALL">الكل</option>
                {involvedWorkers.map(w => (
                   <option key={w.id} value={w.id}>{w.fullName} ({w.role === 'FARM_ADMIN' ? 'مدير' : 'عامل'})</option>
                ))}
             </select>
          </div>
          
          <div className="flex items-center gap-2">
             <label className="text-sm font-medium whitespace-nowrap">من تاريخ:</label>
             <input 
                type="date" 
                lang="en-GB"
                value={filterFromDate} 
                onChange={e => setFilterFromDate(e.target.value)} 
                className="bg-secondary/50 border border-border rounded-lg h-10 px-4 text-sm focus:border-primary outline-none" 
             />
          </div>

          <div className="flex items-center gap-2">
             <label className="text-sm font-medium whitespace-nowrap">إلى تاريخ:</label>
             <input 
                type="date" 
                lang="en-GB"
                value={filterToDate} 
                onChange={e => setFilterToDate(e.target.value)} 
                className="bg-secondary/50 border border-border rounded-lg h-10 px-4 text-sm focus:border-primary outline-none" 
             />
          </div>

          {(filterWorkerId !== 'ALL' || filterFarmId !== 'ALL' || filterFromDate || filterToDate) && (
            <button onClick={() => { setFilterWorkerId('ALL'); setFilterFarmId('ALL'); setFilterFromDate(''); setFilterToDate(''); }} className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors">
               إلغاء الفلاتر
            </button>
          )}
        </div>

        {workerTotals && (
          <div className="flex items-center gap-4 bg-background/50 px-4 py-2 rounded-lg border border-border/50">
             <div className="text-sm"><span className="text-muted-foreground mr-1">استلم:</span> <span className="font-bold text-green-500">${workerTotals.wRec.toFixed(2)}</span></div>
             <div className="w-px h-6 bg-border/50"></div>
             <div className="text-sm"><span className="text-muted-foreground mr-1">صرف:</span> <span className="font-bold text-red-500">${workerTotals.wSpent.toFixed(2)}</span></div>
             <div className="w-px h-6 bg-border/50"></div>
             <div className="text-sm"><span className="text-muted-foreground mr-1">المتبقي:</span> <span className={clsx("font-bold", workerTotals.wBalance >= 0 ? "text-green-500" : "text-red-500")}>{workerTotals.wBalance >= 0 ? '+' : '-'}${Math.abs(workerTotals.wBalance).toFixed(2)}</span></div>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-border/50 print:border-none print:shadow-none print:bg-transparent">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-center border-collapse print:border print:border-black print:text-black">
            <thead>
              <tr className="bg-secondary/30 border-b border-border/50 print:bg-gray-200 print:border-black">
                <th className="p-4 font-medium text-muted-foreground print:text-black print:border print:border-black">رقم المرجع</th>
                <th className="p-4 font-medium text-muted-foreground print:text-black print:border print:border-black">النوع</th>
                <th className="p-4 font-medium text-muted-foreground print:text-black print:border print:border-black">المبلغ</th>
                <th className="p-4 font-medium text-muted-foreground print:text-black print:border print:border-black">البيان</th>
                <th className="p-4 font-medium text-muted-foreground print:text-black print:border print:border-black">المزرعة</th>
                <th className="p-4 font-medium text-muted-foreground bg-primary/5 print:bg-transparent print:text-black print:border print:border-black">اللي سلم</th>
                <th className="p-4 font-medium text-muted-foreground bg-primary/5 print:bg-transparent print:text-black print:border print:border-black">اللي استلم</th>
                <th className="p-4 font-medium text-muted-foreground print:text-black print:border print:border-black">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map(trx => {
                const isReceipt = trx.type === 'RECEIPT';
                const farm = farms.find(f => f.id === trx.farmId);
                const worker = users.find(u => u.id === trx.workerId);
                
                const payer = isReceipt ? 'الإدارة' : (worker?.fullName || '-');
                const receiver = isReceipt ? (worker?.fullName || '-') : 
                                 (trx.type === 'CUSTODY' || trx.type === 'OVERNIGHT') ? 'السائق' : 'جهة المصروف';

                return (
                  <tr key={trx.id} className="border-b border-border/10 hover:bg-secondary/10 transition-colors print:border-black">
                    <td className="p-4 font-mono text-sm text-muted-foreground print:text-black print:border print:border-black" dir="ltr">{trx.referenceNumber}</td>
                    <td className="p-4 print:border print:border-black">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap print:p-0 print:bg-transparent",
                        isReceipt ? "bg-green-500/10 text-green-500 print:text-green-700" : 
                        trx.type === 'EXPENSE' ? "bg-red-500/10 text-red-500 print:text-red-700" : 
                        "bg-blue-500/10 text-blue-500 print:text-blue-700"
                      )}>
                        {trx.type === 'RECEIPT' ? 'تسليم عهدة' : 
                         trx.type === 'EXPENSE' ? 'مصروف' : 
                         trx.type === 'CUSTODY' ? 'عهدة سيارة' : 
                         trx.type === 'OVERNIGHT' ? 'مبيت سيارة' : trx.type}
                      </span>
                    </td>
                    <td className={clsx("p-4 font-bold whitespace-nowrap print:border print:border-black", isReceipt ? "text-green-500 print:text-green-700" : "text-foreground print:text-black")} dir="ltr">
                      {isReceipt ? '+' : '-'}${trx.amount.toFixed(2)}
                    </td>
                    <td className="p-4 max-w-[200px] truncate print:max-w-none print:whitespace-normal print:border print:border-black" title={trx.description}>{trx.description}</td>
                    <td className="p-4 print:border print:border-black">{farm?.name || '-'}</td>
                    <td className="p-4 font-bold text-primary/80 bg-primary/5 print:bg-transparent print:text-black print:border print:border-black">{payer}</td>
                    <td className="p-4 font-bold text-foreground bg-primary/5 print:bg-transparent print:text-black print:border print:border-black">{receiver}</td>
                    <td className="p-4 text-sm text-muted-foreground whitespace-nowrap print:text-black print:border print:border-black" dir="rtl">{formatArabicDate(trx.date, true)}</td>
                  </tr>
                )
              })}
              {sortedTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    مفيش أي حركات مالية مسجلة لسه.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function WorkerFinancesView() {
  const { transactions, expenseCategories, addReceipt, addExpense, currentUser } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [trxType, setTrxType] = useState<'RECEIPT' | 'EXPENSE'>('RECEIPT');
  const [catSelection, setCatSelection] = useState<string>('');
  const [otherCatName, setOtherCatName] = useState('');
  
  const [viewTab, setViewTab] = useState<'RECEIPTS' | 'EXPENSES'>('RECEIPTS');
  const todayStr = getLocalTodayString();
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);

  const workerTransactions = transactions.filter(t => t.workerId === currentUser?.id);
  
  let filteredTransactions = workerTransactions;
  if (fromDate) {
    const fDate = new Date(fromDate);
    fDate.setHours(0,0,0,0);
    filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= fDate);
  }
  if (toDate) {
    const tDate = new Date(toDate);
    tDate.setHours(23,59,59,999);
    filteredTransactions = filteredTransactions.filter(t => new Date(t.date) <= tDate);
  }

  const receiptsList = filteredTransactions.filter(t => t.type === 'RECEIPT').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const expensesList = filteredTransactions.filter(t => t.type !== 'RECEIPT').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const displayList = viewTab === 'RECEIPTS' ? receiptsList : expensesList;

  const totalReceived = receiptsList.reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = expensesList.reduce((sum, t) => sum + t.amount, 0);

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const sourceOrNote = formData.get('sourceOrNote') as string || '';
    const workerName = currentUser?.fullName || 'العامل';
    
    if (trxType === 'RECEIPT') {
      const fromWhom = formData.get('fromWhom') as string;
      const desc = fromWhom ? `${workerName} استلم من ${fromWhom} ${sourceOrNote ? '- ' + sourceOrNote : ''}` : `${workerName} استلم نقدية - ${sourceOrNote}`;
      addReceipt(amount, currentUser!.id, currentUser!.farmId || 'f1', desc);
    } else {
      const finalCategoryName = catSelection === 'OTHER' ? otherCatName : expenseCategories.find(c=>c.id===catSelection)?.name || 'مصروف عام';
      const desc = sourceOrNote ? `${workerName} صرف (${finalCategoryName}) - ${sourceOrNote}` : `${workerName} صرف (${finalCategoryName})`;
      
      addExpense({
        title: desc,
        amount,
        categoryId: catSelection === 'OTHER' ? 'misc' : (catSelection || 'misc'),
        farmId: currentUser!.farmId || 'f1',
        workerId: currentUser!.id
      });
    }
    setIsOpen(false);
    setCatSelection('');
    setOtherCatName('');
  };

  const handleExportExcel = () => {
    const tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; direction: rtl; font-family: sans-serif; }
          th, td { border: 1px solid #000; padding: 10px; text-align: center; vertical-align: middle; }
          th { background-color: #f2f2f2; font-weight: bold; font-size: 14pt; }
          .header-row { background-color: #e6e6e6; font-size: 16pt; font-weight: bold; height: 50px; text-align: right; padding-right: 15px; }
          .amount-green { color: #166534; font-weight: bold; }
          .amount-red { color: #991b1b; font-weight: bold; }
          .text-left { text-align: left; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="4" class="header-row">
              كشف حساب العامل: ${currentUser?.fullName}
              ${fromDate ? ` | من: ${fromDate}` : ''} 
              ${toDate ? ` | إلى: ${toDate}` : ''}
              | نوع الكشف: ${viewTab === 'RECEIPTS' ? 'الاستلامات' : 'المصروفات'}
            </td>
          </tr>
          <tr>
            <th>النوع</th>
            <th>المبلغ</th>
            <th>التفاصيل / الملاحظة</th>
            <th>التاريخ</th>
          </tr>
          ${displayList.map(trx => {
            const isReceipt = trx.type === 'RECEIPT';
            const typeStr = trx.type === 'RECEIPT' ? 'استلام نقدية' : 
                            trx.type === 'EXPENSE' ? 'مصروف' : 
                            trx.type === 'CUSTODY' ? 'عهدة سيارة' : 
                            trx.type === 'OVERNIGHT' ? 'مبيت سيارة' : trx.type;
            const amountStr = (isReceipt ? '+' : '-') + trx.amount.toFixed(2);
            const dateStr = formatArabicDate(trx.date, true);
            
            return `
              <tr>
                <td>${typeStr}</td>
                <td class="${isReceipt ? 'amount-green' : 'amount-red'}" dir="ltr" style="mso-number-format:'\\@';">${amountStr}</td>
                <td>${trx.description || '-'}</td>
                <td class="text-left" style="mso-number-format:'\\@';">${dateStr}</td>
              </tr>
            `;
          }).join('')}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Worker_Finances_${format(new Date(), 'yyyyMMdd_HHmm')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="hidden print:block mb-8 text-center" dir="rtl">
        <h1 className="text-3xl font-bold mb-4">كشف حساب عامل - أجرو لينك</h1>
        <div className="grid grid-cols-2 gap-4 text-right border-2 border-black p-4 mb-4 font-bold text-sm bg-gray-50">
          <div>العامل: {currentUser?.fullName}</div>
          <div>تاريخ التقرير: {format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
          {fromDate && <div>من تاريخ: {fromDate}</div>}
          {toDate && <div>إلى تاريخ: {toDate}</div>}
          <div>القسم: {viewTab === 'RECEIPTS' ? 'الاستلامات' : 'المصروفات'}</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">الماليات والمصروفات</h1>
          <p className="text-muted-foreground">سجل الفلوس اللي استلمتها واللي صرفتها.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsOpen(true)} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm">
            <Plus size={18} /> إضافة عملية
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 print:hidden">
         <div className="glass p-6 rounded-xl border border-border/50 text-center">
            <h3 className="text-muted-foreground mb-2">إجمالي اللي استلمته (في هذه الفترة)</h3>
            <p className="text-3xl font-bold text-green-500" dir="ltr">+${totalReceived.toFixed(2)}</p>
         </div>
         <div className="glass p-6 rounded-xl border border-border/50 text-center">
            <h3 className="text-muted-foreground mb-2">إجمالي اللي صرفته (في هذه الفترة)</h3>
            <p className="text-3xl font-bold text-red-500" dir="ltr">-${totalSpent.toFixed(2)}</p>
         </div>
      </div>

      <div className="glass p-4 rounded-xl border border-border/50 mb-6 flex flex-col xl:flex-row gap-4 xl:items-center justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2 p-1 bg-secondary/50 rounded-lg">
            <button 
              onClick={() => setViewTab('RECEIPTS')}
              className={clsx("px-4 py-2 rounded-md font-medium transition-colors text-sm", viewTab === 'RECEIPTS' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            >الاستلامات</button>
            <button 
              onClick={() => setViewTab('EXPENSES')}
              className={clsx("px-4 py-2 rounded-md font-medium transition-colors text-sm", viewTab === 'EXPENSES' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            >المصروفات والعهد</button>
          </div>
          
          <div className="h-6 w-px bg-border hidden xl:block"></div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium whitespace-nowrap">من تاريخ:</label>
            <input 
              type="date" 
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="bg-secondary/50 border border-border rounded-lg h-10 px-4 text-sm focus:border-primary outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium whitespace-nowrap">إلى تاريخ:</label>
            <input 
              type="date" 
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="bg-secondary/50 border border-border rounded-lg h-10 px-4 text-sm focus:border-primary outline-none"
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-4 xl:mt-0">
          <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm text-sm">
            <FileText size={16} /> Excel
          </button>
          <button onClick={() => window.print()} className="bg-secondary text-foreground hover:bg-secondary/80 px-3 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm text-sm">
            <Activity size={16} /> طباعة
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl border border-border/50 overflow-hidden">
        <div className="p-4 bg-secondary/30 border-b border-border/50 font-bold text-lg print:hidden">
          {viewTab === 'RECEIPTS' ? 'سجل الاستلامات (الفلوس اللي دخلتلك)' : 'سجل المصروفات (الفلوس اللي صرفتها)'}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-secondary/50 border-b border-border/50">
              <tr>
                <th className="p-4 font-medium text-muted-foreground">نوع الحركة</th>
                <th className="p-4 font-medium text-muted-foreground">المبلغ</th>
                <th className="p-4 font-medium text-muted-foreground">التفاصيل / الملاحظة</th>
                <th className="p-4 font-medium text-muted-foreground">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {displayList.map(trx => {
                const isReceipt = trx.type === 'RECEIPT';
                return (
                  <tr key={trx.id} className="border-b border-border/10 hover:bg-secondary/10">
                    <td className="p-4">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                        isReceipt ? "bg-green-500/10 text-green-500" : 
                        trx.type === 'EXPENSE' ? "bg-red-500/10 text-red-500" : 
                        "bg-blue-500/10 text-blue-500"
                      )}>
                        {trx.type === 'RECEIPT' ? 'استلام نقدية' : 
                         trx.type === 'EXPENSE' ? 'مصروف' : 
                         trx.type === 'CUSTODY' ? 'عهدة سيارة' : 
                         trx.type === 'OVERNIGHT' ? 'مبيت سيارة' : trx.type}
                      </span>
                    </td>
                    <td className={clsx("p-4 font-bold whitespace-nowrap", isReceipt ? "text-green-500" : "text-foreground")} dir="ltr">
                      {isReceipt ? '+' : '-'}${trx.amount.toFixed(2)}
                    </td>
                    <td className="p-4 max-w-[250px] truncate" title={trx.description}>{trx.description || '-'}</td>
                    <td className="p-4 text-sm text-muted-foreground whitespace-nowrap" dir="rtl">{formatArabicDate(trx.date, true)}</td>
                  </tr>
                )
              })}
              {displayList.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">مفيش حركات مسجلة في القسم ده للفترة المحددة.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border/50">
            <h2 className="text-2xl font-bold mb-6">تسجيل نقدية / مصروف</h2>
            
            <div className="flex gap-2 p-1 bg-secondary/50 rounded-lg mb-6">
              <button 
                onClick={() => setTrxType('RECEIPT')}
                className={clsx("flex-1 py-2 rounded-md font-medium transition-colors text-sm", trxType === 'RECEIPT' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
              >استلام نقدية</button>
              <button 
                onClick={() => setTrxType('EXPENSE')}
                className={clsx("flex-1 py-2 rounded-md font-medium transition-colors text-sm", trxType === 'EXPENSE' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
              >صرف نقدية</button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">المبلغ</label>
                <input required type="number" step="0.01" name="amount" className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" placeholder="مثال: 500" />
              </div>
              
              {trxType === 'RECEIPT' && (
                <div>
                  <label className="block text-sm font-medium mb-1">استلمتها من مين؟</label>
                  <input required name="fromWhom" className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" placeholder="الإدارة، فلان، إلخ..." />
                </div>
              )}

              {trxType === 'EXPENSE' && (
                <div>
                  <label className="block text-sm font-medium mb-1">بند المصروف</label>
                  <select required value={catSelection} onChange={(e) => setCatSelection(e.target.value)} className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none">
                    <option value="" disabled>اختر البند...</option>
                    {expenseCategories.filter(c => c.isActive).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    <option value="OTHER">أخرى (غير محدد)</option>
                  </select>
                </div>
              )}

              {trxType === 'EXPENSE' && catSelection === 'OTHER' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-sm font-medium mt-2 mb-1">صرفتهم في إيه بالظبط؟</label>
                  <input required value={otherCatName} onChange={e => setOtherCatName(e.target.value)} name="otherCat" className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none" placeholder="مثال: تصليح كاوتش" />
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">ملاحظة إضافية (اختياري)</label>
                <textarea name="sourceOrNote" className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none resize-none h-20" placeholder="أي تفاصيل تانية..." />
              </div>

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 bg-secondary text-foreground py-2 rounded-lg font-medium">إلغاء</button>
                <button type="submit" className={clsx("flex-1 text-white py-2 rounded-lg font-medium", trxType === 'RECEIPT' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700")}>حفظ الحركة</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function ClosuresView() {
  const { closures, farms, users } = useStore();
  const [selectedClosure, setSelectedClosure] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">التقفيلات</h1>
          <p className="text-muted-foreground">أرشيف تقفيلات المزارع المحفوظة.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
        {closures.map(c => {
          const farm = farms.find(f => f.id === c.farmId);
          return (
            <div key={c.id} className="glass p-6 rounded-2xl border border-border/50 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedClosure(c)}>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Archive size={24} />
                </div>
                <div className="text-left text-xs text-muted-foreground" dir="ltr">
                  {formatArabicDate(c.closedAt, true)}
                </div>
              </div>
              <h3 className="font-bold text-lg mb-1">{farm?.name || 'مزرعة محذوفة'}</h3>
              <p className="text-sm text-muted-foreground mb-4">عن يوم: {formatArabicDate(c.date)}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                 <div>
                   <p className="text-xs text-muted-foreground mb-1">إجمالي المسلم</p>
                   <p className="font-bold text-green-500">${c.totalReceived.toFixed(2)}</p>
                 </div>
                 <div>
                   <p className="text-xs text-muted-foreground mb-1">إجمالي المصروف</p>
                   <p className="font-bold text-red-500">${c.totalSpent.toFixed(2)}</p>
                 </div>
              </div>
            </div>
          );
        })}
        {closures.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground glass rounded-3xl border border-border/50">مفيش تقفيلات محفوظة.</div>
        )}
      </div>

      {selectedClosure && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:backdrop-blur-none print:relative print:inset-auto print:flex-col">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-8 shadow-2xl border border-border/50 print:border-none print:shadow-none print:max-w-full print:max-h-full print:overflow-visible print:bg-white print:text-black">
             <div className="flex justify-between items-center mb-8 print:hidden">
               <h2 className="text-2xl font-bold">تقرير التقفيل</h2>
               <div className="flex gap-2">
                 <button onClick={() => window.print()} className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90">
                   <Activity size={18} /> حفظ PDF / طباعة
                 </button>
                 <button onClick={() => setSelectedClosure(null)} className="text-muted-foreground hover:text-foreground p-2">✕</button>
               </div>
             </div>

             {/* Printable Area */}
             <div className="space-y-6" dir="rtl">
                <div className="text-center border-b border-border/50 pb-6 mb-6">
                   <h1 className="text-3xl font-bold mb-2">تقرير تقفيل مزرعة</h1>
                   <h2 className="text-xl mb-1 text-primary print:text-black font-bold">{farms.find(f => f.id === selectedClosure.farmId)?.name}</h2>
                   <p className="text-muted-foreground">التاريخ: {formatArabicDate(selectedClosure.date)}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                   <div className="p-4 rounded-xl border border-border/50 bg-secondary/20 text-center print:border-gray-300 print:bg-transparent">
                     <p className="text-sm text-muted-foreground mb-1">إجمالي المسلم</p>
                     <p className="text-2xl font-bold text-green-600 print:text-black">${selectedClosure.totalReceived.toFixed(2)}</p>
                   </div>
                   <div className="p-4 rounded-xl border border-border/50 bg-secondary/20 text-center print:border-gray-300 print:bg-transparent">
                     <p className="text-sm text-muted-foreground mb-1">إجمالي المصروف</p>
                     <p className="text-2xl font-bold text-red-600 print:text-black">${selectedClosure.totalSpent.toFixed(2)}</p>
                   </div>
                   <div className="p-4 rounded-xl border border-border/50 bg-secondary/20 text-center print:border-gray-300 print:bg-transparent">
                     <p className="text-sm text-muted-foreground mb-1">الرصيد المتبقي</p>
                     <p className="text-2xl font-bold text-blue-600 print:text-black">${(selectedClosure.totalReceived - selectedClosure.totalSpent).toFixed(2)}</p>
                   </div>
                   <div className="p-4 rounded-xl border border-border/50 bg-secondary/20 text-center print:border-gray-300 print:bg-transparent">
                     <p className="text-sm text-muted-foreground mb-1">إجمالي العربيات</p>
                     <p className="text-2xl font-bold">{selectedClosure.trucksCount}</p>
                   </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border/50 flex justify-between items-center text-sm text-muted-foreground print:text-black">
                   <p>تم التقفيل بواسطة: {users.find(u => u.id === selectedClosure.closedByUserId)?.fullName || 'غير معروف'}</p>
                   <p dir="ltr">تاريخ ووقت التقفيل: {formatArabicDate(selectedClosure.closedAt, true)}</p>
                </div>
             </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
