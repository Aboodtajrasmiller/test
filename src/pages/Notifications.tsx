import { motion } from 'motion/react';
import { Bell, Check, Trash2, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { TranslatableContent } from '../components/TranslatableContent';

export function Notifications() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(fetched);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/notifications`);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'notifications', id);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'notifications', id);
      await deleteDoc(docRef);
      toast.success("تم المسح من السجل", {
        icon: '🗑️',
        style: { borderRadius: '1rem', background: '#0f172a', color: '#fff' }
      });
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-100">
          <Bell size={48} />
        </div>
        <h2 className="text-2xl font-black text-slate-400">{t('notifications.loginRequired')}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
        <div className="text-center sm:text-right">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('notifications.title')}</h1>
          <p className="text-slate-500 text-sm font-bold mt-1">{t('notifications.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex flex-col items-center px-6 py-2 bg-blue-50 rounded-2xl border border-blue-100">
              <span className="text-xs font-black text-blue-600 leading-none">{notifications.filter(n => !n.read).length}</span>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter mt-1">{t('notifications.unread')}</span>
           </div>
        </div>
      </header>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
             {[1, 2, 3, 4].map(i => (
               <div key={i} className="bg-white p-8 rounded-[2rem] h-28 animate-pulse border border-slate-50" />
             ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200">
              <Bell size={32} />
            </div>
            <p className="text-slate-400 font-bold">{t('notifications.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n, idx) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "p-6 rounded-[2.5rem] border transition-all flex flex-col sm:flex-row items-start sm:items-center gap-6 group relative overflow-hidden",
                  n.read ? 'bg-white border-slate-100 opacity-80' : 'bg-white border-blue-100 shadow-xl shadow-blue-500/5 ring-1 ring-blue-50'
                )}
              >
                {!n.read && (
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-600" />
                )}

                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                  n.read ? 'bg-slate-50 text-slate-300' : 'bg-blue-600 text-white shadow-blue-200'
                )}>
                  <Bell size={24} />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <div className={cn(
                      "text-sm font-black leading-tight",
                      n.read ? 'text-slate-400' : 'text-slate-900'
                    )}>
                       <TranslatableContent content={n.message} autoTranslate />
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-now8 text-[10px] text-slate-400 font-bold uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded-lg">
                      <Clock size={12} />
                      {n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US') : 'الآن'}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {t(`notifications.types.${n.type || 'system'}`)}
                  </p>
                  
                  <div className="flex items-center gap-3 pt-3">
                    {!n.read && (
                      <button 
                        onClick={() => markAsRead(n.id)}
                        className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                      >
                        <Check size={14} />
                        {t('notifications.markAsRead')}
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(n.id)}
                      className="text-[10px] font-black text-slate-400 hover:text-red-500 px-4 py-2 rounded-xl hover:bg-red-50 transition-all flex items-center gap-2"
                    >
                      <Trash2 size={12} />
                      {t('notifications.delete')}
                    </button>
                  </div>
                </div>

                {/* Hover Glow */}
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

