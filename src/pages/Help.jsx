import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { HelpCircle, Zap, Shield, FileText, Scale, Mail, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

function Help() {
  const [activeSection, setActiveSection] = useState('help');

  const faqs = [
    {
      question: "How does the Pomodoro timer work?",
      answer: "The Pomodoro technique uses 25-minute focus sessions followed by 5-minute breaks. After 4 sessions, take a longer 15-minute break. This rhythm helps maintain peak productivity while preventing burnout."
    },
    {
      question: "Can I customize timer durations?",
      answer: "Absolutely! Click the settings icon on the Focus Timer page to adjust work sessions, short breaks, and long breaks to fit your personal rhythm."
    },
    {
      question: "How do I track my progress?",
      answer: "Your Dashboard displays real-time stats including focus time, completed pomodoros, and task completion rates. All data is saved locally on your device."
    },
    {
      question: "Does Zephyr work offline?",
      answer: "Yes! Zephyr is a Progressive Web App (PWA) that works completely offline. All your data is stored securely on your device."
    },
    {
      question: "How do I clear all my data?",
      answer: "You can clear all local storage data from the Settings page. Navigate to Settings > Data Management and click 'Clear All Local Storage'. This action cannot be undone and will reload the page."
    },
    {
      question: "Is my data backed up?",
      answer: "Currently, all data is stored locally on your device. We recommend regularly exporting important data if needed. Cloud sync features may be available in future updates."
    }
  ];

  const sections = [
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
    { id: 'terms', label: 'Terms of Service', icon: FileText },
    { id: 'legal', label: 'Legal', icon: Scale },
  ];

  return (
    <div className="container mx-auto max-w-6xl space-y-8 py-8 px-4">
      <div className="space-y-4 animate-fade-in-up">
        <h1 className="text-5xl font-bold text-foreground">
          Help & Support
        </h1>
        <p className="text-muted-foreground text-lg">
          Everything you need to master Zephyr
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border/50 pb-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Button
              key={section.id}
              variant={activeSection === section.id ? 'default' : 'ghost'}
              onClick={() => setActiveSection(section.id)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {section.label}
            </Button>
          );
        })}
      </div>

      {/* Quick Start Card */}
      <Card className="glass-card border-none animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">1</div>
              <div>
                <h4 className="font-semibold text-foreground">Set Your Priorities</h4>
                <p className="text-sm text-muted-foreground">Head to the Tasks page and add what you want to accomplish today.</p>
              </div>
            </div>
            
            <div className="flex gap-3 items-start">
              <div className="bg-primary text-white rounded w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">2</div>
              <div>
                <h4 className="font-semibold text-foreground">Start a Focus Session</h4>
                <p className="text-sm text-muted-foreground">Click the Focus Timer and press play to begin your first 25-minute session.</p>
              </div>
            </div>
            
            <div className="flex gap-3 items-start">
              <div className="bg-primary text-white rounded w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">3</div>
              <div>
                <h4 className="font-semibold text-foreground">Take Breaks</h4>
                <p className="text-sm text-muted-foreground">When the timer completes, enjoy your well-earned break. Stretch, hydrate, breathe!</p>
              </div>
            </div>
            
            <div className="flex gap-3 items-start">
              <div className="bg-primary text-white rounded w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">4</div>
              <div>
                <h4 className="font-semibold text-foreground">Track Your Progress</h4>
                <p className="text-sm text-muted-foreground">Check your Dashboard to see your productivity stats.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Card */}
      <Card className="glass-card border-none animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="p-4 bg-background/50 rounded-xl">
              <h4 className="font-semibold text-foreground mb-2">{faq.question}</h4>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}

export default Help;
