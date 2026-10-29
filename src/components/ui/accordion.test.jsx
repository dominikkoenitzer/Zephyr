import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

/**
 * Built the way the Help page builds its questions. A screen reader has to
 * hear which question is open and must not read the answers that are closed.
 */
const QUESTIONS = [
  ['faq-0', 'Can I change the timer?', 'Yes, on the Focus page.'],
  ['faq-1', 'Is my data synced?', 'Not automatically.'],
];

let container;
let root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <Accordion type="single">
        {QUESTIONS.map(([value, question, answer]) => (
          <AccordionItem key={value} value={value}>
            <AccordionTrigger value={value}>{question}</AccordionTrigger>
            <AccordionContent value={value}>{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    )
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const trigger = (index) => container.querySelectorAll('button')[index];
const panel = (index) => document.getElementById(trigger(index).getAttribute('aria-controls'));
const click = (el) => act(() => el.click());

describe('Accordion', () => {
  it('ties each question to its answer', () => {
    QUESTIONS.forEach(([, , answer], index) => {
      expect(panel(index)?.textContent).toBe(answer);
    });
  });

  it('reports a question as closed, then open after a click', () => {
    expect(trigger(0).getAttribute('aria-expanded')).toBe('false');
    click(trigger(0));
    expect(trigger(0).getAttribute('aria-expanded')).toBe('true');
    click(trigger(0));
    expect(trigger(0).getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps a closed answer out of the accessibility tree', () => {
    expect(panel(0).hasAttribute('inert')).toBe(true);
    expect(panel(1).hasAttribute('inert')).toBe(true);

    click(trigger(0));
    expect(panel(0).hasAttribute('inert')).toBe(false);

    click(trigger(1));
    expect(trigger(0).getAttribute('aria-expanded')).toBe('false');
    expect(panel(0).hasAttribute('inert')).toBe(true);
    expect(panel(1).hasAttribute('inert')).toBe(false);
  });

  it('hides a closed answer without taking it out of the layout, so it still animates', () => {
    expect(panel(0).hidden).toBe(false);
    expect(panel(0).className).toContain('max-h-0');
    click(trigger(0));
    expect(panel(0).className).toContain('max-h-[500px]');
  });
});
