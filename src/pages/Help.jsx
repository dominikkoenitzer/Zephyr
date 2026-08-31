import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { HelpCircle, Zap, Shield, FileText, Timer, Settings, WifiOff, Trash2, Cloud, Keyboard, Command } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import ShortcutTable from '../components/Shortcuts/ShortcutTable';
import PageHeader from '../components/Layout/PageHeader';
import PageContainer from '../components/Layout/PageContainer';
import { usePageMeta } from '../hooks/usePageMeta';
import { ROUTE_META } from '../routes/meta';

// Privacy and Terms used to be tabs here, held in useState, which kept them
// out of the DOM (and out of every crawler) unless clicked. They are real
// routes now (/privacy, /terms), linked below the header.
function Help() {
  usePageMeta(ROUTE_META['/help']);

  const faqs = [
    {
      question: "How does the Pomodoro timer work?",
      answer: "The Pomodoro Technique is a time management method that breaks work into focused intervals. In Zephyr, you work for 25 minutes (a 'pomodoro'), then take a 5-minute break. After completing 4 pomodoros, you get a longer 15-minute break. The cycle keeps breaks regular through long stretches of work, and the timer logs each session.",
      icon: Timer,
      iconColor: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      question: "Can I customize timer durations?",
      answer: "Yes. Zephyr ships presets for Pomodoro, Short Focus, Deep Work and Meditation, and you can add your own with whatever work, short break and long break durations you want. On the Focus page, pick a preset from the list on the right; hover one to rename or retime it, or use the New preset button to add another.",
      icon: Settings,
      iconColor: "text-primary",
      bgColor: "bg-accent/60"
    },
    {
      question: "Can I drive Zephyr from the keyboard?",
      answer: "Almost entirely. Ctrl+K (Cmd+K on a Mac) opens the command palette, which searches your tasks and runs any command: new task, start a focus session, switch theme, export a backup. Single keys work whenever you are not typing in a field. N adds a task, T switches theme, G then T or F jumps between pages, and ? opens the full list below.",
      icon: Command,
      iconColor: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      question: "How do I track my progress?",
      answer: "Zephyr tracks your focus sessions and your completed tasks. The home screen adds up the week: active tasks, tasks finished, focus minutes and sessions. The timer keeps a daily streak alongside that, and everything is saved as it happens.",
      icon: FileText,
      iconColor: "text-primary",
      bgColor: "bg-accent/50"
    },
    {
      question: "Does Zephyr work offline?",
      answer: "Yes. Zephyr is a Progressive Web App (PWA) that works offline. Your tasks and timer sessions are stored on your own device in browser storage, so no feature needs an internet connection.",
      icon: WifiOff,
      iconColor: "text-primary",
      bgColor: "bg-accent/60"
    },
    {
      question: "Is my data backed up?",
      answer: "Zephyr stores all data locally on your device. We cannot see it, and there is no automatic cloud backup. You can download a full backup anytime from Settings > Data Management > Export data, and restore it on any device with Import backup. Clearing your browser's site data will remove everything, so export a backup first if your data matters.",
      icon: Cloud,
      iconColor: "text-primary",
      bgColor: "bg-accent/60"
    },
    {
      question: "How do I clear all my data?",
      answer: "To clear all your data, go to Settings > Data Management. Click the 'Clear All Local Storage' button. You'll be asked to confirm this action as it permanently deletes all tasks, timer sessions, settings, and preferences. This action cannot be undone and will reload the page. Export a backup first (Settings > Data Management > Export data) if you want to keep anything.",
      icon: Trash2,
      iconColor: "text-destructive",
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
        title="Help & Support"
        description="How Zephyr works, from shortcuts to backups"
      />

      {/* Trust pages, each on its own route */}
      <div className="shrink-0 flex flex-wrap gap-1.5 sm:gap-2 border-b border-border/50 pb-2 sm:pb-3 overflow-x-auto mb-2 sm:mb-3">
        {legalLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-border/60 h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{link.label}</span>
              <span className="sm:hidden">{link.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 sm:space-y-3 md:space-y-4 pr-1">
          {/* Quick Start Card */}
          <Card className=" animate-fade-in-up shrink-0" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Quick start
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="bg-primary text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-bold shrink-0 text-base sm:text-lg">1</div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Write today down</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Open the Tasks page and add what actually has to happen today.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="bg-primary text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-bold shrink-0 text-base sm:text-lg">2</div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Start a session</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Go to Focus and press play. The default session runs 25 minutes.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="bg-primary text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-bold shrink-0 text-base sm:text-lg">3</div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Take the break</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">When the timer ends, leave the screen. Five minutes away is the point of the method.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="bg-primary text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-bold shrink-0 text-base sm:text-lg">4</div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Check the week</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">The home screen adds up tasks finished, focus minutes and sessions.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Keyboard shortcuts */}
          <Card className=" animate-fade-in-up shrink-0" style={{ animationDelay: '0.15s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Keyboard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Keyboard shortcuts
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                Single keys work whenever you are not typing in a field. Press ? anywhere to see this list.
              </p>
            </CardHeader>
            <CardContent>
              <ShortcutTable />
            </CardContent>
          </Card>

          {/* FAQ Card */}
          <Card className=" animate-fade-in-up w-full shrink-0" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-2 sm:pb-3 md:pb-4 shrink-0">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg lg:text-xl">
                <div className="p-1.5 sm:p-2 md:p-2.5 rounded-lg bg-primary/10">
                  <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <span className="wrap-break-word">Frequently Asked Questions</span>
              </CardTitle>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 sm:mt-2">
                Answers about storage, offline use and backups
              </p>
            </CardHeader>
            <CardContent className="pr-1 sm:pr-2">
              <Accordion type="single" className="space-y-2 sm:space-y-3 md:space-y-4 w-full">
                {faqs.map((faq, index) => {
                  const Icon = faq.icon;
                  return (
                    <AccordionItem key={index} value={`faq-${index}`} className="border border-border/60 rounded-lg sm:rounded-xl bg-background/80 hover:border-primary/30 transition-all duration-200 hover:shadow-md overflow-hidden w-full">
                      <AccordionTrigger 
                        value={`faq-${index}`}
                        className="px-2 sm:px-3 md:px-4 lg:px-5 py-2.5 sm:py-3 md:py-4 lg:py-5 hover:no-underline group"
                      >
                        <div className="flex items-start gap-2 sm:gap-3 md:gap-4 w-full text-left">
                          <div className={`p-1.5 sm:p-2 md:p-2.5 lg:p-3 rounded-lg ${faq.bgColor} group-hover:scale-110 transition-transform duration-200 shrink-0`}>
                            <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 ${faq.iconColor} transition-colors duration-200`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-xs sm:text-sm md:text-base text-foreground group-hover:text-primary transition-colors duration-200 pr-1 sm:pr-2 wrap-break-word leading-tight sm:leading-normal">
                              {faq.question}
                            </h3>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent value={`faq-${index}`} className="px-2 sm:px-3 md:px-4 lg:px-5 pb-2.5 sm:pb-3 md:pb-4 lg:pb-5">
                        <div className="pl-0 sm:pl-10 md:pl-12 lg:pl-14">
                          <div className="pt-2 border-t border-border/30">
                            <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed pt-2 sm:pt-3 wrap-break-word">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>
    </PageContainer>
  );
}

export default Help;
