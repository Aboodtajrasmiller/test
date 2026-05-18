import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove, serverTimestamp, limit } from 'firebase/firestore';
import { MessageSquare, Heart, Send, User, Clock, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { TranslatableContent } from '../components/TranslatableContent';

interface Post {
  id: string;
  userId: string;
  userName: string;
  username?: string;
  userPhoto?: string;
  content: string;
  likes: string[];
  createdAt: any;
}

export function Community() {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  const CATEGORIES = ["all", "development", "design", "marketing", "writing", "business", "education", "other"];

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(fetchedPosts);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePost = async () => {
    if (!user || !profile) {
      toast.error("يرجى تسجيل الدخول للنشر");
      return;
    }
    if (!newPost.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        userName: user.displayName,
        username: profile.username || "",
        userPhoto: profile.photoURL || user.photoURL,
        content: newPost,
        likes: [],
        createdAt: serverTimestamp()
      });
      setNewPost("");
      toast.success("تم النشر بنجاح!", {
        icon: '🚀',
        style: {
          borderRadius: '1.5rem',
          background: '#0f172a',
          color: '#fff',
        }
      });
    } catch {
      toast.error("فشل النشر");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (post: Post) => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول للتفاعل");
      return;
    }

    const postRef = doc(db, 'posts', post.id);
    const hasLiked = post.likes.includes(user.uid);

    try {
      await updateDoc(postRef, {
        likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch {
      toast.error("فشل التفاعل");
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10"
          >
            <Star size={14} className="text-blue-400" />
            Community Square
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">{t('community.title')}</h1>
          <p className="text-slate-500 text-sm max-w-lg mx-auto font-medium leading-relaxed">{t('community.subtitle')}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Feed */}
          <div className="lg:col-span-8 space-y-8">
            {/* Create Post Area */}
            <section className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm relative group overflow-hidden">
              <div className="flex gap-4 items-start relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden shadow-inner border border-slate-50">
                   {profile?.photoURL || user?.photoURL ? (
                     <img src={profile?.photoURL || user?.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                     <User className="text-slate-300" size={24} />
                   )}
                </div>
                <div className="flex-1 space-y-6">
                  <div className="relative">
                    <textarea 
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder={t('community.placeholder')}
                      className="w-full bg-slate-50 border-none rounded-[1.5rem] p-6 text-sm focus:ring-2 focus:ring-blue-500 min-h-[160px] resize-none font-medium text-slate-700 placeholder:text-slate-400/80 transition-all shadow-inner"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center sm:px-2">
                    <div className="flex items-center gap-4">
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">Professional Tone</p>
                    </div>
                    <button 
                      onClick={handlePost}
                      disabled={isSubmitting || !newPost.trim()}
                      className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-black transition-all disabled:opacity-30 shadow-xl shadow-slate-900/10 active:scale-95"
                    >
                      {isSubmitting ? t('community.posting') : t('community.post')}
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Subtle background decoration */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </section>

            {/* Posts Feed */}
            <div className="space-y-6">
              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-[2.5rem] border border-slate-50 p-8 h-64 animate-pulse" />
                  ))}
                </div>
              ) : posts.length > 0 ? (
                posts.map((post, index) => (
                  <motion.article 
                    key={post.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/20 transition-all group"
                  >
                    <div className="p-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[1.2rem] bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 shadow-inner">
                            {post.userPhoto ? (
                              <img src={post.userPhoto} alt={post.userName} className="w-full h-full object-cover" />
                            ) : (
                              <User size={24} className="text-slate-200" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                               <h3 className="text-sm font-black text-slate-900">{post.userName}</h3>
                               {post.username && (
                                 <span className="text-[10px] text-blue-600 font-black tracking-tight bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">@{post.username}</span>
                               )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                <Clock size={10} />
                                {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString('ar-SA') : 'الآن'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                           <div className="w-1 h-1 bg-current rounded-full mb-1" />
                           <div className="w-1 h-1 bg-current rounded-full mb-1" />
                           <div className="w-1 h-1 bg-current rounded-full" />
                        </button>
                      </div>

                      <div className="text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                        <TranslatableContent content={post.content} autoTranslate />
                      </div>

                      <div className="flex items-center gap-6 pt-6 border-t border-slate-50">
                        <button 
                          onClick={() => handleLike(post)}
                          className={cn(
                            "flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-black transition-all",
                            post.likes.includes(user?.uid || "") 
                              ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200" 
                              : "bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                          )}
                        >
                          <Heart size={18} className={cn(post.likes.includes(user?.uid || "") && "fill-rose-600")} />
                          <span>{post.likes.length}</span>
                        </button>
                        <button className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-slate-500 text-xs font-black hover:bg-slate-50 transition-all">
                           <MessageSquare size={18} />
                           <span>{t('community.discuss')}</span>
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))
              ) : (
                <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-16 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="text-slate-200" size={32} />
                  </div>
                  <h3 className="text-slate-900 font-black text-lg mb-2">{t('community.quiet')}</h3>
                  <p className="text-slate-400 text-xs font-bold max-w-xs mx-auto">{t('community.quietDesc')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-28">
             <section className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1">{t('community.filter')}</h3>
                <div className="space-y-2">
                   {CATEGORIES.map(category => (
                     <button 
                       key={category}
                       onClick={() => setSelectedCategory(category)}
                       className={cn(
                        "w-full text-right px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group",
                        selectedCategory === category 
                          ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                       )}
                     >
                        <span>{t(`community.categories.${category}`)}</span>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all",
                          selectedCategory === category ? "bg-blue-400 scale-125" : "bg-slate-200 group-hover:bg-slate-400"
                        )} />
                     </button>
                   ))}
                </div>
             </section>

             <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-2xl shadow-blue-600/20 relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                   <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                      <Star size={24} />
                   </div>
                   <h3 className="text-xl font-bold leading-tight">تطوير مستقبلك يبدأ بمقايضة حقيقية.</h3>
                   <p className="text-xs text-white/70 font-medium leading-relaxed italic">"المجتمع هو القوة المحركة للابتكار. شارك ما تملك لتحصل على ما تطمح إليه."</p>
                </div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
             </section>
          </div>

        </div>
      </div>
    </Layout>
  );
}

