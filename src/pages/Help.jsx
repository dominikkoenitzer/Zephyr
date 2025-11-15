import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { HelpCircle, Zap, Shield, FileText, Scale, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';

function Help() {
  const [activeSection, setActiveSection] = useState('help');

  const faqs = [
    {
      question: "How does the Pomodoro timer work?",
      answer: "The Pomodoro Technique is a time management method that breaks work into focused intervals. In Zephyr, you work for 25 minutes (a 'pomodoro'), then take a 5-minute break. After completing 4 pomodoros, you get a longer 15-minute break. This cycle helps maintain focus, prevent burnout, and boost productivity. The timer automatically tracks your sessions and you can view your progress on the Dashboard."
    },
    {
      question: "Can I customize timer durations?",
      answer: "Yes! Zephyr offers multiple timer presets including Pomodoro, Deep Work, and Meditation. You can also create custom presets with your preferred work session, short break, and long break durations. Simply click the settings icon (⚙️) on the Focus Timer page to access preset options and create your own custom timer configuration that fits your workflow."
    },
    {
      question: "How do I track my progress?",
      answer: "Your Dashboard provides comprehensive progress tracking. It shows your daily focus time, completed pomodoros, active and completed tasks, and completion rates. You'll also see a weekly focus time chart and upcoming tasks/events. All progress is automatically saved and displayed in real-time. Visit the Dashboard anytime to see your productivity metrics and trends."
    },
    {
      question: "Does Zephyr work offline?",
      answer: "Yes! Zephyr is a Progressive Web App (PWA) designed to work completely offline. All your data—tasks, calendar events, notes, journal entries, and timer sessions—is stored locally on your device using browser storage. You don't need an internet connection to use any features. This ensures your data remains private and accessible even without internet access."
    },
    {
      question: "How do I clear all my data?",
      answer: "To clear all your data, go to Settings > Data Management. Click the 'Clear All Local Storage' button. You'll be asked to confirm this action as it permanently deletes all tasks, events, notes, journal entries, timer sessions, settings, and preferences. This action cannot be undone and will reload the page. Make sure to export any important data before clearing if needed."
    },
    {
      question: "Is my data backed up?",
      answer: "Zephyr stores all data locally on your device—we don't have access to your data. Currently, there's no automatic cloud backup. To back up your data, you can manually export your notes and journal entries using the Import/Export buttons on those pages. We recommend regularly exporting important information if you want to preserve it. Cloud sync and automatic backup features may be available in future updates."
    }
  ];

  const sections = [
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
    { id: 'terms', label: 'Terms of Service', icon: FileText },
    { id: 'legal', label: 'Legal', icon: Scale },
  ];

  return (
    <div className="w-full h-full lg:max-h-full lg:h-full border-2 border-border rounded-xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 bg-card lg:overflow-hidden overflow-y-auto lg:overflow-y-hidden flex flex-col min-h-0">
      <div className="flex-shrink-0 space-y-2 sm:space-y-3 mb-2 sm:mb-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
          Help & Support
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          Everything you need to master Zephyr
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex-shrink-0 flex flex-wrap gap-1.5 sm:gap-2 border-b border-border/50 pb-2 sm:pb-3 overflow-x-auto mb-2 sm:mb-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Button
              key={section.id}
              variant={activeSection === section.id ? 'default' : 'ghost'}
              onClick={() => setActiveSection(section.id)}
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{section.label}</span>
              <span className="sm:hidden">{section.label.split(' ')[0]}</span>
            </Button>
          );
        })}
      </div>

      {/* Help & Support Section */}
      {activeSection === 'help' && (
        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-y-hidden space-y-3 sm:space-y-4">
          {/* Quick Start Card */}
          <Card className="glass-card border-none animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Quick Start Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="bg-primary text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-bold flex-shrink-0 text-base sm:text-lg">1</div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Set Your Priorities</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Head to the Tasks page and add what you want to accomplish today.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="bg-primary text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-bold flex-shrink-0 text-base sm:text-lg">2</div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Start a Focus Session</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Click the Focus Timer and press play to begin your first 25-minute session.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="bg-primary text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-bold flex-shrink-0 text-base sm:text-lg">3</div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Take Breaks</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">When the timer completes, enjoy your well-earned break. Stretch, hydrate, breathe!</p>
                  </div>
                </div>
                
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="bg-primary text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-bold flex-shrink-0 text-base sm:text-lg">4</div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Track Your Progress</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Check your Dashboard to see your productivity stats.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Card */}
          <Card className="glass-card border-none animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" className="space-y-2 sm:space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger value={`faq-${index}`}>
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent value={`faq-${index}`}>
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Privacy Policy Section */}
      {activeSection === 'privacy' && (
        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-y-hidden">
          <Card className="glass-card border-none h-full">
            <CardHeader className="flex-shrink-0 pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-muted-foreground">
            <div>
              <p className="text-xs text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>
              
              <h3 className="font-semibold text-foreground text-base mb-2">1. Information We Collect</h3>
              <p className="mb-4">
                Zephyr is designed with privacy in mind. All data is stored locally on your device using browser localStorage. 
                We do not collect, transmit, or store any personal information on our servers. The application operates entirely 
                offline and processes all data locally.
              </p>

              <h3 className="font-semibold text-foreground text-base mb-2">2. Local Data Storage</h3>
              <p className="mb-4">
                All your tasks, calendar events, notes, journal entries, timer sessions, and settings are stored exclusively 
                on your device. This includes:
              </p>
              <ul className="list-disc ml-6 space-y-1 mb-4">
                <li>Task lists and task folders</li>
                <li>Calendar events and reminders</li>
                <li>Notes and journal entries</li>
                <li>Focus timer sessions and presets</li>
                <li>Wellness tracking data</li>
                <li>Application settings and preferences</li>
                <li>Notification history</li>
              </ul>

              <h3 className="font-semibold text-foreground text-base mb-2">3. Data Security</h3>
              <p className="mb-4">
                Since all data is stored locally, you have complete control over your information. We recommend:
              </p>
              <ul className="list-disc ml-6 space-y-1 mb-4">
                <li>Keeping your device secure with passwords or biometric authentication</li>
                <li>Regularly backing up important data if needed</li>
                <li>Clearing browser data if using a shared device</li>
              </ul>

              <h3 className="font-semibold text-foreground text-base mb-2">4. Third-Party Services</h3>
              <p className="mb-4">
                Zephyr does not integrate with third-party services that collect personal data. The application is a 
                standalone Progressive Web App (PWA) that functions entirely within your browser.
              </p>

              <h3 className="font-semibold text-foreground text-base mb-2">5. Cookies and Tracking</h3>
              <p className="mb-4">
                Zephyr does not use cookies or tracking technologies. We do not track your usage patterns, collect analytics, 
                or monitor your behavior within the application.
              </p>

              <h3 className="font-semibold text-foreground text-base mb-2">6. Data Deletion</h3>
              <p className="mb-4">
                You can delete all your data at any time by using the &quot;Clear All Local Storage&quot; feature in Settings. 
                This action permanently removes all stored data and cannot be undone.
              </p>

              <h3 className="font-semibold text-foreground text-base mb-2">7. Children&apos;s Privacy</h3>
              <p className="mb-4">
                Zephyr is not intended for children under 13 years of age. We do not knowingly collect information from children.
              </p>

              <h3 className="font-semibold text-foreground text-base mb-2">8. Changes to This Policy</h3>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. Any changes will be reflected in this document with an 
                updated &quot;Last updated&quot; date.
              </p>

              <h3 className="font-semibold text-foreground text-base mb-2">9. Contact Us</h3>
              <p>
                If you have questions about this Privacy Policy, please contact us through the Help & Support section.
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Terms of Service Section */}
      {activeSection === 'terms' && (
        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-y-hidden">
          <Card className="glass-card border-none h-full">
            <CardHeader className="flex-shrink-0 pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Terms of Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-muted-foreground">
            <div>
              <p className="text-xs text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>
              
              <h3 className="font-semibold text-foreground text-base mb-2">1. Acceptance of Terms</h3>
              <p className="mb-4">
                By accessing and using Zephyr, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to these terms, please do not use this application.
              </p>

              <h3 className="font-semibold text-foreground text-base mb-2">2. Use License</h3>
              <p className="mb-2">Permission is granted to use Zephyr for personal, non-commercial purposes. Under this license you may not:</p>
              <ul className="list-disc ml-6 space-y-1 mb-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to reverse engineer or decompile the software</li>
                <li>Remove any copyright or proprietary notations</li>
              </ul>

              <h3 className="font-semibold text-foreground text-base mb-2">3. Disclaimer</h3>
              <p className="mb-4">
                The materials in Zephyr are provided on an &apos;as is&apos; basis. Zephyr makes no warranties, expressed or implied, 
                and hereby disclaims and negates all other warranties including, without limitation, implied warranties or 
                conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property 
                or other violation of rights.
              </p>

              <h3 className="font-semibold text-foreground text-base mb-2">4. Limitations</h3>
              <p className="mb-4">
                In no event shall Zephyr or its suppliers be liable for any damages (including, without limitation, damages for 
                loss of data or profit, or due to business interruption) arising out of the use or inability to use Zephyr, 
                even if Zephyr or a Zephyr authorized representative has been notified orally or in writing of the possibility 
                of such damage.
              </p>

              <h3 className="font-semibold text-foreground text-base mb-2">5. Data Responsibility</h3>
              <p className="mb-4">
                You are solely responsible for backing up your data. Zephyr stores all data locally on your device, and we 
                are not responsible for any data loss resulting from device failure, browser issues, or user actions such as 
                clearing browser data.
              </p>

              <h3 className="font-semibold text-foreground text-base mb-2">6. Accuracy of Materials</h3>
              <p className="mb-4">
                The materials appearing in Zephyr could include technical, typographical, or photographic errors. Zephyr does 
                not warrant that any of the materials on its application are accurate, complete, or current.
              </p>

              <h3 className="font-semibold text-foreground text-base mb-2">7. Modifications</h3>
              <p className="mb-4">
                Zephyr may revise these terms of service at any time without notice. By using this application you are agreeing 
                to be bound by the then current version of these terms of service.
              </p>

              <h3 className="font-semibold text-foreground text-base mb-2">8. Prohibited Uses</h3>
              <p className="mb-2">You may not use Zephyr:</p>
              <ul className="list-disc ml-6 space-y-1 mb-4">
                <li>In any way that violates any applicable law or regulation</li>
                <li>To transmit any malicious code or viruses</li>
                <li>To attempt to gain unauthorized access to any systems</li>
                <li>In any manner that could damage, disable, or impair the application</li>
              </ul>

              <h3 className="font-semibold text-foreground text-base mb-2">9. Termination</h3>
              <p className="mb-4">
                We reserve the right to terminate or suspend access to Zephyr immediately, without prior notice or liability, 
                for any reason whatsoever, including without limitation if you breach the Terms.
              </p>

              <h3 className="font-semibold text-foreground text-base mb-2">10. Governing Law</h3>
              <p>
                These terms and conditions are governed by and construed in accordance with applicable laws. Any disputes 
                relating to these terms shall be subject to the exclusive jurisdiction of the courts in the applicable jurisdiction.
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Legal Section */}
      {activeSection === 'legal' && (
        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-y-hidden space-y-3 sm:space-y-4">
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Legal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 text-xs sm:text-sm text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground text-base mb-2">Copyright Notice</h3>
                <p className="mb-4">
                  © {new Date().getFullYear()} Zephyr. All rights reserved. The Zephyr application, including its design, 
                  functionality, and content, is protected by copyright laws.
                </p>

                <h3 className="font-semibold text-foreground text-base mb-2">Intellectual Property</h3>
                <p className="mb-4">
                  All trademarks, service marks, trade names, logos, and other intellectual property displayed in Zephyr are 
                  the property of their respective owners. Unauthorized use of any intellectual property is prohibited.
                </p>

                <h3 className="font-semibold text-foreground text-base mb-2">Open Source Components</h3>
                <p className="mb-4">
                  Zephyr may use open source software components. These components are subject to their respective licenses, 
                  which are available upon request.
                </p>

                <h3 className="font-semibold text-foreground text-base mb-2">Disclaimer of Warranties</h3>
                <p className="mb-4">
                  ZEPHYR IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
                  INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
                  AND NON-INFRINGEMENT.
                </p>

                <h3 className="font-semibold text-foreground text-base mb-2">Limitation of Liability</h3>
                <p className="mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, ZEPHYR SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
                  CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR 
                  INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                </p>

                <h3 className="font-semibold text-foreground text-base mb-2">Indemnification</h3>
                <p className="mb-4">
                  You agree to indemnify and hold harmless Zephyr and its operators from any claims, damages, losses, liabilities, 
                  and expenses (including legal fees) arising out of or relating to your use of the application or violation of 
                  these terms.
                </p>

                <h3 className="font-semibold text-foreground text-base mb-2">Severability</h3>
                <p className="mb-4">
                  If any provision of these legal terms is found to be unenforceable or invalid, that provision shall be limited 
                  or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
                </p>

                <h3 className="font-semibold text-foreground text-base mb-2">Contact Information</h3>
                <p>
                  For legal inquiries or questions about these terms, please contact us through the Help & Support section.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none border-yellow-500/20 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="h-5 w-5" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                This application stores all data locally on your device. We do not have access to your data, and we cannot 
                recover it if it is lost. Please ensure you regularly back up important information if needed.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Help;
