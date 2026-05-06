// Netlify Function: lee la URL desde Firebase y redirige directamente.
// Código de 4 chars (ej: Ab3x) → Firebase → URL original → redirect 301

export const handler = async (event) => {
  const code = (event.path || '').replace(/^\//, '').split('/')[0]

  // Sin código → redirigir al app
  if (!code) {
    return { statusCode: 302, headers: { Location: '/' }, body: '' }
  }

  const FIREBASE_URL = process.env.FIREBASE_URL
  if (!FIREBASE_URL) {
    return { statusCode: 500, body: 'Firebase no configurado en el servidor.' }
  }

  try {
    const res = await fetch(`${FIREBASE_URL}/links/${code}.json`)
    const data = await res.json()

    if (data && data.url) {
      // Redirigir directo al destino (Facebook, YouTube, etc.)
      return {
        statusCode: 301,
        headers: {
          Location: data.url,
          'Cache-Control': 'public, max-age=300'
        },
        body: ''
      }
    }

    // Código no encontrado → volver al app
    return {
      statusCode: 302,
      headers: { Location: '/' },
      body: ''
    }
  } catch (_err) {
    return {
      statusCode: 302,
      headers: { Location: '/' },
      body: ''
    }
  }
}
