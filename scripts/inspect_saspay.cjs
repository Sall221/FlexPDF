const fs = require('fs');
const { execSync } = require('child_process');

try {
  console.log('Downloading https://saspay.me/assets/index-D2LyHRHT.js ...');
  const jsContent = execSync('curl -s -L "https://saspay.me/assets/index-D2LyHRHT.js"').toString('utf8');
  console.log('Bundle length:', jsContent.length);

  // Search for any links with doc, api, saspay, github
  const docLinks = [...new Set(jsContent.match(/https?:\/\/[^\s"'\`<>]+/g) || [])];
  console.log('All URLs:');
  docLinks.forEach(u => console.log(' -', u));

  // Search for routes / pages
  const routes = [...new Set(jsContent.match(/path:\s*["']([^"']+)["']/g) || [])];
  console.log('Routes:', routes);

  // Let's also check all HTML files or other scripts on saspay.me
  const indexHtml = execSync('curl -s -L "https://saspay.me/"').toString('utf8');
  console.log('Index HTML script tags:', indexHtml.match(/<script[^>]+src=["']([^"']+)["']/g));
} catch (e) {
  console.error('Error:', e.message);
}
