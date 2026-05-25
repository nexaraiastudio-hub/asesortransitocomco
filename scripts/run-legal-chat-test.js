import 'dotenv/config'

const SUPABASE_URL = 'https://rmuqhrfahzkxtjedjxip.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const email = 'nexaraiastudio@gmail.com'
const password = 'charly2026'
const query = 'Un agente me quiere inmovilizar la moto porque mi acompañante no tiene el casco bien marcado con la placa'

async function main() {
  if (!SERVICE_KEY) {
    console.error('Missing SUPABASE_SERVICE_KEY in .env')
    process.exit(1)
  }

  // 1) Obtener access_token mediante la API de Auth
  const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
    },
    body: JSON.stringify({ email, password }),
  })
  const tokenJson = await tokenRes.json()
  if (tokenJson.error) {
    console.error('Login error:', tokenJson)
    process.exit(1)
  }

  const access_token = tokenJson.access_token
  console.log('Obtained access_token (truncated):', access_token ? access_token.slice(0, 24) + '...' : '(none)')

  // 2) Llamar la función legal-chat
  const fnRes = await fetch('https://rmuqhrfahzkxtjedjxip.functions.supabase.co/legal-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
    body: JSON.stringify({ query }),
  })

  let fnBody
  try {
    fnBody = await fnRes.json()
  } catch (e) {
    const text = await fnRes.text()
    console.error('Failed to parse function response as JSON:', text)
    process.exit(1)
  }

  console.log('Function HTTP status:', fnRes.status)
  console.log('Function response body:')
  console.log(JSON.stringify(fnBody, null, 2))
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
