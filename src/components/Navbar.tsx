import { motion } from 'motion/react';
import { Handshake, User, LayoutDashboard, Search, Bell, LogIn, HelpCircle, CreditCard, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function Navbar() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const isPro = profile?.subscriptionPlan === 'pro';

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
    try {
      await signInWithGoogle();
      toast.success("تم تسجيل الدخول بنجاح");
    } catch (error) {
      toast.error("فشل تسجيل الدخول");
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Handshake size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">مقايضة</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-4">
          <NavLink to="/" icon={<LayoutDashboard size={18} />} label="الرئيسية" active={location.pathname === '/'} />
          <NavLink to="/explore" icon={<Search size={18} />} label="استكشاف" active={location.pathname === '/explore'} />
          <NavLink to="/community" icon={<MessageSquare size={18} />} label="المجتمع" active={location.pathname === '/community'} />
          <NavLink 
            to="/notifications" 
            icon={
              <div className="relative">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </div>
            } 
            label="إشعارات" 
            active={location.pathname === '/notifications'} 
          />
          <NavLink to="/support" icon={<HelpCircle size={18} />} label="دعم" active={location.pathname === '/support'} />
          <NavLink to="/subscription" icon={<CreditCard size={18} />} label="اشتراك" active={location.pathname === '/subscription'} />
        </div>

        {user ? (
          <Link to="/profile" className="flex items-center gap-2 p-1 pr-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
            <div className="flex flex-col items-end">
              <span className="text-sm font-black hidden sm:inline leading-none">{user.displayName}</span>
              {profile?.username ? (
                <span className="text-[10px] text-blue-500 font-bold hidden sm:inline tracking-tight">@{profile.username}</span>
              ) : (
                isPro && (
                  <span className="text-[8px] font-black text-amber-600 bg-amber-100 px-1 rounded uppercase tracking-tighter">PRO</span>
                )
              )}
            </div>
            {profile?.photoURL || user.photoURL ? (
              <img src={profile?.photoURL || user.photoURL} alt={user.displayName || ""} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <User size={18} />
              </div>
            )}
          </Link>
        ) : (
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
          >
            <LogIn size={18} />
            <span>تسجيل الدخول</span>
          </button>
        )}
      </div>
    </nav>
  );
}

function NavLink({ icon, label, to, active }: { icon: any; label: string; to: string; active?: boolean }) {
  return (
    <Link to={to} className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group",
      active ? "text-blue-600 bg-blue-50" : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
    )}>
      {icon}
      <span className="text-sm font-medium hidden md:block">{label}</span>
    </Link>
  );
}
