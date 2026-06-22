// api/stripe-checkout.js — Vercel Edge Function
export const config = { runtime: 'edge' }

// Price IDs live — actualizados 22/06/2026
const PRICES = {
  base_mensal:   'price_1TlGBkCuZCS32LoSbGw1sYoR',
  base_anual:    'price_1TlGBkCuZCS32LoSETHnq6Aj',
  pro_mensal:    'price_1TlGLoCuZCS32LoSLDhybK7f',
  pro_anual:     'price_1TlGLoCuZCS32LoSp19L3Q3U',
  elite_mensal:  'price_1TlGQFCuZCS32LoSxqT2nOqy',
  elite_anual:   'price_1TlGQFCuZCS32LoSyM0xMYmG',
}

// Mapeamento plano → price key
// Pro e Elite usam escalonamento por volume no Stripe — passa-se quantity
const PLANO_KEY = {
  base:              { mensal: 'base_mensal',  anual: 'base_anual',  quantity: 1 },
  profissional:      { mensal: 'pro_mensal',   anual: 'pro_anual',   quantity: 1 },
  elite:             { mensal: 'elite_mensal', anual: 'elite_anual', quantity: 1 },
  // Grupos — mesmo price ID, quantidade diferente → Stripe aplica faixa correcta
  pro_grupo_3_5:     { mensal: 'pro_mensal',   anual: 'pro_anual',   quantity: 3 },
  pro_grupo_6_12:    { mensal: 'pro_mensal',   anual: 'pro_anual',   quantity: 6 },
  pro_grupo_13:      { mensal: 'pro_mensal',   anual: 'pro_anual',   quantity: 13 },
  elite_grupo_3_5:   { mensal: 'elite_mensal', anual: 'elite_anual', quantity: 3 },
  elite_grupo_6_12:  { mensal: 'elite_mensal', anual: 'elite_anual', quantity: 6 },
  elite_grupo_13:    { mensal: 'elite_mensal', anual: 'elite_anual', quantity: 13 },
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const { plano, periodo, email, userId, quantidade } = await req.json()

    const cfg = PLANO_KEY[plano]
    if (!cfg) return json({ error: `Plano desconhecido: ${plano}` }, 400)

    const priceKey = periodo === 'anual' ? cfg.anual : cfg.mensal
    const priceId = PRICES[priceKey]
    // Quantidade: usa a do payload se enviada, senão a default do plano
    const qty = quantidade || cfg.quantity

    const origin = req.headers.get('origin') || 'https://championsloft.pt'

    const params = new URLSearchParams({
      'mode': 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': String(qty),
      'customer_email': email || '',
      'metadata[user_id]': userId || '',
      'metadata[plano]': plano,
      'metadata[quantidade]': String(qty),
      'success_url': `${origin}/?sucesso=1&session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${origin}/?cancelado=1`,
      'allow_promotion_codes': 'true',
      'billing_address_collection': 'auto',
      'locale': 'pt',
      // Trial 30 dias
      'subscription_data[trial_period_days]': '30',
    })

    const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    })

    const session = await sessionRes.json()
    if (session.error) return json({ error: session.error.message }, 400)
    return json({ url: session.url })

  } catch(e) {
    return json({ error: e.message }, 500)
  }
}

const corsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
})
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', ...corsHeaders() }
})
