addEventListener('fetch', event => {
  event.respondWith(handle(event.request));
});

async function handle(request) {
  const url = new URL(request.url);
  if (url.hostname === 'veganblatt.com') {
    url.hostname = 'www.veganblatt.com';
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }
  return new Response('OK');
}

