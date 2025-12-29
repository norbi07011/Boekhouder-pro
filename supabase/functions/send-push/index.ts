// @ts-nocheck
// Supabase Edge Function: send-push
// Sends Web Push notifications to subscribed users
// 
// Deploy with: supabase functions deploy send-push
//
// Required secrets (set in Supabase Dashboard > Edge Functions > Secrets):
// - VAPID_PUBLIC_KEY: Your VAPID public key
// - VAPID_PRIVATE_KEY: Your VAPID private key
// - VAPID_SUBJECT: mailto:your-email@example.com

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Web Push implementation for Deno
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushPayload {
  user_id: string
  title: string
  body: string
  type: string
  link: string
  notification_id: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: PushPayload = await req.json()
    
    console.log('Received push request:', payload)

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', payload.user_id)

    if (subError) {
      console.error('Error fetching subscriptions:', subError)
      return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for user:', payload.user_id)
      return new Response(JSON.stringify({ message: 'No subscriptions' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get VAPID keys from environment
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@boekhouder.nl'

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured')
      return new Response(JSON.stringify({ error: 'VAPID not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Prepare push notification payload
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: payload.notification_id,
      data: {
        url: payload.link || '/',
        type: payload.type,
        notificationId: payload.notification_id
      },
      requireInteraction: payload.type === 'task_due'
    })

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          // Use web-push compatible approach
          const response = await sendWebPush({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, pushPayload, {
            vapidPublicKey,
            vapidPrivateKey,
            vapidSubject
          })

          return { success: true, endpoint: sub.endpoint }
        } catch (error) {
          console.error('Push failed for endpoint:', sub.endpoint, error)
          
          // If subscription is invalid, delete it
          if (error.message?.includes('410') || error.message?.includes('404')) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id)
            console.log('Deleted invalid subscription:', sub.id)
          }
          
          return { success: false, endpoint: sub.endpoint, error: error.message }
        }
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    console.log(`Push sent: ${successful} successful, ${failed} failed`)

    return new Response(JSON.stringify({ 
      message: 'Push sent',
      successful,
      failed
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Simple Web Push sender using fetch (for Deno)
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapid: { vapidPublicKey: string; vapidPrivateKey: string; vapidSubject: string }
) {
  // For full Web Push implementation, you'd need web-push library
  // This is a simplified version - for production, use a proper Web Push library
  
  // The endpoint tells us which push service to use
  const endpoint = subscription.endpoint
  
  // Create VAPID headers
  const vapidHeaders = await createVapidHeaders(
    endpoint,
    vapid.vapidSubject,
    vapid.vapidPublicKey,
    vapid.vapidPrivateKey
  )
  
  // Encrypt payload
  const encryptedPayload = await encryptPayload(
    payload,
    subscription.keys.p256dh,
    subscription.keys.auth
  )
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Authorization': vapidHeaders.Authorization,
      'Crypto-Key': vapidHeaders.CryptoKey
    },
    body: encryptedPayload
  })
  
  if (!response.ok) {
    throw new Error(`Push service responded with ${response.status}: ${await response.text()}`)
  }
  
  return response
}

// VAPID header creation (simplified - use web-push library in production)
async function createVapidHeaders(
  endpoint: string,
  subject: string,
  publicKey: string,
  privateKey: string
) {
  const audience = new URL(endpoint).origin
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60 // 12 hours
  
  const header = { typ: 'JWT', alg: 'ES256' }
  const payload = {
    aud: audience,
    exp: expiration,
    sub: subject
  }
  
  // In production, properly sign with ES256
  // This is a placeholder - use a proper JWT library
  const token = btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload)) + '.signature'
  
  return {
    Authorization: `vapid t=${token}, k=${publicKey}`,
    CryptoKey: `p256ecdsa=${publicKey}`
  }
}

// Payload encryption (placeholder - use proper encryption in production)
async function encryptPayload(payload: string, p256dh: string, auth: string): Promise<Uint8Array> {
  // In production, use proper AES-GCM encryption with the subscription keys
  // This requires proper ECDH key exchange and AES-GCM encryption
  const encoder = new TextEncoder()
  return encoder.encode(payload)
}
