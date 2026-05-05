// Netlify Function: resuelve el código de TinyURL en el servidor
// y redirige directamente a la URL original sin pasar por la página de TinyURL.

exports.handler = async (event) => {
  const code = event.queryStringParameters?.code
  if (!code) {
    return { statusCode: 400, body: 'Código no proporcionado' }
  }

  try {
    // Fetch a TinyURL sin seguir el redirect (manual), para capturar el Location header
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

    // Fallback: si no hay Location header, ir a TinyURL directamente
    return {
      statusCode: 302,
      headers: { Location: `https://tinyurl.com/${code}` },
      body: ''
    }
  } catch (err) {
    return {
      statusCode: 302,
      headers: { Location: `https://tinyurl.com/${code}` },
      body: ''
    }
  }
}
