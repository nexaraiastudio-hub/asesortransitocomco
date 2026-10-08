const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  // Configurar headers CORS manualmente
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  proxy.web(req, res, { target: 'https://rmuqhrfahzkxtjedjxip.supabase.co' });
});

server.listen(8081);
console.log('Proxy corriendo en http://localhost:8081');
