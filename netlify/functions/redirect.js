// Netlify Function: extrae el código del path (sin prefijo /r/)
// acortarlink2026.netlify.app/2cp9nnvo → code = '2cp9nnvo' → Facebook/YouTube/etc.

export const handler = async (event) => {
  // Extraer código del path: '/2cp9nnvo' → '2cp9nnvo'
  const code = (event.path || '').replace(/^\//, '').split('/')[0]

  // Si no hay código o está vacío, el archivo estático maneja la raíz
  if (!code) {
    return {
      statusCode: 302,
      headers: { Location: '/' },
      body: ''
    }
  }

  try {
    // Resolver TinyURL en el servidor (sin mostrar su página)
    const res = await fetch(`https://tinyurl.com/${code}`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkSnap/1.0)' }
    })

    const location = res.headers.get('location')

    if (location) {
      // Redirigir directo al destino real
      return {
        statusCode: 301,
        headers: {
          Location: location,
          'Cache-Control': 'public, max-age=300'
        },
        body: ''
      }
    }

    // Fallback a TinyURL
    return {
      statusCode: 302,
      headers: { Location: `https://tinyurl.com/${code}` },
      body: ''
    }
  } catch (_err) {
    return {
      statusCode: 302,
      headers: { Location: `https://tinyurl.com/${code}` },
      body: ''
    }
  }
}
