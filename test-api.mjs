const urls = [
  {name: 'News', url: 'https://choutuppal.in/api/news'},
  {name: 'Blogs', url: 'https://choutuppal.in/api/blogs'},
  {name: 'Listings', url: 'https://choutuppal.in/api/listings?limit=2'},
];

async function run() {
  for (const {name, url} of urls) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      console.log(`[${name}] HTTP ${res.status}`);
      try {
        const json = JSON.parse(text);
        const dataPreview = Array.isArray(json) ? `${json.length} items` : (json.data ? `${json.data.length} items (paginated)` : 'Object');
        console.log(`Data: ${dataPreview}\n`);
      } catch {
        console.log(`Data (Raw): ${text.slice(0, 100)}...\n`);
      }
    } catch(e) {
      console.log(`[${name}] Failed: ${e.message}\n`);
    }
  }

  // Test POST /api/spin
  try {
    const res = await fetch('https://choutuppal.in/api/spin', { method: 'POST', body: JSON.stringify({ userId: 'test' }) });
    console.log(`[Spin API] HTTP ${res.status}`);
    const text = await res.text();
    console.log(`Data: ${text.slice(0, 100)}...\n`);
  } catch(e) {
    console.log(`[Spin API] Failed: ${e.message}\n`);
  }
}
run();
