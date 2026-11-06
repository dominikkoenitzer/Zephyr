import { collectBackupData, isBackupKey, mergeBackup, readBackup } from './backup';

export const OLD_ORIGIN = 'https://zephyr.old-home.invalid';
const MARK = '#move=';

/** Take data carried over from the old host off the address, before anything else can read it. */
export function takeMovedData() {
  const { hash, pathname, search } = window.location;
  if (!hash.startsWith(MARK)) return null;
  window.history.replaceState(window.history.state, '', pathname + search);
  return hash.slice(MARK.length);
}

const originOf = (address) => {
  try {
    return new URL(address).origin;
  } catch {
    return null;
  }
};

// A link from anywhere else may only fill a browser that holds nothing yet, so it can never add to someone's list.
const mayReceive = (referrer) =>
  referrer ? originOf(referrer) === OLD_ORIGIN : Object.keys(collectBackupData()).length === 0;

const fromBase64url = (text) =>
  Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));

async function unpack(packed) {
  const bytes = fromBase64url(packed.slice(1));
  if (packed[0] === 'r') return new TextDecoder().decode(bytes);
  return new Response(new Response(bytes).body.pipeThrough(new DecompressionStream('gzip'))).text();
}

// The old copy is already retired, so one damaged value must not cost the rest.
function keepReadableParts(text) {
  const entries = Object.entries(JSON.parse(text).data).filter(([key]) => isBackupKey(key));
  const isReadable = ([key, value]) => readBackup(JSON.stringify({ app: 'zephyr', data: { [key]: value } })).ok;
  mergeBackup({ data: Object.fromEntries(entries.filter(isReadable)) });
  // The app read the damaged value on the old host, and it reads it the same way here.
  entries.filter((entry) => !isReadable(entry)).forEach(([key, value]) => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
  });
}

/**
 * Add the carried data to this browser.
 * @returns {Promise<boolean>} whether anything was taken in.
 */
export async function receiveMovedData(packed, referrer = document.referrer) {
  if (!mayReceive(referrer)) return false;
  try {
    const text = await unpack(packed);
    const read = readBackup(text);
    if (read.ok) mergeBackup(read.backup);
    else if (read.reason === 'unreadable') keepReadableParts(text);
    else return false;
    return true;
  } catch {
    return false;
  }
}
