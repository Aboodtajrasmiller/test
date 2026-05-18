import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './Navbar';
import { MobileBottomNav } from './MobileBottomNav';
import { StockTicker } from './StockTicker';
import { Handshake, Globe, MessageSquare, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <div className="min-height-screen flex flex-col">
      <StockTicker />
      <Navbar />
      <MobileBottomNav />
      <main className="flex-1 container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={i18n.language}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="bg-slate-50 border-t border-slate-100 pt-20 pb-12 mt-32">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                  <Handshake size={20} />
                </div>
                <span className="font-black text-xl tracking-tight text-slate-900">{t('nav.home')}</span>
              </div>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                {t('footer.description')}
              </p>
              <div className="flex gap-4">
                <SocialLink icon={<Globe size={18} />} />
                <SocialLink icon={<MessageSquare size={18} />} />
                <SocialLink icon={<Users size={18} />} />
              </div>
            </div>

            <div>
              <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-[10px]">{t('footer.platform')}</h4>
              <ul className="space-y-4">
                <FooterLink to="/" label={t('nav.home')} />
                <FooterLink to="/explore" label={t('nav.market')} />
                <FooterLink to="/community" label={t('nav.community')} />
                <FooterLink to="/subscription" label={t('nav.membership')} />
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-[10px]">{t('footer.support')}</h4>
              <ul className="space-y-4">
                <FooterLink to="/support" label={t('nav.support')} />
                <FooterLink to="/server-status" label={t('nav.services')} />
                <FooterLink to="/support" label={t('footer.support')} />
                <FooterLink to="/wallet" label={t('nav.wallet')} />
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-[10px]">قانوني</h4>
              <ul className="space-y-4">
                <li><span className="text-sm font-bold text-slate-400 cursor-pointer hover:text-slate-900 transition-colors">سياسة الخصوصية</span></li>
                <li><span className="text-sm font-bold text-slate-400 cursor-pointer hover:text-slate-900 transition-colors">شروط الخدمة</span></li>
                <li><span className="text-sm font-bold text-slate-400 cursor-pointer hover:text-slate-900 transition-colors">إخلاء المسؤولية</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} REVERSE SKILL-BARTER COLLECTIVE.
            </p>
            <div className="flex items-center gap-6">
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Global Barter Ecosystem</span>
               <div className="w-px h-4 bg-slate-200" />
               <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Built for the future of work</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterLink({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <Link to={to} className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-2 group">
        <div className="w-1.5 h-1.5 bg-slate-200 rounded-full group-hover:bg-blue-600 transition-colors" />
        {label}
      </Link>
    </li>
  );
}

function SocialLink({ icon }: { icon: any }) {
  return (
    <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer">
      {icon}
    </div>
  );
}

