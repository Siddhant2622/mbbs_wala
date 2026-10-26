const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');

// 1. Add preload + preconnect hints before fonts preconnect
const preconnectMarker = '    <link rel="preconnect" href="https://fonts.googleapis.com"';

if (!html.includes('hero-warm.webp')) {
  const inserts = [
    '    <!-- LCP hero image preload (WebP for modern browsers) -->',
    '    <link rel="preload" as="image" href="/images/mbbswala/hero-warm.webp" type="image/webp" />',
    '    <!-- Logo preload (WebP ~14KB vs 262KB PNG) -->',
    '    <link rel="preload" href="/images/mbbswala/logo-master.webp" as="image" type="image/webp" />',
    '    <!-- Preconnect to API backend (saves ~300ms LCP) -->',
    '    <link rel="preconnect" href="https://mpc2-prod-28-is5qnl632q-ue.a.run.app" crossorigin />',
    '',
  ].join('\n');
  html = html.replace(preconnectMarker, inserts + preconnectMarker);
  console.log('✅ Added preload + preconnect hints');
} else {
  console.log('ℹ WebP preload already present');
}

// 2. Add deferred Facebook Pixel before </body>
if (!html.includes("window.addEventListener('load'") && !html.includes('window.addEventListener("load"')) {
  const fbDeferred = [
    '    <!-- Meta Pixel Code (deferred — loads after page is interactive) -->',
    "    <script>",
    "      window.addEventListener('load', function() {",
    "        !function(f,b,e,v,n,t,s)",
    "        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?",
    "        n.callMethod.apply(n,arguments):n.queue.push(arguments)};",
    "        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';",
    "        n.queue=[];t=b.createElement(e);t.async=!0;",
    "        t.src=v;s=b.getElementsByTagName(e)[0];",
    "        s.parentNode.insertBefore(t,s)}(window, document,'script',",
    "        'https://connect.facebook.net/en_US/fbevents.js');",
    "        fbq('init', '1641094254309118');",
    "        fbq('track', 'PageView');",
    "      });",
    "    </script>",
    "    <noscript><img height='1' width='1' style='display:none'",
    "    src='https://www.facebook.com/tr?id=1641094254309118&ev=PageView&noscript=1'",
    "    /></noscript>",
    "    <!-- End Meta Pixel Code -->",
    "",
  ].join('\n');

  html = html.replace('</body>', fbDeferred + '  </body>');
  console.log('✅ Added deferred Facebook Pixel');
} else {
  console.log('ℹ Deferred FB already present');
}

fs.writeFileSync(file, html, 'utf8');

// Verify
console.log('\n--- Verification ---');
console.log('WebP hero preload:', html.includes('hero-warm.webp'));
console.log('Logo WebP preload:', html.includes('logo-master.webp'));
console.log('Deferred FB Pixel:', html.includes("window.addEventListener('load'"));
console.log('run.app preconnect:', html.includes('run.app'));
console.log('FB Pixel removed from head:', !html.includes('<!-- Meta Pixel Code -->') || html.includes('Meta Pixel Code (deferred'));
