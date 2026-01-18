export default async function handler(req, res) {
  try {
    // Compute key same as the client widget: floor(now / 5000)
    const k = Math.floor(Date.now() / 5000);

    // Use referer if present, otherwise host
    const origin = req.headers.referer || (req.headers.host ? `https://${req.headers.host}` : '');
    const r = encodeURIComponent(origin);

    const url = `https://cricketdata.org/apis/prepscores.aspx?k=${k}&r=${r}`;

    const response = await fetch(url, { headers: { 'User-Agent': '24x7-Widget-Proxy/1.0' }, timeout: 10000 });
    if (!response.ok) {
      res.status(502).send(`Proxy fetch failed: ${response.status}`);
      return;
    }

    let text = await response.text();

    // Sanitize: remove <script> tags to avoid executing third-party scripts
    text = text.replace(/<script[\s\S]*?<\/script>/gi, '');

    // Return the HTML fragment
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    res.status(200).send(text);
  } catch (err) {
    console.error('cric-prepscores proxy error:', err);
    res.status(500).send('Error fetching prepscores');
  }
}
