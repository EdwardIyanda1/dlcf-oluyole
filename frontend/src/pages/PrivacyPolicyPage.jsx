import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EE] flex flex-col">
      <SEO
        title="Privacy Policy"
        description="How Deeper Life Campus Fellowship, Oluyole Region collects, uses, and protects information gathered through retreat registration, check-in, and attendance tracking."
      />
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-14 w-full">
        <p className="text-[#D4A857] text-sm font-semibold tracking-[0.25em] uppercase mb-2">
          Legal
        </p>
        <h1 className="text-4xl font-bold text-[#1C2541] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#6B7785] mb-10">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="space-y-8 text-[#1C2541]/90 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#1C2541] mb-2">1. Who we are</h2>
            <p>
              This system is operated by Deeper Life Campus Fellowship (DLCF), Oluyole Region,
              to manage registration, check-in, and attendance for its retreats and related
              programmes. This policy explains what information we collect from participants
              and administrators, why we collect it, and how it is handled.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1C2541] mb-2">2. Information we collect</h2>
            <p className="mb-2">When you register for a retreat, we collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Full name, sex, and category (Adult, Campus, Youth, or Children)</li>
              <li>School or institution (where applicable)</li>
              <li>Phone number and address</li>
              <li>A unique registration code used to identify you at check-in</li>
            </ul>
            <p className="mt-2">
              If you create an account to access check-in or admin features, we also collect
              your email address and, if you sign in with Google, the basic profile information
              Google shares with us for authentication.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1C2541] mb-2">3. How we use this information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To register you for a retreat and issue your personal check-in code or QR code</li>
              <li>To record attendance at each session and produce attendance reports</li>
              <li>To send you retreat-related updates by SMS or email (e.g. schedule changes)</li>
              <li>To generate anonymised statistics (such as attendance counts by category) for planning purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1C2541] mb-2">4. Who can see your information</h2>
            <p>
              Registration and attendance records are only visible to authorised retreat
              administrators. We do not sell or share your information with third parties for
              marketing purposes. Bulk messages sent from the admin panel are logged internally
              (channel, recipient count, and content) so that communication can be audited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1C2541] mb-2">5. How long we keep your data</h2>
            <p>
              Registration and attendance records are retained for record-keeping and future
              retreat planning. If you would like your record removed, contact a retreat
              administrator using the details on the registration desk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1C2541] mb-2">6. Your choices</h2>
            <p>
              You may ask an administrator at any time to review, correct, or delete the
              information held about you, or to stop receiving SMS or email communications
              from the retreat.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1C2541] mb-2">7. Contact</h2>
            <p>
              For questions about this policy or your data, please speak with a member of the
              DLCF Oluyole Region administrative team.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
