// Local "smart" quick-add: parse natural language out of a task title.
// No network and no AI service, just deterministic parsing of the patterns
// people actually type. Returns the cleaned title plus any detected
// due date (YYYY-MM-DD), priority, and #tags.
//
// A task has a due day, not a due time: the editor, the reminders and the
// views all work in days. So a time of day ("at 3pm", "15:30") only picks
// the day when nothing else did, and stays in the title for the person.

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEKDAY_ALIASES = { sun: 0, mon: 1, tue: 2, tues: 2, wed: 3, thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6 };
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
// A month as it is written, whole or cut short, and never a word that merely
// starts like one: "mars bars" is not March.
const MONTH_WORD =
  '(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)';

const PRIORITY_MAP = {
  '!high': 'high', '!h': 'high', '!1': 'high', p1: 'high',
  '!medium': 'medium', '!med': 'medium', '!m': 'medium', '!2': 'medium', p2: 'medium',
  '!low': 'low', '!l': 'low', '!3': 'low', p3: 'low',
};

const pad = (n) => String(n).padStart(2, '0');
const toISODate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// Next occurrence of a weekday (today counts only when `allowToday`).
const nextWeekday = (targetDow, allowToday = false) => {
  const today = startOfToday();
  const diff = (targetDow - today.getDay() + 7) % 7;
  return addDays(today, diff === 0 && !allowToday ? 7 : diff);
};

const collapse = (text) => text.replace(/\s{2,}/g, ' ').trim();

/**
 * The date, or null when the day does not exist in that month: `new Date`
 * rolls 2/30 over to 2 March and 25/12 to a January two years on.
 */
const realDate = (year, monthIndex, day) => {
  const d = new Date(year, monthIndex, day);
  return d.getFullYear() === year && d.getMonth() === monthIndex && d.getDate() === day ? d : null;
};

/**
 * Minutes after midnight for the first time of day in `text` ("3pm",
 * "at 3:30 pm", "15:30"), or null. Only clock times count: an hour with
 * am/pm, or hours and minutes.
 */
const timeOfDay = (text) => {
  const twelve = text.match(/(^|\s)(?:at\s+)?(\d{1,2})(?::([0-5]\d))?\s*(am|pm)(?=\s|$)/i);
  if (twelve) {
    const hour = Number(twelve[2]);
    if (hour < 1 || hour > 12) return null;
    const pm = twelve[4].toLowerCase() === 'pm';
    return ((hour % 12) + (pm ? 12 : 0)) * 60 + Number(twelve[3] || 0);
  }
  const clock = text.match(/(^|\s)(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)(?=\s|$)/i);
  if (clock) return Number(clock[2]) * 60 + Number(clock[3]);
  return null;
};

/**
 * @param {string} input Raw task text the user typed.
 * @returns {{ title: string, dueDate: string|null, priority: string|null, tags: string[] }}
 */
export function parseQuickTask(input) {
  const result = { title: '', dueDate: null, priority: null, tags: [] };
  if (!input || typeof input !== 'string') {
    result.title = (input || '').trim();
    return result;
  }

  let text = ` ${input} `;

  // 1) Tags: #tag (letters, digits, dash, underscore)
  text = text.replace(/(^|\s)#([\p{L}\d_-]+)/gu, (_, lead, tag) => {
    const clean = tag.toLowerCase();
    if (!result.tags.includes(clean)) result.tags.push(clean);
    return lead;
  });

  // 2) Priority: !high / !h / !1 / p1 (etc.) as a standalone token
  text = text.replace(/(^|\s)(![a-z0-9]+|p[123])(?=\s|$)/gi, (match, lead, token) => {
    const mapped = PRIORITY_MAP[token.toLowerCase()];
    if (mapped) {
      result.priority = mapped;
      return lead;
    }
    return match;
  });

  // 3) Due date. First match wins, so patterns run most to least specific.
  const today = startOfToday();
  const dateRules = [
    // ISO date: 2026-08-05
    { re: /(^|\s)(\d{4})-(\d{2})-(\d{2})(?=\s|$)/, run: (m) => realDate(Number(m[2]), Number(m[3]) - 1, Number(m[4])) },
    // M/D or M/D/YYYY
    {
      re: /(^|\s)(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s|$)/,
      run: (m) => {
        const month = Number(m[2]) - 1;
        const day = Number(m[3]);
        if (m[4]) return realDate(Number(m[4].length === 2 ? `20${m[4]}` : m[4]), month, day);
        // Without a year it is the next such day, as with a month name.
        const d = realDate(today.getFullYear(), month, day);
        return d && d < today ? realDate(today.getFullYear() + 1, month, day) : d;
      },
    },
    // Month name + day: "aug 5", "august 5th"
    {
      re: new RegExp(`(^|\\s)(${MONTH_WORD})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?=\\s|$)`, 'i'),
      run: (m) => {
        const month = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
        const day = Number(m[3]);
        const d = realDate(today.getFullYear(), month, day);
        return d && d < today ? realDate(today.getFullYear() + 1, month, day) : d;
      },
    },
    // Day + month name: "5 oct", "5th october", the way most of the world writes it
    {
      re: new RegExp(`(^|\\s)(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_WORD})\\.?(?=\\s|$)`, 'i'),
      run: (m) => {
        const month = MONTHS.indexOf(m[3].slice(0, 3).toLowerCase());
        const day = Number(m[2]);
        const d = realDate(today.getFullYear(), month, day);
        return d && d < today ? realDate(today.getFullYear() + 1, month, day) : d;
      },
    },
    // "in 3 days" / "in 2 weeks"
    {
      re: /(^|\s)in\s+(\d{1,3})\s+(day|days|week|weeks)(?=\s|$)/i,
      run: (m) => addDays(today, Number(m[2]) * (/week/i.test(m[3]) ? 7 : 1)),
    },
    // "next week" / "next monday"
    {
      re: new RegExp(`(^|\\s)next\\s+(week|${WEEKDAYS.join('|')}|${Object.keys(WEEKDAY_ALIASES).join('|')})(?=\\s|$)`, 'i'),
      run: (m) => {
        const word = m[2].toLowerCase();
        if (word === 'week') return addDays(today, 7);
        const dow = WEEKDAYS.indexOf(word) !== -1 ? WEEKDAYS.indexOf(word) : WEEKDAY_ALIASES[word];
        return nextWeekday(dow);
      },
    },
    // Bare weekday: "monday", "fri"
    {
      re: new RegExp(`(^|\\s)(${WEEKDAYS.join('|')}|${Object.keys(WEEKDAY_ALIASES).join('|')})(?=\\s|$)`, 'i'),
      run: (m) => {
        const word = m[2].toLowerCase();
        const dow = WEEKDAYS.indexOf(word) !== -1 ? WEEKDAYS.indexOf(word) : WEEKDAY_ALIASES[word];
        return nextWeekday(dow);
      },
    },
    { re: /(^|\s)(today|tonight)(?=\s|$)/i, run: () => today },
    { re: /(^|\s)(tomorrow|tmrw|tmr)(?=\s|$)/i, run: () => addDays(today, 1) },
  ];

  for (const rule of dateRules) {
    const match = text.match(rule.re);
    if (match) {
      const date = rule.run(match);
      if (date && !Number.isNaN(date.getTime())) {
        result.dueDate = toISODate(date);
        // A word that only introduced the date ("by friday", "due tomorrow")
        // goes with it, or the title ends on a dangling "by".
        const before = text.slice(0, match.index).replace(/\s(?:by|on|due|until)\s*$/i, ' ');
        text = before + match[1] + text.slice(match.index + match[0].length);
        break;
      }
    }
  }

  // 4) A time of day with no date: today while it is still ahead, otherwise
  // tomorrow. It stays in the title, since the task has nowhere else to keep
  // it. A bare "at 9" says neither am nor pm, so it picks no day.
  if (!result.dueDate) {
    const minutes = timeOfDay(text);
    if (minutes !== null) {
      const now = new Date();
      const passed = minutes <= now.getHours() * 60 + now.getMinutes();
      result.dueDate = toISODate(passed ? addDays(today, 1) : today);
    }
  }

  const cleaned = collapse(text);
  // Never return an empty title; fall back to the original text.
  result.title = cleaned || input.trim();
  return result;
}

export default parseQuickTask;
