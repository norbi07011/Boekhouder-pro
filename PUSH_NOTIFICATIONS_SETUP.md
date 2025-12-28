# Push Notifications Setup Guide

## Current Status

**What works NOW:**
- ✅ In-app notifications (real-time via Supabase Realtime)
- ✅ Browser notifications when app is open/focused
- ✅ Notification sounds
- ✅ Badge count on app icon

**What requires additional setup:**
- ⚠️ Push notifications when app is closed (requires backend)

---

## Option 1: Use OneSignal (Easiest - Recommended)

OneSignal provides free push notifications with easy setup.

### Steps:

1. **Create OneSignal account**: https://onesignal.com

2. **Create Web Push App** in OneSignal dashboard

3. **Get your credentials**:
   - App ID
   - Safari Web ID (optional)

4. **Add OneSignal SDK** to your app:
   ```bash
   npm install react-onesignal
   ```

5. **Initialize in App.tsx**:
   ```tsx
   import OneSignal from 'react-onesignal';
   
   useEffect(() => {
     OneSignal.init({
       appId: "YOUR_ONESIGNAL_APP_ID",
     });
   }, []);
   ```

6. **Send notifications from Supabase**:
   - Create Edge Function that calls OneSignal API
   - Or use Supabase Database Webhooks

---

## Option 2: Firebase Cloud Messaging (FCM)

### Steps:

1. **Create Firebase project**: https://console.firebase.google.com

2. **Enable Cloud Messaging**

3. **Get credentials**:
   - Server Key
   - Sender ID
   - VAPID Public Key

4. **Add to .env**:
   ```
   VITE_FIREBASE_API_KEY=xxx
   VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
   VITE_FIREBASE_VAPID_KEY=xxx
   ```

5. **Create firebase-messaging-sw.js** in public folder

---

## Option 3: Self-hosted Web Push (Advanced)

This requires VAPID keys and proper encryption.

### Generate VAPID Keys:

```bash
npx web-push generate-vapid-keys
```

### Add to Supabase Edge Function Secrets:
- VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY
- VAPID_SUBJECT (mailto:your@email.com)

### Deploy Edge Function:
```bash
supabase functions deploy send-push
```

### Run migration:
```sql
-- Run supabase/migrations/004_push_notifications.sql
```

---

## Testing Notifications

1. Open browser DevTools (F12)
2. Go to Application > Service Workers
3. Click "Push" to test

Or use this in console:
```javascript
new Notification('Test', { body: 'This is a test notification' });
```

---

## Troubleshooting

### Notifications not showing?
1. Check browser permissions: Settings > Privacy > Notifications
2. Make sure site is allowed
3. Check if Notification.permission === 'granted'

### Delay in notifications?
- Supabase Realtime has ~1-3 second latency
- This is normal for WebSocket-based systems
- For instant notifications, use FCM/OneSignal

### PWA not installable?
1. Site must be served over HTTPS
2. manifest.json must be valid
3. Service worker must be registered
