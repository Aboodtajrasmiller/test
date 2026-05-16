import { motion } from 'motion/react';
import { Bell, Check, Trash2, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { toast } from 'react-hot-toast';

export function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));

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
      toast.success("تم حذف التنبيه");
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Bell size={64} className="text-slate-200 mb-6" />
        <h2 className="text-2xl font-bold text-slate-400">يرجى تسجيل الدخول لعرض التنبيهات</h2>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">التنبيهات</h1>
          <p className="text-slate-500">ابقَ على اطلاع بمستجدات مقايضاتك.</p>
        </div>
        <div className="text-sm font-medium text-blue-600 bg-blue-50 px-4 py-1 rounded-full">
          {notifications.filter(n => !n.read).length} غير مقروءة
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl h-24 animate-pulse border border-slate-50"></div>
          ))
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
            <Bell size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400">لا توجد تنبيهات حالياً.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-6 rounded-2xl border transition-all flex items-start gap-4 ${
                n.read ? 'bg-white border-slate-100 opacity-70' : 'bg-blue-50/30 border-blue-100 shadow-sm'
              }`}
            >
              <div className={`p-3 rounded-xl ${n.read ? 'bg-slate-50 text-slate-400' : 'bg-blue-600 text-white'}`}>
                <Bell size={20} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-bold ${n.read ? 'text-slate-600' : 'text-slate-900'}`}>{n.message}</h3>
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(n.createdAt?.seconds * 1000).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-4">{n.type === 'trade_request' ? 'طلب مقايضة جديد' : 'تحديث على مقايضة'}</p>
                
                <div className="flex gap-2">
                  {!n.read && (
                    <button 
                      onClick={() => markAsRead(n.id)}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Check size={14} />
                      تمييز كمقروء
                    </button>
                  )}
                  <button 
                    onClick={() => deleteNotification(n.id)}
                    className="text-xs font-bold text-red-400 hover:text-red-600 flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    حذف
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
