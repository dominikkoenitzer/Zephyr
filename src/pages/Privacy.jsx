import { Card } from '../components/ui/card';
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
      />

      <div className="grid grid-cols-1 gap-(--panel-gap)">
        <Card className="p-6 sm:p-8">
          <div className="max-w-[70ch] text-[15px] leading-relaxed text-muted-foreground">
            <p className="inline-flex rounded-full bg-accent px-2.5 py-0.5 text-[12px] font-semibold text-foreground">Last updated: August 30, 2026</p>

            <h2 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">1. Information We Collect</h2>
            <p className="mb-4">
              Zephyr keeps what you write on your own device. Every task, focus session and setting is saved to your
              browser&apos;s localStorage and processed there. We do not collect, transmit or store personal information
              on a server, because there is no server behind the app.
            </p>

            <h2 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">2. Local Data Storage</h2>
            <p className="mb-4">
              All your tasks, timer sessions, and settings are stored exclusively
              on your device. This includes:
            </p>
            <ul className="mb-4 list-disc space-y-1 pl-5 marker:text-primary">
              <li>Task lists</li>
              <li>Focus timer sessions and presets</li>
              <li>Application settings and preferences</li>
              <li>Notification history</li>
            </ul>

            <h2 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">3. Data Security</h2>
            <p className="mb-4">
              Because the data sits in your browser, it is only as protected as the device holding it. Worth doing:
            </p>
            <ul className="mb-4 list-disc space-y-1 pl-5 marker:text-primary">
              <li>Lock the device with a password or biometrics</li>
              <li>Export a backup from Settings if the data matters to you</li>
              <li>Clear the browser data when you are on a shared device</li>
            </ul>

            <h2 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">4. Third-Party Services</h2>
            <p className="mb-4">
              One service is in use: Vercel Analytics, run by Vercel, Inc., which counts page views and performance
              figures in aggregate. Your tasks, sessions and settings are never sent to it. Apart from that request,
              Zephyr is a self-contained Progressive Web App (PWA) running in your browser.
            </p>

            <h2 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">5. Cookies and Tracking</h2>
            <p className="mb-4">
              Zephyr sets no cookies of its own, and Vercel Analytics does not set any either. It records no identifier
              for you and cannot follow you to other sites; what it reports is a count, not a person.
            </p>

            <h2 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">6. Data Deletion</h2>
            <p className="mb-4">
              You can delete all your data at any time with &quot;Delete all data&quot; in Settings.
              This action permanently removes all stored data and cannot be undone.
            </p>

            <h2 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">7. Children&apos;s Privacy</h2>
            <p className="mb-4">
              Zephyr is not intended for children under 13 years of age. We do not knowingly collect information from children.
            </p>

            <h2 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">8. Changes to This Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. Any changes will be reflected in this document with an
              updated &quot;Last updated&quot; date.
            </p>

            <h2 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">9. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at: <a href="https://github.com/dominikkoenitzer/Zephyr/issues" className="font-semibold text-primary-strong underline underline-offset-4">GitHub</a>
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

export default Privacy;
