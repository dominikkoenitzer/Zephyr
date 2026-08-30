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
                Zephyr is designed with privacy in mind. All data is stored locally on your device using browser localStorage.
                We do not collect, transmit, or store any personal information on our servers. The application operates entirely
                offline and processes all data locally.
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
                Since all data is stored locally, you have complete control over your information. We recommend:
              </p>
              <ul className="list-disc ml-6 space-y-1 mb-4">
                <li>Keeping your device secure with passwords or biometric authentication</li>
                <li>Regularly backing up important data if needed</li>
                <li>Clearing browser data if using a shared device</li>
              </ul>

              <h2 className="font-semibold text-foreground text-base mb-2">4. Third-Party Services</h2>
              <p className="mb-4">
                Zephyr uses Vercel Analytics, a privacy-focused analytics service provided by Vercel, Inc. This service
                collects anonymous, aggregated usage statistics to help improve the application. No personal data or user
                content is shared with Vercel Analytics. The application is otherwise a standalone Progressive Web App (PWA)
                that functions primarily within your browser.
              </p>

              <h2 className="font-semibold text-foreground text-base mb-2">5. Cookies and Tracking</h2>
              <p className="mb-4">
                Zephyr uses Vercel Analytics to collect anonymous usage statistics. This service collects aggregated,
                non-personally identifiable information about how the application is used, such as page views and performance metrics.
                No personal data, user content, or identifiable information is collected. Vercel Analytics operates in compliance
                with privacy regulations and does not use cookies or track individual users across sites.
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
