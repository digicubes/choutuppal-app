export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Privacy Policy</h1>
      
      <div className="prose prose-blue max-w-none text-gray-700 space-y-6">
        <p><strong>Last Updated: {new Date().toLocaleDateString('en-IN')}</strong></p>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. Introduction</h2>
          <p>
            This Privacy Policy explains how <strong>Citizen CSC</strong> ("we," "us," or "our"), located in Choutuppal, Telangana, collects, uses, and protects your personal data when you use the Choutuppal App ("App").
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. Information We Collect</h2>
          <p>
            To provide our hyper-local directory and community services, we may collect the following information:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Personal Information:</strong> Name, Email address, and Phone number when you register an account or create a business listing.</li>
            <li><strong>Business Information:</strong> Public details about your business, real estate property, or services that you choose to list on our platform.</li>
            <li><strong>Usage Data:</strong> Basic analytics such as IP address, browser type, and interactions with the App to help us improve user experience.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create and manage your user account.</li>
            <li>Display your business or real estate listings to other users.</li>
            <li>Facilitate communication between users and listed businesses.</li>
            <li>Send important notifications regarding your account or our services.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. Data Sharing and Protection</h2>
          <p>
            <strong>We do not sell, rent, or trade your personal data to third parties.</strong> Your public business listings will be visible to all users of the App. We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, or disclosure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. Your Rights</h2>
          <p>
            You have the right to access, update, or request the deletion of your personal data stored on our platform. You can manage your information directly through your account dashboard or by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. Contact & Grievance Officer</h2>
          <p>
            In accordance with the Information Technology Act, 2000 (India) and rules made there under, if you have any privacy concerns or grievances, please contact:
          </p>
          <ul className="list-none space-y-1 mt-2">
            <li><strong>Grievance Officer / Owner:</strong> Citizen CSC</li>
            <li><strong>Email:</strong> <a href="mailto:contact@choutuppal.in" className="text-blue-600 hover:underline">contact@choutuppal.in</a></li>
            <li><strong>Phone:</strong> <a href="tel:8790083706" className="text-blue-600 hover:underline">8790083706</a></li>
            <li><strong>Location:</strong> Choutuppal, Telangana, India</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
