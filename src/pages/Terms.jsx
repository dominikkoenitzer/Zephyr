import { Card } from '../components/ui/card';
import { FileText, Scale, AlertCircle } from 'lucide-react';
import PageHeader from '../components/Layout/PageHeader';
import PageContainer from '../components/Layout/PageContainer';
import { usePageMeta } from '../hooks/usePageMeta';
import { ROUTE_META } from '../routes/meta';

// Lived as two tabs (Terms, Legal) inside Help, which kept them out of the
// DOM unless clicked. A trust page needs its own URL, so both live here.
function Terms() {
  usePageMeta(ROUTE_META['/terms']);

  return (
    <PageContainer>
      <PageHeader
        title="Terms of Service"
        description="The terms for using Zephyr, and the legal notices"
      />

      <div className="grid grid-cols-1 items-start gap-(--panel-gap) xl:grid-cols-5">
        <Card className="p-6 sm:p-8 xl:col-span-3">
          <h2 className="flex items-center gap-3 text-[17px] font-semibold leading-tight tracking-[-0.015em] text-foreground">
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-[18px] w-[18px] text-primary-strong" />
            </span>
            Terms of Service
          </h2>
          <div className="mt-5 max-w-[70ch] text-[15px] leading-relaxed text-muted-foreground">
            <p className="inline-flex rounded-full bg-accent px-2.5 py-0.5 text-[12px] font-semibold text-foreground">Last updated: August 30, 2026</p>

            <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">1. Acceptance of Terms</h3>
            <p className="mb-4">
              By accessing and using Zephyr, you accept and agree to be bound by the terms and provision of this agreement.
              If you do not agree to these terms, please do not use this application.
            </p>

            <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">2. License</h3>
            <p className="mb-4">
              Zephyr&apos;s source code is open source under the <a href="https://github.com/dominikkoenitzer/Zephyr/blob/main/LICENSE" className="font-semibold text-primary-strong underline underline-offset-4">MIT License</a>,
              which lets you use, copy, and modify it under that license&apos;s terms. The hosted application at
              zephyr.punds.ch is provided free of charge for personal use.
            </p>

            <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">3. Disclaimer</h3>
            <p className="mb-4">
              The materials in Zephyr are provided on an &apos;as is&apos; basis. Zephyr makes no warranties, expressed or implied,
              and hereby disclaims and negates all other warranties including, without limitation, implied warranties or
              conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property
              or other violation of rights.
            </p>

            <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">4. Limitations</h3>
            <p className="mb-4">
              In no event shall Zephyr or its suppliers be liable for any damages (including, without limitation, damages for
              loss of data or profit, or due to business interruption) arising out of the use or inability to use Zephyr,
              even if Zephyr or a Zephyr authorized representative has been notified orally or in writing of the possibility
              of such damage.
            </p>

            <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">5. Data Responsibility</h3>
            <p className="mb-4">
              You are solely responsible for backing up your data. Zephyr stores all data locally on your device, and we
              are not responsible for any data loss resulting from device failure, browser issues, or user actions such as
              clearing browser data.
            </p>

            <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">6. Accuracy of Materials</h3>
            <p className="mb-4">
              The materials appearing in Zephyr could include technical, typographical, or photographic errors. Zephyr does
              not warrant that any of the materials on its application are accurate, complete, or current.
            </p>

            <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">7. Modifications</h3>
            <p className="mb-4">
              Zephyr may revise these terms of service at any time without notice. By using this application you are agreeing
              to be bound by the then current version of these terms of service.
            </p>

            <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">8. Prohibited Uses</h3>
            <p className="mb-2">You may not use Zephyr:</p>
            <ul className="mb-4 list-disc space-y-1 pl-5 marker:text-primary">
              <li>In any way that violates any applicable law or regulation</li>
              <li>To transmit any malicious code or viruses</li>
              <li>To attempt to gain unauthorized access to any systems</li>
              <li>In any manner that could damage, disable, or impair the application</li>
            </ul>

            <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">9. Termination</h3>
            <p className="mb-4">
              We reserve the right to terminate or suspend access to Zephyr immediately, without prior notice or liability,
              for any reason whatsoever, including without limitation if you breach the Terms.
            </p>

            <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">10. Governing Law</h3>
            <p className="mb-4">
              These terms and conditions are governed by and construed in accordance with applicable laws. Any disputes
              relating to these terms shall be subject to the exclusive jurisdiction of the courts in the applicable jurisdiction.
            </p>

            <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">11. Contact Information</h3>
            <p>
              For questions about these Terms of Service, please contact us at: <a href="https://github.com/dominikkoenitzer/Zephyr/issues" className="font-semibold text-primary-strong underline underline-offset-4">GitHub</a>
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-(--panel-gap) xl:col-span-2">
          <Card className="p-6 sm:p-8">
            <h2 className="flex items-center gap-3 text-[17px] font-semibold leading-tight tracking-[-0.015em] text-foreground">
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Scale className="h-[18px] w-[18px] text-primary-strong" />
              </span>
              Legal Information
            </h2>
            <div className="mt-5 max-w-[70ch] text-[15px] leading-relaxed text-muted-foreground">
              <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">Copyright Notice</h3>
              <p className="mb-4">
                © 2026 Zephyr. The Zephyr application, including its design,
                functionality, and content, is protected by copyright laws and released under the MIT License.
              </p>

              <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">Intellectual Property</h3>
              <p className="mb-4">
                All trademarks, service marks, trade names, logos, and other intellectual property displayed in Zephyr are
                the property of their respective owners. Unauthorized use of any intellectual property is prohibited.
              </p>

              <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">Open Source Components</h3>
              <p className="mb-4">
                Zephyr uses open source software components. These components are subject to their respective licenses,
                listed in the repository&apos;s package.json.
              </p>

              <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">Disclaimer of Warranties</h3>
              <p className="mb-4">
                ZEPHYR IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
                INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                AND NON-INFRINGEMENT.
              </p>

              <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">Limitation of Liability</h3>
              <p className="mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ZEPHYR SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR
                INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>

              <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">Indemnification</h3>
              <p className="mb-4">
                You agree to indemnify and hold harmless Zephyr and its operators from any claims, damages, losses, liabilities,
                and expenses (including legal fees) arising out of or relating to your use of the application or violation of
                these terms.
              </p>

              <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">Severability</h3>
              <p className="mb-4">
                If any provision of these legal terms is found to be unenforceable or invalid, that provision shall be limited
                or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
              </p>

              <h3 className="mb-2 mt-7 text-[15px] font-semibold text-foreground first:mt-0">Contact Information</h3>
              <p>
                For legal inquiries or questions about these terms, please contact us at: <a href="https://github.com/dominikkoenitzer/Zephyr/issues" className="font-semibold text-primary-strong underline underline-offset-4">GitHub</a>
              </p>
            </div>
          </Card>

          <section className="rounded-3xl bg-primary/10 p-6" aria-labelledby="terms-notice">
            <h2 id="terms-notice" className="flex items-center gap-3 text-[17px] font-semibold leading-tight tracking-[-0.015em] text-foreground">
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card shadow-(--shadow-sm)">
                <AlertCircle className="h-[18px] w-[18px] text-primary-strong" />
              </span>
              Important Notice
            </h2>
            <p className="mt-3 max-w-[70ch] text-[15px] leading-relaxed text-foreground/80">
              This application stores all data locally on your device. We cannot see it, and we cannot recover it once it
              is gone. Export a backup from Settings if the data matters to you.
            </p>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}

export default Terms;
