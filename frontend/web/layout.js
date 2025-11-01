async function loadPartial(id, file) {
  try {
    const resp = await fetch(file);
    if (resp.ok) {
      document.getElementById(id).innerHTML = await resp.text();
    }
  } catch (err) {
    // SECURITY: Silent error handling - no console exposure of file paths
    // In production, errors should be logged to monitoring service
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const head = document.head;
  const font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap';
  head.appendChild(font);

  const tw = document.createElement('script');
  tw.src = 'https://cdn.tailwindcss.com';
  head.appendChild(tw);

  loadPartial('header', '/header.html');
  loadPartial('footer', '/footer.html');
});
