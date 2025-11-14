import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { HelpCircle, Lightbulb, Zap } from 'lucide-react';

function Help() {
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
    }
  ];

  const tips = [
    "Start your day by reviewing your priorities on the Dashboard",
    "Use the Focus Timer to tackle your most important task first",
    "Take breaks seriously - they're essential for sustained productivity",
    "Celebrate small wins - every completed task counts!",
    "Enable notifications to stay on track with your sessions"
  ];

  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-8">
      <div className="space-y-4 animate-fade-in-up">
        <h1 className="text-5xl font-bold text-foreground">
          Help & Support
        </h1>
        <p className="text-muted-foreground text-lg">
          Everything you need to master Zephyr
        </p>
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
                <p className="text-sm text-muted-foreground">Check your Dashboard to see your growing streak and productivity stats.</p>
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

      {/* Productivity Tips Card */}
      <Card className="glass-card border-none animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Productivity Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-primary mt-0.5">✓</span>
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

    </div>
  );
}

export default Help;
