const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`
    <html>
      <head><title>mySafePlay Test</title></head>
      <body>
        <h1>mySafePlay Application</h1>
        <p>Server is running on port 3000</p>
        <p>Time: ${new Date().toISOString()}</p>
      </body>
    </html>
  `);
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Test server running on port 3000');
});
