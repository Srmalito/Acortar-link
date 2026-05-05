// Netlify Function (ESM): lee el código desde el path de la URL
// /r/23lbfnqg → event.path = '/r/23lbfnqg' → code = '23lbfnqg'

export const handler = async (event) => {
  // Extraer el código desde la ruta: /r/23lbfnqg → '23lbfnqg'
  const pathParts = (event.path || '').split('/')
  const code = pathParts[pathParts.length - 1]

  if (!code || code === 'redirect') {
    return { statusCode: 400, body: 'Código no proporcionado' }
  }

  try {
    // Fetch sin seguir el redirect para capturar el Location header de TinyURL
    const res = await fetch(`https://tinyurl.com/${code}`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkSnap/1.0)' }
    })

    const location = res.headers.get('location')

    if (location) {
      // Redirigir directamente al destino real (Facebook, YouTube, etc.)
      return {
        statusCode: 301,
        headers: {
          Location: location,
          'Cache-Control': 'public, max-age=300'
        },
        body: ''
      }
    }

    // Fallback: ir a TinyURL si no hay Location header
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
