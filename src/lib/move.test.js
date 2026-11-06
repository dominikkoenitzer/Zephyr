import { beforeEach, describe, expect, it } from 'vitest';
import { OLD_ORIGIN, receiveMovedData, takeMovedData } from './move';

const OLD_HOST = `${OLD_ORIGIN}/`;

const toBase64url = (bytes) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const plain = (text) => `r${toBase64url(new TextEncoder().encode(text))}`;

const zipped = async (text) => {
  const stream = new Response(new TextEncoder().encode(text)).body.pipeThrough(new CompressionStream('gzip'));
  return `g${toBase64url(new Uint8Array(await new Response(stream).arrayBuffer()))}`;
};

const envelope = (data) => JSON.stringify({ app: 'zephyr', version: 1, data });

const taskList = (...titles) =>
  JSON.stringify({ tasks: titles.map((title) => ({ id: title, title })), lastUpdated: 1 });

const storedTitles = () => JSON.parse(localStorage.getItem('zephyr_tasks')).tasks.map((task) => task.title);

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('takeMovedData', () => {
  it('returns the data and leaves nothing of it in the address', () => {
    window.history.replaceState(null, '', '/?a=1#move=rabc');
    expect(takeMovedData()).toBe('rabc');
    expect(window.location.href).not.toContain('move=');
    expect(window.location.search).toBe('?a=1');
  });

  it('leaves any other address alone', () => {
    window.history.replaceState(null, '', '/tasks#other');
    expect(takeMovedData()).toBeNull();
    expect(window.location.hash).toBe('#other');
  });
});

describe('receiveMovedData', () => {
  it('reads the zipped form', async () => {
    const packed = await zipped(envelope({ zephyr_tasks: taskList('Grüsse an Zoë') }));
    expect(await receiveMovedData(packed, OLD_HOST)).toBe(true);
    expect(storedTitles()).toEqual(['Grüsse an Zoë']);
  });

  it('reads the plain form a browser without compression sends', async () => {
    expect(await receiveMovedData(plain(envelope({ zephyr_tasks: taskList('One') })), OLD_HOST)).toBe(true);
    expect(storedTitles()).toEqual(['One']);
  });

  it('adds to what this browser already holds, and a second arrival adds nothing', async () => {
    localStorage.setItem('zephyr_tasks', taskList('Here'));
    localStorage.setItem('theme', 'light');
    const packed = plain(envelope({ zephyr_tasks: taskList('There'), theme: 'dark' }));
    await receiveMovedData(packed, OLD_HOST);
    await receiveMovedData(packed, OLD_HOST);
    expect(storedTitles()).toEqual(['Here', 'There']);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('never takes keys that describe the old browser', async () => {
    const packed = plain(envelope({ zephyr_tasks: taskList('One'), zephyr_last_backup: 'x', token: 'y' }));
    await receiveMovedData(packed, OLD_HOST);
    expect(localStorage.getItem('zephyr_last_backup')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('keeps the readable parts when one value is damaged', async () => {
    const damaged = '{"tasks":[{"id":"a","title":7}]}';
    const packed = plain(envelope({ zephyr_tasks: damaged, zephyr_focus_sessions: '[{"id":"s"}]', theme: 'dark' }));
    expect(await receiveMovedData(packed, OLD_HOST)).toBe(true);
    expect(localStorage.getItem('zephyr_focus_sessions')).toBe('[{"id":"s"}]');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(localStorage.getItem('zephyr_tasks')).toBe(damaged);
  });

  it('does not put a damaged value over what this browser holds', async () => {
    localStorage.setItem('zephyr_tasks', taskList('Here'));
    await receiveMovedData(plain(envelope({ zephyr_tasks: '{"tasks":[{"id":"a","title":7}]}' })), OLD_HOST);
    expect(storedTitles()).toEqual(['Here']);
  });

  it('refuses a link from another site', async () => {
    const packed = plain(envelope({ zephyr_tasks: taskList('Planted') }));
    expect(await receiveMovedData(packed, 'https://elsewhere.invalid/')).toBe(false);
    expect(localStorage.getItem('zephyr_tasks')).toBeNull();
  });

  it('refuses a link with no referrer once this browser holds data', async () => {
    localStorage.setItem('zephyr_tasks', taskList('Here'));
    expect(await receiveMovedData(plain(envelope({ zephyr_tasks: taskList('Planted') })), '')).toBe(false);
    expect(storedTitles()).toEqual(['Here']);
  });

  it('takes data with no referrer into an empty browser, for browsers that strip it', async () => {
    expect(await receiveMovedData(plain(envelope({ zephyr_tasks: taskList('One') })), '')).toBe(true);
    expect(storedTitles()).toEqual(['One']);
  });

  it('ignores anything unreadable or foreign', async () => {
    expect(await receiveMovedData('g!!!', OLD_HOST)).toBe(false);
    expect(await receiveMovedData(plain('not json'), OLD_HOST)).toBe(false);
    expect(await receiveMovedData(plain('{"app":"other","data":{"theme":"dark"}}'), OLD_HOST)).toBe(false);
    expect(localStorage.length).toBe(0);
  });
});
