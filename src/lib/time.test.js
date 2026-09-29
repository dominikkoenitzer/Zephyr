import { describe, expect, it } from 'vitest';
import { formatTime } from './time';

describe('formatTime', () => {
  it('pads minutes and seconds', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(59)).toBe('00:59');
    expect(formatTime(924)).toBe('15:24');
    expect(formatTime(1500)).toBe('25:00');
  });

  it('keeps counting minutes past the hour', () => {
    expect(formatTime(3600)).toBe('60:00');
    expect(formatTime(5400)).toBe('90:00');
  });

  it('never prints a fraction or a negative', () => {
    expect(formatTime(59.9)).toBe('00:59');
    expect(formatTime(-5)).toBe('00:00');
    expect(formatTime(undefined)).toBe('00:00');
  });
});
