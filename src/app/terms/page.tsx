export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Terms & Conditions</h1>
      
      <div className="prose prose-blue max-w-none text-gray-700 space-y-6">
        <p><strong>Last Updated: {new Date().toLocaleDateString('en-IN')}</strong></p>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. Introduction</h2>
          <p>
            Welcome to the Choutuppal App ("App"), owned and operated by <strong>Citizen CSC</strong> ("we," "our," or "us"), located in Choutuppal, Telangana, India. By accessing or using our App, you agree to comply with and be bound by these Terms and Conditions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. Services Description</h2>
          <p>
            Choutuppal is a hyper-local business directory, real estate listing, and community news platform. We provide a platform connecting local businesses, services, and residents in and around Choutuppal.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. User Data and Privacy</h2>
          <p>
            We collect personal information such as your name, phone number, and email address strictly to provide our directory and community services. <strong>We do not sell your personal data to third parties.</strong> For more details, please review our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. User Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must provide accurate information when registering or listing a business.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You agree not to post any misleading, fraudulent, defamatory, or illegal content.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. Content Ownership</h2>
          <p>
            All platform-generated content, design, and branding are the property of Citizen CSC. User-submitted listings remain the responsibility of the respective users, but by submitting content, you grant us a non-exclusive license to display it on our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. Limitation of Liability</h2>
          <p>
            We act solely as a directory and facilitation platform. We are not responsible for the quality, safety, or legality of the goods or services advertised by third parties on our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">7. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts located in Telangana.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">8. Contact & Grievance Redressal</h2>
          <p>
            If you have any questions, complaints, or grievances regarding these terms or the platform, please contact us at:
          </p>
          <ul className="list-none space-y-1 mt-2">
            <li><strong>Owner:</strong> Citizen CSC</li>
            <li><strong>Email:</strong> <a href="mailto:contact@choutuppal.in" className="text-blue-600 hover:underline">contact@choutuppal.in</a></li>
            <li><strong>Phone:</strong> <a href="tel:8790083706" className="text-blue-600 hover:underline">8790083706</a></li>
            <li><strong>Location:</strong> Choutuppal, Telangana, India</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
