import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Terms of Service — Service Official' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-6 inline-block">← Back to Home</Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: April 11, 2026</p>

        <div className="prose prose-gray max-w-none text-gray-700 space-y-6 text-sm leading-relaxed">

          <h2 className="text-lg font-semibold text-gray-900 mt-8">1. Acceptance of Terms</h2>
          <p>By accessing or using the Service Official platform at serviceofficial.app (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">2. Description of Service</h2>
          <p>Service Official is a contractor management platform that provides tools for customer relationship management, job scheduling and dispatch, estimates, invoices, payments, team management, and customer communication via email and SMS. The Service is designed for contractors in the trades including roofing, electrical, plumbing, HVAC, general contracting, and related industries.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">3. Accounts</h2>
          <p><strong>Contractor Accounts:</strong> You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials and for all activity under your account.</p>
          <p><strong>Customer Portal Accounts:</strong> End-user customers of contractors may be granted portal accounts to view estimates, invoices, and project information. These accounts are managed by the contractor's organization.</p>
          <p>You must be at least 18 years old to create an account.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">4. Free Trial</h2>
          <p>New contractor accounts receive a 14-day free trial with full access to all features. At the end of the trial, you may subscribe to a paid plan to continue using the Service. We will not charge you automatically at the end of the trial.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">5. Payment and Billing</h2>
          <p>Paid subscriptions are billed monthly or annually as selected. Payments are processed securely through Stripe. You agree to provide valid payment information and authorize recurring charges for your subscription plan.</p>
          <p>Subscription fees are non-refundable except as required by law. You may cancel your subscription at any time, and access will continue until the end of the current billing period.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">6. Your Data</h2>
          <p>You retain ownership of all data you enter into the Service, including customer information, project details, estimates, invoices, and communications. We process your data solely to provide the Service as described in our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.</p>
          <p>You are responsible for the accuracy and legality of data you enter. You represent that you have the right to store and process any customer information you enter, including compliance with applicable privacy and communication laws.</p>
          <p><strong>Data Archival:</strong> When you or any user in your organization deletes records (such as jobs, photos, invoices, time entries, or other data), those records are archived rather than permanently removed. Archived data is hidden from your active views but retained in our systems for record-keeping, compliance, dispute resolution, and data integrity purposes. This includes account and organization deletions — all associated data is archived, not permanently destroyed.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">7. SMS and Communication</h2>
          <p>The Service allows contractors to send SMS text messages to their customers for appointment reminders, job updates, and invoice notifications. By using the SMS features, you agree to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Only send messages to customers who have provided explicit opt-in consent</li>
            <li>Honor opt-out requests (STOP) promptly</li>
            <li>Comply with all applicable laws including the Telephone Consumer Protection Act (TCPA) and carrier guidelines</li>
            <li>Not use the SMS features for marketing, spam, or unsolicited messages</li>
          </ul>
          <p>SMS messages are sent through Twilio. Standard message and data rates may apply to recipients. We are not responsible for carrier fees charged to message recipients.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">8. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the Service for any unlawful purpose</li>
            <li>Send spam, unsolicited messages, or harassing communications</li>
            <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
            <li>Interfere with the proper functioning of the Service</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
            <li>Resell or redistribute the Service without authorization</li>
          </ul>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">9. Intellectual Property</h2>
          <p>The Service, including its design, code, features, and branding, is owned by Service Official and protected by intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the Service for your business operations during your subscription period.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">10. Third-Party Services</h2>
          <p>The Service integrates with third-party providers including Supabase, Stripe, Twilio, Resend, and OpenStreetMap. Your use of these services is subject to their respective terms and privacy policies. We are not responsible for the availability or performance of third-party services.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">11. Disclaimer of Warranties</h2>
          <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">12. Limitation of Liability</h2>
          <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, SERVICE OFFICIAL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUE, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.</p>
          <p>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">13. Termination</h2>
          <p>We may suspend or terminate your account if you violate these Terms. You may cancel your account at any time. Upon termination, your right to use the Service ceases immediately.</p>
          <p>When an account or organization is terminated, all associated data is archived and retained in accordance with our data retention policy described in our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>. No data is permanently deleted upon termination.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">14. Changes to Terms</h2>
          <p>We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms on this page and updating the "Last updated" date. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">15. Governing Law</h2>
          <p>These Terms are governed by the laws of the State of Arizona, United States, without regard to its conflict of law principles.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">16. Contact</h2>
          <p>For questions about these Terms, contact us at:</p>
          <p>
            <strong>Service Official</strong><br />
            Email: <a href="mailto:support@serviceofficial.app" className="text-blue-600 hover:underline">support@serviceofficial.app</a>
          </p>
        </div>
      </div>
    </div>
  )
}
