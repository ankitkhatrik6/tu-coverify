const https = require('https');

const URL = 'https://tucoverify.ankitak.com.np/';
// Render spins down free web services after 15 minutes of inactivity.
// We ping every 14 minutes to keep it awake.
const INTERVAL = 14 * 60 * 1000; // 14 minutes

function ping() {
  https.get(URL, (res) => {
    console.log(`[Keep-Alive] Pinged ${URL} - Status: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error(`[Keep-Alive] Error pinging ${URL}:`, err.message);
  });
}

console.log(`[Keep-Alive] Started pinging ${URL} every ${INTERVAL / 60000} minutes.`);

// Initial ping is delayed to give the server time to start up
setTimeout(ping, 10000);

setInterval(ping, INTERVAL);
