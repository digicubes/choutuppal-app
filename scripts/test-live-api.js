async function checkApi(url) {
  try {
    const res = await fetch(url);
    console.log(`URL: ${url} - Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response snippet:`, text.substring(0, 100));
  } catch (err) {
    console.error(`URL: ${url} - Error:`, err.message);
  }
}

async function main() {
  await checkApi('https://choutuppal.in/api/listings');
  await checkApi('https://choutuppal.in/api/news');
  await checkApi('https://choutuppal.in/api/settings');
}

main();
