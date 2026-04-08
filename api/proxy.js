const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const urlObj = new URL(req.url, 'http://localhost');
  const pathParts = urlObj.pathname.replace('/api/proxy', '').replace(/^\//, '');
  const qs = urlObj.searchParams.toString();
  const target = `https://renet.immoflux.ro/api/v1/${pathParts}${qs ? '?' + qs : ''}`;

  return new Promise((resolve) => {
    https.get(target, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Host': 'renet.immoflux.ro' }
    }, (apiRes) => {
      let body = '';
      apiRes.on('data', d => body += d);
      apiRes.on('end', () => {
        try {
          res.status(200).json(JSON.parse(body));
        } catch(e) {
          res.status(500).json({ error: 'Parse error', raw: body.substring(0, 200) });
        }
        resolve();
      });
    }).on('error', (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });
  });
};
