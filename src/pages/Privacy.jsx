import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Shield } from 'lucide-react';
import PageHeader from '../components/Layout/PageHeader';
import PageContainer from '../components/Layout/PageContainer';
import { usePageMeta } from '../hooks/usePageMeta';
import { ROUTE_META } from '../routes/meta';

// Lived as a tab inside Help, which kept it out of the DOM (and out of every
// crawler) unless the tab was clicked. A trust page needs its own URL.
function Privacy() {
  usePageMeta(ROUTE_META['/privacy']);

  return (
    <PageContainer>
      <PageHeader
        title="Privacy Policy"
        description="What Zephyr stores, where it lives, and who can see it"
      />

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 sm:space-y-4">
        <Card className="">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Privacy Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 text-xs sm:text-sm text-muted-foreground">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">Last updated: August 30, 2026</p>

              <h2 className="font-semibold text-foreground text-base mb-2">1. Information We Collect</h2>
              <p className="mb-4">
                Zephyr keeps what you write on your own device. Every task, focus session and setting is saved to your
                browser&apos;s localStorage and processed there. We do not collect, transmit or store personal information
                on a server, because there is no server behind the app.
              </p>

              <h2 className="font-semibold text-foreground text-base mb-2">2. Local Data Storage</h2>
              <p className="mb-4">
                All your tasks, timer sessions, and settings are stored exclusively
                on your device. This includes:
              </p>
              <ul className="list-disc ml-6 space-y-1 mb-4">
                <li>Task lists</li>
                <li>Focus timer sessions and presets</li>
                <li>Application settings and preferences</li>
                <li>Notification history</li>
              </ul>

              <h2 className="font-semibold text-foreground text-base mb-2">3. Data Security</h2>
              <p className="mb-4">
                Because the data sits in your browser, it is only as protected as the device holding it. Worth doing:
              </p>
              <ul className="list-disc ml-6 space-y-1 mb-4">
                <li>Lock the device with a password or biometrics</li>
                <li>Export a backup from Settings if the data matters to you</li>
                <li>Clear the browser data when you are on a shared device</li>
              </ul>

              <h2 className="font-semibold text-foreground text-base mb-2">4. Third-Party Services</h2>
              <p className="mb-4">
                One service is in use: Vercel Analytics, run by Vercel, Inc., which counts page views and performance
                figures in aggregate. Your tasks, sessions and settings are never sent to it. Apart from that request,
                Zephyr is a self-contained Progressive Web App (PWA) running in your browser.
              </p>

              <h2 className="font-semibold text-foreground text-base mb-2">5. Cookies and Tracking</h2>
              <p className="mb-4">
                Zephyr sets no cookies of its own, and Vercel Analytics does not set any either. It records no identifier
                for you and cannot follow you to other sites; what it reports is a count, not a person.
              </p>

              <h2 className="font-semibold text-foreground text-base mb-2">6. Data Deletion</h2>
              <p className="mb-4">
                You can delete all your data at any time by using the &quot;Clear All Local Storage&quot; feature in Settings.
                This action permanently removes all stored data and cannot be undone.
              </p>

              <h2 className="font-semibold text-foreground text-base mb-2">7. Children&apos;s Privacy</h2>
              <p className="mb-4">
                Zephyr is not intended for children under 13 years of age. We do not knowingly collect information from children.
              </p>

              <h2 className="font-semibold text-foreground text-base mb-2">8. Changes to This Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. Any changes will be reflected in this document with an
                updated &quot;Last updated&quot; date.
              </p>

              <h2 className="font-semibold text-foreground text-base mb-2">9. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at: <a href="mailto:dominikkoenitzer@users.noreply.github.com" className="text-primary hover:underline">dominikkoenitzer@users.noreply.github.com</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export default Privacy;
