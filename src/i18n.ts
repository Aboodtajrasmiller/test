import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  ar: {
    translation: {
      "nav": {
        "home": "الرئيسية",
        "market": "الماركت",
        "community": "المجتمع",
        "membership": "الباقات والاشتراكات",
        "notifications": "إشعارات",
        "wallet": "رصيد النقاط (شحن)",
        "services": "حالة الخدمات",
        "support": "مركز الدعم",
        "login": "تسجيل الدخول",
        "logout": "خروج النظام",
        "profile": "الملف الشخصي",
        "home_title": "مقايضة",
        "login_success": "تم تسجيل الدخول بنجاح",
        "login_error": "فشل تسجيل الدخول"
      },
      "common": {
        "loading": "جاري التحميل...",
        "error": "حدث خطأ ما",
        "save": "حفظ",
        "cancel": "إلغاء",
        "delete": "حذف",
        "edit": "تعديل",
        "search": "بحث...",
        "all": "الكل"
      },
      "marketplace": {
        "title": "استكشاف المقايضات",
        "subtitle": "ابحث عن المهارات التي تحتاجها واعرض ما تتقنه.",
        "searchPlaceholder": "ابحث عن مهارة...",
        "filter": "تصفية",
        "categories": "المصنف المهني",
        "membership": "نوع العضوية",
        "rating": "التقييم الأدنى",
        "location": "تصفية حسب الموقع الجغرافي (الدولة)",
        "reliable": "موثوق",
        "requestTrade": "طلب مقايضة",
        "skillsOffered": "يعرض المقايض:",
        "skillsWanted": "يبحث عن:"
      },
      "profile": {
        "title": "ملفي المهني",
        "skillsOffered": "مهاراتي التي أعرضها",
        "skillsWanted": "مهارات أبحث عنها",
        "addSkill": "إضافة مهارة جديدة",
        "testimonials": "التوصيات والتقييمات",
        "history": "سجل المقايضات"
      },
      "footer": {
        "description": "أكبر مجتمع مهني للمقايضة العكسية في العالم العربي. نهدف لتمكين المحترفين من تبادل القيمة الحقيقية بعيداً عن قيود العملات التقليدية.",
        "platform": "المنصة",
        "support": "الدعم والأمان"
      },
      "home": {
        "heroTitle": "المقايضة للمحترفين",
        "heroSubtitle": "تبادل مهاراتك مباشرة مع صفوة المحترفين. لا عمولات، لا وسطاء بالدولار، فقط القيمة مقابل القيمة.",
        "startExploring": "ابدأ الاستكشاف",
        "community": "المجتمع",
        "stats": {
          "active": "محترف نشط",
          "success": "مقايضة ناجحة",
          "saving": "توفير مالي",
          "accuracy": "دقة التطابق"
        }
      },
      "community": {
        "title": "نبض المجتمع المهني",
        "subtitle": "كن جزءاً من الحوار. شارك خبراتك، اطلب المساعدة، واكتشف فرص المقايضة في بيئة احترافية ملهمة.",
        "placeholder": "بماذا تفكر اليوم؟ شارك لمحة من مهاراتك أو قصة نجاح...",
        "post": "نشر الآن",
        "posting": "جاري البث...",
        "discuss": "ناقش",
        "filter": "تصفية الساحة",
        "allTopics": "جميع المواضيع",
        "quiet": "الساحة هادئة جداً...",
        "quietDesc": "كن أنت من يكسر الصمت ويشارك أول منشور في المجتمع اليوم!",
        "categories": {
            "all": "الكل",
            "development": "تطوير",
            "design": "تصميم",
            "marketing": "تسويق",
            "writing": "كتابة",
            "business": "أعمال",
            "education": "تعليم",
            "other": "أخرى"
        }
      },
      "subscription": {
        "title": "استثمر في نمو مهاراتك.",
        "subtitle": "جميع أدوات المقايضة الاحترافية بين يديك. اختر الباقة التي تدفع بمسيرتك المهنية للأمام بأقل التكاليف.",
        "monthly": "دفع شهري",
        "yearly": "دفع سنوي",
        "save": "وفر 20%",
        "freePlan": "الخطة الأساسية",
        "proPlan": "عضوية المحترفين",
        "currentPlan": "الخطة الحالية",
        "activeNow": "نشط حالياً",
        "startPro": "ابدأ تجربتك للمحترفين",
        "freeDesc": "للمستكشفين الراغبين في بناء أولى علاقات المقايضة.",
        "proDesc": "للشغوفين الذين يسعون لبناء شبكة مهنية واسعة وسريعة النمو."
      },
      "notifications": {
        "title": "مركز التنبيهات والنشاط",
        "subtitle": "تابع آخر التحديثات على مهاراتك وطلبات المقايضة.",
        "unread": "غير مقروء",
        "empty": "لا توجد تنبيهات جديدة في الوقت الحالي.",
        "loginRequired": "يرجى تسجيل الدخول لعرض التنبيهات",
        "markAsRead": "تحديد كمقروء",
        "delete": "حذف نهائي",
        "deleted": "تم المسح من السجل",
        "types": {
            "trade_request": "📝 طلب مقايضة مهارة جديد",
            "trade_accepted": "✅ تم قبول طلب المقايضة الخاص بك",
            "trade_rejected": "❌ تم رفض طلب المقاية",
            "wallet_update": "💰 تحديث في رصيد المحفظة",
            "system": "📢 إشعار من النظام"
        }
      },
      "wallet": {
        "recharge": "شحن رصيد المحفظة",
        "transfer": "تحويل نقاط فوري",
        "withdraw": "طلب سحب رصيد",
        "recharge_desc": "قم بزيادة نقاطك لتسهيل عمليات المقايضة والحصول على خدمات احترافية أسرع.",
        "transfer_desc": "حول النقاط لأي مستخدم في الشبكة مجاناً وبكل أمان.",
        "withdraw_desc": "حول رصيد النقاط لديك إلى دفعات نقدية (هذه الميزة ستتوفر في التحديث القادم).",
        "select_amount": "تحديد المبلغ الإلكتروني",
        "custom_amount": "أدخل مبلغاً مخصصاً",
        "payment_method": "اختيار معالج الدفع",
        "complete": "إتمام العملية",
        "success": "تم شحن {{amount}} نقطة بنجاح!",
        "failure": "فشل تنفيذ العملية. يرجى المحاولة لاحقاً.",
        "balance": "الرصيد المتاح",
        "card_holder": "حامل البطاقة",
        "history": "سجل المعاملات الرقمية",
        "no_history": "لا توجد سجلات بعد",
        "insufficient_balance": "رصيد النقاط غير كافٍ. يرجى شحن المحفظة أولاً.",
        "subscription_payment": "دفع اشتراك باقة المحترفين",
        "upgrade_success": "مبروك! تم تفعيل خطة المحترفين بنجاح"
      }
    }
  },
  en: {
    translation: {
      "nav": {
        "home": "Home",
        "market": "Marketplace",
        "community": "Community",
        "membership": "Membership",
        "notifications": "Notifications",
        "wallet": "Wallet",
        "services": "Server Status",
        "support": "Support Center",
        "login": "Sign In",
        "logout": "Sign Out",
        "profile": "Profile",
        "home_title": "Barter",
        "login_success": "Login successful",
        "login_error": "Login failed"
      },
      "common": {
        "loading": "Loading...",
        "error": "Something went wrong",
        "save": "Save",
        "cancel": "Cancel",
        "delete": "Delete",
        "edit": "Edit",
        "search": "Search...",
        "all": "All"
      },
      "marketplace": {
        "title": "Explore Barters",
        "subtitle": "Find the skills you need and offer what you master.",
        "searchPlaceholder": "Search for a skill...",
        "filter": "Filter",
        "categories": "Professional Categories",
        "membership": "Membership Type",
        "rating": "Minimum Rating",
        "location": "Filter by Location (Country)",
        "reliable": "Reliable",
        "requestTrade": "Request Trade",
        "skillsOffered": "Offered Skills:",
        "skillsWanted": "Looking for:"
      },
      "profile": {
        "title": "My Professional Profile",
        "skillsOffered": "My Offered Skills",
        "skillsWanted": "Skills I'm Looking For",
        "addSkill": "Add New Skill",
        "testimonials": "Testimonials & Ratings",
        "history": "Trade History"
      },
      "footer": {
        "description": "The largest professional reverse-barter community in the world. We aim to empower professionals to exchange real value away from traditional currency constraints.",
        "platform": "Platform",
        "support": "Support & Security"
      },
      "home": {
        "heroTitle": "Barter for Professionals",
        "heroSubtitle": "Exchange your skills directly with elite professionals. No commissions, no middlemen, just value for value.",
        "startExploring": "Start Exploring",
        "community": "Community",
        "stats": {
          "active": "Active Professionals",
          "success": "Successful Exchanges",
          "saving": "Financial Savings",
          "accuracy": "Match Accuracy"
        }
      },
      "community": {
        "title": "Professional Pulse",
        "subtitle": "Be part of the conversation. Share your expertise, ask for help, and discover barter opportunities in an inspiring professional environment.",
        "placeholder": "What's on your mind today? Share a glimpse of your skills or a success story...",
        "post": "Post Now",
        "posting": "Broadcasting...",
        "discuss": "Discuss",
        "filter": "Filter Feed",
        "allTopics": "All Topics",
        "quiet": "The stage is very quiet...",
        "quietDesc": "Be the one to break the silence and share the first post in the community today!",
        "categories": {
            "all": "All",
            "development": "Development",
            "design": "Design",
            "marketing": "Marketing",
            "writing": "Writing",
            "business": "Business",
            "education": "Education",
            "other": "Other"
        }
      },
      "subscription": {
        "title": "Invest in your skill growth.",
        "subtitle": "All professional bartering tools in your hands. Choose the plan that moves your career forward at minimum cost.",
        "monthly": "Monthly Billing",
        "yearly": "Yearly Billing",
        "save": "Save 20%",
        "freePlan": "Basic Plan",
        "proPlan": "Pro Membership",
        "currentPlan": "Current Plan",
        "activeNow": "Currently Active",
        "startPro": "Start Your Pro Experience",
        "freeDesc": "For explorers looking to build their first bartering relationships.",
        "proDesc": "For the passionate seeking to build a wide and fast-growing professional network."
      },
      "notifications": {
        "title": "Alert Center & Activity",
        "subtitle": "Track the latest updates on your skills and trade requests.",
        "unread": "Unread",
        "empty": "No new notifications at the moment.",
        "loginRequired": "Please sign in to view alerts",
        "markAsRead": "Mark as Read",
        "delete": "Permanently Delete",
        "deleted": "Deleted from history",
        "types": {
            "trade_request": "📝 New Skill Trade Request",
            "trade_accepted": "✅ Your Trade Request was Accepted",
            "trade_rejected": "❌ Trade Request Declined",
            "wallet_update": "💰 Wallet Balance Update",
            "system": "📢 System Notification"
        }
      },
      "wallet": {
        "recharge": "Recharge Wallet",
        "transfer": "Instant Point Transfer",
        "withdraw": "Request Withdrawal",
        "recharge_desc": "Increase your points to facilitate barter operations and get professional services faster.",
        "transfer_desc": "Transfer points to any user in the network for free and safely.",
        "withdraw_desc": "Convert your point balance into cash payments (this feature will be available in the next update).",
        "select_amount": "Select Electronic Amount",
        "custom_amount": "Enter Custom Amount",
        "payment_method": "Choose Payment Processor",
        "complete": "Complete Operation",
        "success": "Charged {{amount}} points successfully!",
        "failure": "Operation failed. Please try again later.",
        "balance": "Available Balance",
        "card_holder": "Card Holder",
        "history": "Digital Transaction History",
        "no_history": "No records yet",
        "insufficient_balance": "Insufficient points balance. Please recharge your wallet first.",
        "subscription_payment": "Pro Plan Subscription Payment",
        "upgrade_success": "Congratulations! Pro plan activated successfully"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export default i18n;
