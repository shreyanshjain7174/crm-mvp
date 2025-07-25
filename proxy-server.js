const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');

const app = express();

// Proxy API requests to backend - preserving the full path
app.use('/api', createProxyMiddleware({
  target: 'http://host.docker.internal:3001',
  changeOrigin: true,
  logLevel: 'debug',
  // Don't rewrite the path - keep it as /api/...
  pathRewrite: {}
}));

// Proxy Socket.io requests to backend
app.use('/socket.io', createProxyMiddleware({
  target: 'http://host.docker.internal:3001',
  changeOrigin: true,
  ws: true
}));

// Proxy everything else to frontend
app.use('/', createProxyMiddleware({
  target: 'http://host.docker.internal:3000',
  changeOrigin: true
}));

app.listen(8080, () => {
  console.log('Proxy server running on port 8080');
  console.log('API requests: /api/* -> http://host.docker.internal:3001/api/*');
  console.log('Socket.io: /socket.io/* -> http://host.docker.internal:3001/socket.io/*');  
  console.log('Frontend: /* -> http://host.docker.internal:3000/*');
});