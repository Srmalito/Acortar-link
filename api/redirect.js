// Vercel Serverless Function: lee la URL desde Firebase y redirige directamente.
// Código de 4 chars (ej: Ab3x) → Firebase → URL original → redirect 301

export default async function handler(req, res) {
  const { code } = req.query;

  // Sin código → redirigir al app
  if (!code) {
    return res.redirect(302, '/');
  }

  const FIREBASE_URL = process.env.FIREBASE_URL;
  if (!FIREBASE_URL) {
    return res.status(500).send('Firebase no configurado en el servidor.');
  }

  try {
    const fetchRes = await fetch(`${FIREBASE_URL}/links/${code}.json`);
    const data = await fetchRes.json();

    if (data && data.url) {
      // Redirigir directo al destino (Facebook, YouTube, etc.)
      res.setHeader('Cache-Control', 's-maxage=300');
      return res.redirect(301, data.url);
    }

    // Código no encontrado → volver al app
    return res.redirect(302, '/');
  } catch (err) {
    return res.redirect(302, '/');
  }
}
