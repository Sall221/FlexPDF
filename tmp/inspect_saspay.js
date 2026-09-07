const fs = require('fs');

if (!fs.existsSync('/tmp/saspay.js')) {
  console.log('Downloading /tmp/saspay.js...');
  require('child_process').execSync('curl -s -L "https://saspay.me/assets/index-D2LyHRHT.js" -o /tmp/saspay.js');
}

const text = fs.readFileSync('/tmp/saspay.js', 'utf8');
console.log('Bundle length:', text.length);

// Search for curl snippets, endpoints, or references to checkout
const curlSnippets = [];
const regex = /curl\s+[^"'\`]{10,300}/gi;
let m;
while ((m = regex.exec(text)) !== null) {
  curlSnippets.push(m[0]);
}
console.log('CURL Snippets found:', curlSnippets.length);
curlSnippets.slice(0, 10).forEach((c, i) => console.log(`[CURL ${i}]`, c));

// Search for API paths
const apiPaths = new Set();
const pathRegex = /["'](\/(?:api\/v1\/|v1\/|payments\/|checkout\/|sessions\/)[^"'\s]+)["']/g;
while ((m = pathRegex.exec(text)) !== null) {
  apiPaths.add(m[1]);
}
console.log('API Paths found:', Array.from(apiPaths));

// Look for sections mentioning checkout session or payment url
const matches = [];
const searchTerms = ['session', 'checkout', 'softpay', 'payment_url', 'checkout_url', 'session_id'];
for (const term of searchTerms) {
  let idx = 0;
  let count = 0;
  while ((idx = text.indexOf(term, idx)) !== -1 && count < 3) {
    const start = Math.max(0, idx - 100);
    const end = Math.min(text.length, idx + 200);
    matches.push({ term, snippet: text.substring(start, end).replace(/\n/g, ' ') });
    idx += term.length;
    count++;
  }
}
console.log('Snippets:', JSON.stringify(matches, null, 2));
