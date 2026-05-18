import { Handshake, User, LayoutDashboard, Search, Bell, LogIn, LogOut, HelpCircle, CreditCard, MessageSquare, Server, Wallet as WalletIcon, Globe } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTranslation } from 'react-i18next';

export function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user, profile, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const notificationsRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(notificationsRef, where('read', '==', false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    const toastId = toast.loading(i18n.language === 'ar' ? "جاري فتح نافذة تسجيل الدخول..." : "Opening login window...");
    try {
      await signInWithGoogle();
      toast.success(t('nav.login_success') || (i18n.language === 'ar' ? "تم تسجيل الدخول بنجاح" : "Login successful"), { id: toastId });
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.code === 'auth/popup-blocked') {
        toast.error(i18n.language === 'ar' ? "تم حظر النافذة المنبثقة. يرجى السماح بالمنبثقات." : "Popup blocked. Please allow popups.", { id: toastId });
      } else {
        toast.error(t('nav.login_error') || (i18n.language === 'ar' ? "فشل تسجيل الدخول" : "Login failed"), { id: toastId });
      }
    }
  };

  const toggleLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setShowLangDropdown(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/10 group-hover:scale-105 transition-transform duration-300">
            <Handshake size={24} className="group-hover:rotate-12 transition-transform" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-extrabold text-lg tracking-tight leading-none text-slate-900">{t('nav.home_title') || 'مقايضة'}</span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">{i18n.language === 'ar' ? 'النظام المهني الخاص' : 'Private Pro System'}</span>
          </div>
        </Link>

        {/* Primary Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          <NavLink to="/" icon={<LayoutDashboard size={18} />} label={t('nav.home')} active={location.pathname === '/'} />
          <NavLink to="/explore" icon={<Search size={18} />} label={t('nav.market')} active={location.pathname === '/explore'} />
          <NavLink to="/community" icon={<MessageSquare size={18} />} label={t('nav.community')} active={location.pathname === '/community'} />
          <NavLink to="/subscription" icon={<CreditCard size={18} />} label={t('nav.membership')} active={location.pathname === '/subscription'} />
          <NavLink to="/wallet" icon={<WalletIcon size={18} />} label={t('nav.wallet')} active={location.pathname === '/wallet'} />
          
          <div className="w-px h-6 bg-slate-100 mx-2" />

          <NavLink 
            to="/notifications" 
            icon={
              <div className="relative">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white ring-2 ring-red-500/20">
                    {unreadCount}
                  </span>
                )}
              </div>
            } 
            label={t('nav.notifications')} 
            active={location.pathname === '/notifications'} 
          />
        </div>

        {/* Secondary Navigation & Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language Switcher */}
          <div className="relative">
            <button 
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="p-2.5 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 flex items-center gap-2 transition-all"
            >
              <Globe size={18} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{i18n.language}</span>
            </button>
            <AnimatePresence>
              {showLangDropdown && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className={cn(
                    "absolute top-full mt-3 w-32 bg-white rounded-2xl border border-slate-100 shadow-2xl p-2 z-[60]",
                    i18n.language === 'ar' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'
                  )}
                >
                  <button onClick={() => toggleLanguage('ar')} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50">
                    <span>العربية</span>
                    {i18n.language === 'ar' && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                  </button>
                  <button onClick={() => toggleLanguage('en')} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50">
                    <span>English</span>
                    {i18n.language === 'en' && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden md:flex items-center gap-3">
             <Link to="/wallet" className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-900 rounded-2xl border border-slate-100 font-black text-xs hover:bg-slate-100 transition-colors group">
                <WalletIcon size={14} className="text-blue-500 group-hover:-rotate-12 transition-transform" />
                <span>{profile?.balance || 0}</span>
                <span className="text-[9px] text-slate-400 font-bold">PT</span>
             </Link>
          </div>

          {user ? (
            <div className="relative flex items-center gap-2">
              <Link to="/profile" className="flex items-center gap-3 p-1.5 pr-4 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/20 transition-all group">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black hidden sm:inline leading-none text-slate-900 group-hover:text-blue-600 transition-colors">{user.displayName}</span>
                  <span className="text-[10px] text-slate-400 font-bold hidden sm:inline tracking-tighter mt-1 uppercase">
                    {profile?.subscriptionPlan === 'pro' ? 'Pro Member' : 'Basic Member'}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-[1rem] bg-slate-100 overflow-hidden shadow-inner border border-slate-50">
                  {profile?.photoURL || user.photoURL ? (
                    <img src={profile?.photoURL || user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <User size={20} />
                    </div>
                  )}
                </div>
              </Link>
              
              {/* Dropdown Toggle */}
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  showDropdown ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <div className="space-y-1 w-4 h-4 flex flex-col justify-center items-center">
                   <div className="w-1 h-1 bg-current rounded-full" />
                   <div className="w-1 h-1 bg-current rounded-full" />
                   <div className="w-1 h-1 bg-current rounded-full" />
                </div>
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className={cn(
                      "absolute top-full mt-3 w-56 bg-white rounded-3xl border border-slate-100 shadow-2xl p-3 z-50",
                      i18n.language === 'ar' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'
                    )}
                  >
                    <div className="space-y-1">
                      <DropdownLink to="/wallet" icon={<WalletIcon size={16} />} label={t('nav.wallet')} onClick={() => setShowDropdown(false)} />
                      <DropdownLink to="/subscription" icon={<CreditCard size={16} />} label={t('nav.membership')} onClick={() => setShowDropdown(false)} />
                      <DropdownLink to="/server-status" icon={<Server size={16} />} label={t('nav.services')} onClick={() => setShowDropdown(false)} />
                      <DropdownLink to="/support" icon={<HelpCircle size={16} />} label={t('nav.support')} onClick={() => setShowDropdown(false)} />
                      <div className="h-px bg-slate-50 my-2 mx-2" />
                      <button 
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black text-red-500 hover:bg-red-50 transition-all",
                          i18n.language === 'ar' ? "text-right" : "text-left"
                        )}
                      >
                        <LogOut size={16} />
                        {t('nav.logout')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95"
            >
              <LogIn size={18} />
              <span className="hidden sm:inline">{t('nav.login')}</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function DropdownLink({ to, icon, label, onClick }: { to: string; icon: any; label: string; onClick: () => void }) {
  const { i18n } = useTranslation();
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all",
        i18n.language === 'ar' ? "text-right" : "text-left"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function NavLink({ icon, label, to, active }: { icon: any; label: string; to: string; active?: boolean }) {
  return (
    <Link to={to} className={cn(
      "flex flex-col lg:flex-row items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300 relative group",
      active ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900"
    )}>
      <div className={cn(
        "p-1.5 rounded-xl transition-all duration-300",
        active ? "bg-blue-50 text-blue-600 scale-110 shadow-sm" : "group-hover:bg-slate-100 group-hover:scale-105"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[10px] lg:text-xs font-black uppercase tracking-widest",
        active ? "opacity-100" : "opacity-60 group-hover:opacity-100"
      )}>{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-active"
          className="absolute -bottom-1 left-4 right-4 h-1 bg-blue-600 rounded-full"
        />
      )}
    </Link>
  );
}

