import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { collection, query, onSnapshot, where, orderBy, limit, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import app from '../firebase';
import { useToastContext } from '../context/ToastContext';

export function usePushNotifications() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const { showToast } = useToastContext();

  useEffect(() => {
    // 1. Setup Browser / OS Push Permissions and FCM
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const setupPush = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted' && 'serviceWorker' in navigator) {
            try {
              const messaging = getMessaging(app);
              const token = await getToken(messaging);
              if (token) {
                setFcmToken(token);
                if (auth.currentUser) {
                  await setDoc(doc(db, 'user_tokens', auth.currentUser.uid), {
                    token,
                    updatedAt: new Date().toISOString()
                  }, { merge: true });
                }
              }
              onMessage(messaging, (payload) => {
                if (payload.notification) {
                  showToast(payload.notification.title || 'Nova Notificação!', 'info');
                  new Notification(payload.notification.title || 'Nova Notificação', {
                    body: payload.notification.body,
                    icon: '/icon.png'
                  });
                }
              });
            } catch (err) {
              console.warn("FCM getToken error (VAPID max exist ou ServiceWorker proxy):", err);
            }
          }
        } catch (error) {
          console.warn('Erro ao solicitar permissão de Notificação', error);
        }
      };
      setupPush();
    }
  }, [auth.currentUser, showToast]);

  // 2. Fallback: Listen to Firestore directly for notifications
  // This simulates push for environments where Service Workers are blocked but WebSockets work
  useEffect(() => {
    let unsubscribe = () => {};
    if (auth.currentUser) {
      const q = query(
        collection(db, 'notifications'), 
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc'), 
        limit(1)
      );
      
      let initialLoad = true;
      unsubscribe = onSnapshot(q, (snapshot) => {
        if (initialLoad) {
          initialLoad = false;
          return; // Skip on first load
        }
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            if (data.read) return;

            let toastType: 'info' | 'success' | 'warning' | 'error' = 'info';
            if (data.type === 'proposal_status' || data.type === 'installation_update') {
               toastType = 'success';
            }

            showToast(data.title, toastType);
            
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(data.title, {
                body: data.message,
                icon: '/icon.png'
              });
            }
          }
        });
      });
    }
    return () => unsubscribe();
  }, [auth.currentUser, showToast]);

  return { fcmToken };
}

