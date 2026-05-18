import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Wallet, User, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { to: '/', icon: Home, label: t('nav.home') },
    { to: '/explore', icon: Search, label: t('nav.market') },
    { to: '/wallet', icon: Wallet, label: t('nav.wallet') },
    { to: '/subscription', icon: CreditCard, label: t('nav.membership') },
    { to: '/profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-2 z-[100] shadow-2xl flex justify-between items-center px-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.to;
        
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all relative",
              isActive ? "text-blue-400 scale-110" : "text-slate-400"
            )}
          >
            <Icon size={20} strokeWidth={isActive ? 3 : 2} />
            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
            {isActive && (
              <div className="absolute -top-1 w-1 h-1 bg-blue-400 rounded-full" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
