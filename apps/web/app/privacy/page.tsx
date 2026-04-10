import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Privacy Policy — Service Official' }

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-6 inline-block">← Back to Home</Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: April 10, 2026</p>

        <div className="prose prose-gray max-w-none text-gray-700 space-y-6 text-sm leading-relaxed">

          <h2 className="text-lg font-semibold text-gray-900 mt-8">1. Introduction</h2>
          <p>Service Official ("we," "our," or "us") operates the serviceofficial.app platform (the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">2. Information We Collect</h2>
          <p><strong>Account Information:</strong> When you create an account, we collect your name, email address, phone number, company name, industry, and timezone.</p>
          <p><strong>Customer Data:</strong> Contractors using our platform may store customer information including names, email addresses, phone numbers, addresses, and project details. This data is owned by the contractor and processed by us on their behalf.</p>
          <p><strong>Usage Data:</strong> We automatically collect information about how you interact with the Service, including IP addresses, browser type, pages visited, and timestamps.</p>
          <p><strong>Payment Information:</strong> Payment processing is handled by Stripe. We do not store credit card numbers on our servers.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide, maintain, and improve the Service</li>
            <li>Create and manage your account</li>
            <li>Send transactional emails (invoices, estimates, password resets)</li>
            <li>Send SMS notifications to customers who have opted in</li>
            <li>Provide customer support</li>
            <li>Monitor usage and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">4. SMS/Text Messaging</h2>
          <p>We send text messages to end-user customers only when they have provided explicit opt-in consent. Messages include appointment reminders, technician arrival notifications, job completion updates, and invoice/estimate alerts.</p>
          <p><strong>Opt-in:</strong> Customers opt in through a clearly labeled checkbox during account creation or in their portal settings.</p>
          <p><strong>Opt-out:</strong> Customers can opt out at any time by replying STOP to any message, unchecking the SMS preference in their portal settings, or deleting their portal account.</p>
          <p><strong>Message frequency:</strong> Message frequency varies based on service activity. Typically 1-5 messages per service appointment.</p>
          <p><strong>Message and data rates may apply.</strong> We do not charge for SMS, but carrier rates may apply.</p>
          <p>We do not sell, rent, or share phone numbers or SMS opt-in consent with any third parties for marketing purposes.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">5. Data Sharing</h2>
          <p>We do not sell your personal information. We may share information with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Service Providers:</strong> Supabase (database), Vercel (hosting), Stripe (payments), Twilio (SMS), Resend (email) — only as necessary to provide the Service</li>
            <li><strong>Contractors:</strong> If you are a customer, your contractor has access to your information as entered in their account</li>
            <li><strong>Legal Requirements:</strong> When required by law, subpoena, or government request</li>
          </ul>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">6. Data Security</h2>
          <p>We implement industry-standard security measures including encryption in transit (TLS/SSL), encrypted data at rest, role-based access controls, and row-level security on all database tables. However, no method of transmission over the Internet is 100% secure.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">7. Data Retention</h2>
          <p>We retain your data for as long as your account is active or as needed to provide the Service. Contractors may retain customer data according to their own policies. You can request deletion of your account and associated data at any time.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">8. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access your personal information</li>
            <li>Update or correct your information</li>
            <li>Delete your account and data</li>
            <li>Opt out of SMS communications</li>
            <li>Request a copy of your data</li>
          </ul>
          <p>Portal customers can manage these from their Settings page. Contractors can manage their data from the Settings section of the dashboard.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">9. Cookies</h2>
          <p>We use essential cookies to maintain your session and preferences (such as light/dark mode). We do not use third-party advertising or tracking cookies.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">10. Children's Privacy</h2>
          <p>The Service is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">11. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">12. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or your data, contact us at:</p>
          <p>
            <strong>Service Official</strong><br />
            Email: <a href="mailto:support@serviceofficial.app" className="text-blue-600 hover:underline">support@serviceofficial.app</a>
          </p>
        </div>
      </div>
    </div>
  )
}
