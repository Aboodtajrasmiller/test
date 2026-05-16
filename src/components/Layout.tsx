import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-height-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="py-12 border-t border-slate-200 mt-auto bg-white/50">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} المقايضة المهنية العكسية. جميع الحقوق محفوظة.</p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest opacity-50">Empowered by AI Collective Economy</p>
        </div>
      </footer>
    </div>
  );
}
