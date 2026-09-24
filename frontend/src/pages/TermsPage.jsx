import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EE] flex flex-col">
      <SEO
        title="Terms & Conditions"
        description="Terms and conditions for registering, checking in, and using the DLCF Oluyole Region retreat management system."
      />
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-14 w-full">
        <p className="text-[#D4A857] text-sm font-semibold tracking-[0.25em] uppercase mb-2">
          Legal
        </p>
        <h1 className="text-4xl font-bold text-[#1C2541] mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-[#6B7785] mb-10">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="space-y-8 text-[#1C2541]/90 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#1C2541] mb-2">1. Acceptance of these terms</h2>
            <p>
              By registering for a retreat, checking in through this system, or using the admin
              panel, you agree to these terms. This system is provided by Deeper Life Campus
              Fellowship (DLCF), Oluyole Region, solely to support registration, check-in, and
              attendance management for its retreats.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1C2541] mb-2">2. Registration</h2>
            <p>
              You are responsible for providing accurate information when you register. Each
              participant receives a unique registration code, which is personal and should not
              be shared, transferred, or used to check in on someone else's behalf.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1C2541] mb-2">3. Check-in and attendance</h2>
            <p>
              Attendance is recorded when a participant checks in using their code or QR code, or
              when an administrator marks attendance directly. Attendance records may be used to
              generate reports for retreat organisers and are considered accurate unless a
              correction is requested through an administrator.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1C2541] mb-2">4. Admin access</h2>
            <p>
              Administrative features (managing programmes, participants, attendance, and bulk
              messaging) are restricted to authorised staff. Admin accounts must not be shared,
              and any activity performed under an admin account is treated as performed by that
              account holder.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1C2541] mb-2">5. Communications</h2>
            <p>
              By registering, you consent to receive retreat-related SMS and email
              communications, such as schedule changes or reminders. You may ask an
              administrator to stop these communications at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1C2541] mb-2">6. Changes to these terms</h2>
            <p>
              These terms may be updated from time to time to reflect changes to how the system
              is used. Continued use of the system after an update constitutes acceptance of the
              revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1C2541] mb-2">7. Contact</h2>
            <p>
              Questions about these terms can be directed to a member of the DLCF Oluyole Region
              administrative team.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
