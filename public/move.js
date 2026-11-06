// Carries this browser's data to the new host in the address fragment, which no server receives.
(async () => {
  const HOME = 'https://zephyr.new-home.invalid';
  // Firefox refuses an address over 1 MiB; a set too large for this goes out as a backup file.
  const LONGEST = 1000000;
  const SAVE_MS = 1300;
  const CHUNK = 8192;

  if (window.location.origin === HOME) {
    window.location.replace('/');
    return;
  }

  const stored = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    return data;
  };

  const base64url = (bytes) => {
    let text = '';
    for (let i = 0; i < bytes.length; i += CHUNK) text += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const pack = async (text) => {
    const bytes = new TextEncoder().encode(text);
    if (typeof CompressionStream !== 'function') return `r${base64url(bytes)}`;
    const zipped = new Response(new Response(bytes).body.pipeThrough(new CompressionStream('gzip')));
    return `g${base64url(new Uint8Array(await zipped.arrayBuffer()))}`;
  };

  // Same file format as a backup from Settings, so the import there reads it.
  const save = (text) => new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zephyr-backup.json';
    link.click();
    setTimeout(resolve, SAVE_MS);
  });

  const retire = async () => {
    const workers = await navigator.serviceWorker.getRegistrations();
    await Promise.all(workers.map((worker) => worker.unregister()));
  };

  // The worker goes only after the data is ready, so a failure here leaves it to try again on the next visit.
  let target = `${HOME}/`;
  try {
    const data = stored();
    if (Object.keys(data).length > 0) {
      const text = JSON.stringify({ app: 'zephyr', version: 1, exportedAt: new Date().toISOString(), data });
      const packed = await pack(text);
      if (packed.length <= LONGEST) target += `#move=${packed}`;
      else await save(text);
    }
    await retire();
  } finally {
    window.location.replace(target);
  }
})();
