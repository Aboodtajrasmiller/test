import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function sendNotification(userId: string, type: 'trade_request' | 'trade_update', message: string, relatedTradeId?: string) {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    await addDoc(notificationsRef, {
      userId,
      type,
      message,
      read: false,
      createdAt: serverTimestamp(),
      relatedTradeId: relatedTradeId || null
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

export async function createTradeRequest(senderId: string, receiverId: string, senderName: string, skillOffered: string, skillWanted: string, plan: string = 'free') {
  try {
    if (plan === 'free') {
      const tradesRef = collection(db, 'trades');
      const q = query(tradesRef, where('senderId', '==', senderId));
      const snap = await getDocs(q);
      if (snap.size >= 3) {
        throw new Error("LIMIT_REACHED");
      }
    }

    const tradesRef = collection(db, 'trades');
    const tradeDoc = await addDoc(tradesRef, {
      senderId,
      receiverId,
      skillOffered,
      skillWanted,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Notify the receiver
    await sendNotification(
      receiverId, 
      'trade_request', 
      `لديك طلب مقايضة جديد من ${senderName}`,
      tradeDoc.id
    );

    return tradeDoc.id;
  } catch (error) {
    console.error("Failed to create trade request:", error);
    throw error;
  }
}

export async function updateTradeStatus(tradeId: string, userId: string, targetUserId: string, status: 'accepted' | 'declined' | 'completed') {
  try {
    const tradeRef = doc(db, 'trades', tradeId);
    await updateDoc(tradeRef, {
      status,
      updatedAt: serverTimestamp()
    });

    const statusMap: Record<string, string> = {
      accepted: "تم قبول",
      declined: "تم رفضم",
      completed: "تم إكمال"
    };

    await sendNotification(
      targetUserId,
      'trade_update',
      `${statusMap[status] || status} طلب المقايضة الخاص بك`,
      tradeId
    );
  } catch (error) {
    console.error("Failed to update trade status:", error);
    throw error;
  }
}

export async function addTradeReview(tradeId: string, userId: string, targetUserId: string, isSender: boolean, rating: number, comment: string, taggedSkill?: string) {
  try {
    const tradeRef = doc(db, 'trades', tradeId);
    const reviewField = isSender ? 'senderReview' : 'receiverReview';
    
    await updateDoc(tradeRef, {
      [reviewField]: {
        rating,
        comment,
        taggedSkill: taggedSkill || null,
        createdAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    // Also add to target user's testimonials as a verified review
    // To be most robust according to rules, we'd need to fetch and update.
    
    await sendNotification(
      targetUserId,
      'trade_update',
      `تلقيت تقييماً جديداً (${rating} نجوم) على مقايضتك الأخيرة`,
      tradeId
    );
  } catch (error) {
    console.error("Failed to add trade review:", error);
    throw error;
  }
}
