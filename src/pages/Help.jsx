import { Link } from 'react-router-dom';
import { Card, CardTitle } from '../components/ui/card';
import { NightSurface } from '../components/ui/night-surface';
import { HelpCircle, Zap, Shield, FileText, Timer, Settings, WifiOff, Trash2, Cloud, Keyboard, Command } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import ShortcutTable from '../components/Shortcuts/ShortcutTable';
import PageHeader from '../components/Layout/PageHeader';
import PageContainer from '../components/Layout/PageContainer';
import { usePageMeta } from '../hooks/usePageMeta';
import { ROUTE_META } from '../routes/meta';

const QUICK_START = [
  { title: 'Write today down', text: 'Open the Tasks page and add what actually has to happen today.' },
  { title: 'Start a session', text: 'Go to Focus and press play. The default session runs 25 minutes.' },
  { title: 'Take the break', text: 'When the timer ends, leave the screen. Five minutes away is the point of the method.' },
  { title: 'Check the week', text: 'The home screen adds up tasks finished, focus minutes and sessions.' },
];

/** A card title with its small round icon. */
function IconTitle({ icon: Icon, children, id }) {
  return (
    <CardTitle id={id} className="flex items-center gap-3">
      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-[18px] w-[18px] text-primary-strong" />
      </span>
      {children}
    </CardTitle>
  );
}

// Privacy and Terms used to be tabs here, held in useState, which kept them
// out of the DOM (and out of every crawler) unless clicked. They are real
// routes now (/privacy, /terms), linked in the header.
function Help() {
  usePageMeta(ROUTE_META['/help']);

  const faqs = [
    {
      question: "How does the Pomodoro timer work?",
      answer: "The Pomodoro Technique is a time management method that breaks work into focused intervals. In Zephyr, you work for 25 minutes (a 'pomodoro'), then take a 5-minute break. After completing 4 pomodoros, you get a longer 15-minute break. The cycle keeps breaks regular through long stretches of work, and the timer logs each session.",
      icon: Timer,
      iconColor: "text-primary-strong",
      bgColor: "bg-primary/10"
    },
    {
      question: "Can I customize timer durations?",
      answer: "Yes. Zephyr ships presets for Pomodoro, Short Focus, Deep Work and Meditation, and you can add your own with whatever work, short break and long break durations you want. On the Focus page, pick a preset from the list on the right; hover one to rename or retime it, or use the New preset button to add another.",
      icon: Settings,
      iconColor: "text-primary-strong",
      bgColor: "bg-primary/10"
    },
    {
      question: "Can I drive Zephyr from the keyboard?",
      answer: "Almost entirely. Ctrl+K (Cmd+K on a Mac) opens the command palette, which searches your tasks and runs any command: new task, start a focus session, switch theme, export a backup. Single keys work whenever you are not typing in a field. N adds a task, T switches theme, G then T or F jumps between pages, and ? opens the full list below.",
      icon: Command,
      iconColor: "text-primary-strong",
      bgColor: "bg-primary/10"
    },
    {
      question: "How do I track my progress?",
      answer: "The dashboard adds up your week: open and overdue tasks, focus time, recent sessions and how much of your list is done. The timer keeps a daily streak.",
      icon: FileText,
      iconColor: "text-primary-strong",
      bgColor: "bg-primary/10"
    },
    {
      question: "Does Zephyr work offline?",
      answer: "Yes. Zephyr is a Progressive Web App (PWA) that works offline. Your tasks and timer sessions are stored on your own device in browser storage, so no feature needs an internet connection.",
      icon: WifiOff,
      iconColor: "text-primary-strong",
      bgColor: "bg-primary/10"
    },
    {
      question: "Is my data backed up?",
      answer: "Not automatically. Everything lives in your browser, and nobody else can see it. Settings > Data > Export saves a backup file; Import restores it on any device. Clearing your browser's site data removes everything, so export first if it matters.",
      icon: Cloud,
      iconColor: "text-primary-strong",
      bgColor: "bg-primary/10"
    },
    {
      question: "How do I clear all my data?",
      answer: "Settings > Data > Delete all data. It asks first, and it can't be undone. Export a backup before if you want to keep anything.",
      icon: Trash2,
      iconColor: "text-destructive-strong",
      bgColor: "bg-destructive/10"
    }
  ];

  const legalLinks = [
    { to: '/privacy', label: 'Privacy Policy', icon: Shield },
    { to: '/terms', label: 'Terms of Service', icon: FileText },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Help"
        actions={legalLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-foreground/15 bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:border-foreground/30 hover:bg-accent"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{link.label}</span>
              <span className="sm:hidden">{link.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      />

      <div className="grid grid-cols-1 gap-(--panel-gap) xl:grid-cols-5">
        {/* Quick start */}
        <NightSurface className="animate-fade-in-up p-6 pb-32 xl:col-span-2" style={{ animationDelay: '0.1s' }}>
          <h2 className="flex items-center gap-3 text-[17px] font-semibold tracking-[-0.015em]">
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
              <Zap className="h-[18px] w-[18px] text-primary" />
            </span>
            Quick start
          </h2>
          <ol className="mt-6 space-y-5">
            {QUICK_START.map((step, index) => (
              <li key={step.title} className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground tabular-nums">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-hero-foreground">{step.title}</h3>
                  <p className="mt-0.5 text-[13px] text-hero-foreground/75">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </NightSurface>

        {/* FAQ */}
        <Card className="animate-fade-in-up p-6 xl:col-span-3" style={{ animationDelay: '0.2s' }}>
          <IconTitle icon={HelpCircle}>Questions</IconTitle>
          <Accordion type="single" className="-mx-3 mt-4 w-auto space-y-1">
            {faqs.map((faq, index) => {
              const Icon = faq.icon;
              return (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="rounded-2xl border-0 bg-transparent shadow-none"
                >
                  <AccordionTrigger
                    value={`faq-${index}`}
                    className="group gap-3 rounded-2xl px-3 py-3 hover:bg-accent/60 hover:no-underline"
                  >
                    <div className="flex w-full items-center gap-3 text-left">
                      <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${faq.bgColor}`}>
                        <Icon className={`h-4 w-4 ${faq.iconColor}`} />
                      </span>
                      <h3 className="min-w-0 wrap-break-word text-[15px] font-semibold leading-snug text-foreground">
                        {faq.question}
                      </h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent value={`faq-${index}`} className="px-3 pb-4 sm:pl-15">
                    <p className="max-w-[70ch] wrap-break-word pt-1 text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </Card>

        {/* Keyboard shortcuts */}
        <Card className="animate-fade-in-up p-6 xl:col-span-5" style={{ animationDelay: '0.15s' }}>
          <IconTitle icon={Keyboard}>Keyboard shortcuts</IconTitle>
          <div className="mt-5">
            <ShortcutTable />
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

export default Help;
