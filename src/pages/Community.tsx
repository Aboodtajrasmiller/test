import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { MessageSquare, Heart, Send, Sparkles, User, Clock, Trash2 } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { cn } from '../lib/utils';

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("الكل");

  const CATEGORIES = ["الكل", "تطوير", "تصميم", "تسويق", "كتابة", "أعمال", "تعليم", "أخرى"];

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(fetchedPosts);
    });

    return () => unsubscribe();
  }, []);

  const filteredPosts = posts.filter(post => {
    if (selectedCategory === "الكل") return true;
    return post.content.includes(selectedCategory);
  });

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
      toast.success("تم النشر بنجاح!");
    } catch (error) {
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
    } catch (error) {
      toast.error("فشل التفاعل");
    }
  };

  return (
    <Layout>
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest"
          >
            <Sparkles size={14} />
            ساحة المجتمع
          </motion.div>
          <h1 className="text-3xl font-black text-slate-900">شارك عالمك</h1>
          <p className="text-slate-500">مساحة لتبادل الخبرات، النجاحات، والأفكار مع زملائك المقايضين.</p>
        </header>

        {/* Create Post Area */}
        <section className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden">
               {profile?.photoURL || user?.photoURL ? (
                 <img src={profile?.photoURL || user?.photoURL} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <User className="text-blue-200" size={24} />
               )}
            </div>
            <div className="flex-1 space-y-4">
              <textarea 
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="بماذا تفكر اليوم؟ شارك لمحة من مهاراتك أو قصة نجاح..."
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none"
              />
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-slate-400">كن مهنياً، كن ملهماً.</p>
                <button 
                  onClick={handlePost}
                  disabled={isSubmitting || !newPost.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "جاري النشر..." : "نشر"}
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">تصفية حسب الاهتمام:</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(category => (
              <button 
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
                  selectedCategory === category 
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20" 
                    : "bg-white text-slate-500 border-slate-100 hover:border-blue-200"
                )}
              >
                {category === "الكل" ? "جميع المنشورات" : category}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          <AnimatePresence>
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post, index) => (
                <motion.article 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                          {post.userPhoto ? (
                            <img src={post.userPhoto} alt={post.userName} className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} className="text-slate-300" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <h3 className="text-sm font-bold text-slate-900">{post.userName}</h3>
                             {post.username && (
                               <span className="text-[10px] text-blue-500 font-bold tracking-tight">@{post.username}</span>
                             )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock size={10} />
                            {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString('ar-SA') : 'الآن'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>

                    <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                      <button 
                        onClick={() => handleLike(post)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                          post.likes.includes(user?.uid || "") 
                            ? "bg-red-50 text-red-600" 
                            : "bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        )}
                      >
                        <Heart size={16} className={cn(post.likes.includes(user?.uid || "") && "fill-red-600")} />
                        {post.likes.length}
                      </button>
                      <div className="flex items-center gap-2 px-4 py-2 text-slate-400 text-xs font-bold">
                         <MessageSquare size={16} />
                         0
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-12 text-center"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="text-slate-300" size={32} />
                </div>
                <h3 className="text-slate-900 font-bold mb-2">لا توجد منشورات</h3>
                <p className="text-slate-500 text-sm">لم يتم العثور على منشورات تذكر "{selectedCategory}" بعد. كن أنت الأول وانشر اهتمامك!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
