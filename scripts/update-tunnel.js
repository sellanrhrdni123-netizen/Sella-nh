const fs = require('fs');

const NEW_TUNNEL = 'https://hamilton-buildings-robust-technique.trycloudflare.com';

function updateFile(file) {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');
  // replace any trycloudflare.com URL
  c = c.replace(/https:\/\/[a-z0-9\-]+\.trycloudflare\.com/g, NEW_TUNNEL);
  fs.writeFileSync(file, c, 'utf8');
  console.log('Updated tunnel in ' + file);
}

updateFile('server.js');
updateFile('src/server/views/portal.js');
updateFile('src/server/views/components.js');
updateFile('src/server/views/admin.js');
