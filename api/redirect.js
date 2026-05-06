export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('Error: Ningún código recibido por el servidor.');
  }

  const FIREBASE_URL = process.env.FIREBASE_URL;
  if (!FIREBASE_URL) {
    return res.status(500).send('Error: La variable FIREBASE_URL no está configurada en Vercel.');
  }

  try {
    const fetchRes = await fetch(`${FIREBASE_URL}/links/${code}.json`);
    const data = await fetchRes.json();

    if (data && data.url) {
      // Redirigir directo al destino
      res.setHeader('Cache-Control', 's-maxage=300');
      return res.redirect(301, data.url);
    }

    // Código no encontrado
    return res.status(404).send(`Error: El enlace corto '${code}' no existe en la base de datos.`);
  } catch (err) {
    return res.status(500).send('Error interno: ' + err.message);
  }
}
