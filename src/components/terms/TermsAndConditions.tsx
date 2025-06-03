import React from 'react'

const TermsAndConditions: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Terms and Conditions
            </h1>
            <p className="text-lg sm:text-xl text-gray-300">Last updated: June 03, 2025</p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg prose-slate ">
            <div className="mb-8">
              <p className="text-gray-600 leading-relaxed">
                These Terms and Conditions (&quot;Terms&quot;, &quot;Terms and Conditions&quot;)
                govern your relationship with Dawan Africa website (the &quot;Service&quot;)
                operated by Dawan Media Group (&quot;us&quot;, &quot;we&quot;, or &quot;our&quot;).
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                Please read these Terms and Conditions carefully before using our Service. Your
                access to and use of the Service is conditioned on your acceptance of and compliance
                with these Terms. By accessing or using our Service, you agree to be bound by these
                Terms.
              </p>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 border-b-2 border-[#2aaac6] pb-2">
              Definitions
            </h2>

            <ul className="space-y-4 mb-8">
              <li className="bg-gray-50 p-4 rounded-lg">
                <p>
                  <strong className="text-[#2aaac6]">Service</strong> refers to the Dawan Africa
                  website operated by Dawan Media Group.
                </p>
              </li>
              <li className="bg-gray-50 p-4 rounded-lg">
                <p>
                  <strong className="text-[#2aaac6]">Terms</strong> refer to these Terms and
                  Conditions that form the entire agreement between you and Dawan Media Group
                  regarding the use of the Service.
                </p>
              </li>
              <li className="bg-gray-50 p-4 rounded-lg">
                <p>
                  <strong className="text-[#2aaac6]">User</strong> refers to the individual
                  accessing or using the Service.
                </p>
              </li>
              <li className="bg-gray-50 p-4 rounded-lg">
                <p>
                  <strong className="text-[#2aaac6]">Account</strong> refers to a unique account
                  created for you to access our Service or parts of our Service.
                </p>
              </li>
              <li className="bg-gray-50 p-4 rounded-lg">
                <p>
                  <strong className="text-[#2aaac6]">Content</strong> refers to content such as
                  text, images, or other information that can be posted, uploaded, linked to or
                  otherwise made available, regardless of the form of that content.
                </p>
              </li>
            </ul>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 border-b-2 border-[#2aaac6] pb-2">
              User Accounts
            </h2>

            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
              Account Creation
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              To access certain features of our Service, you may be required to create an account.
              When creating an account, you must:
            </p>

            <ul className="list-disc list-inside space-y-2 mb-6 text-gray-600">
              <li>Provide accurate, complete, and current information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security and confidentiality of your login credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>

            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
              Account Responsibilities
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">You are responsible for:</p>

            <ul className="list-disc list-inside space-y-2 mb-6 text-gray-600">
              <li>Safeguarding your password and account information</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring your account information remains current and accurate</li>
              <li>Complying with all applicable laws and regulations</li>
            </ul>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-6 mb-8">
              <h5 className="font-semibold text-gray-800 mb-2">Account Termination</h5>
              <p className="text-gray-600">
                We reserve the right to suspend or terminate your account at any time if you violate
                these Terms or engage in conduct that we deem harmful to our Service or other users.
              </p>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 border-b-2 border-[#2aaac6] pb-2">
              Subscription Services
            </h2>

            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
              Subscription Plans
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              We may offer subscription-based services that provide enhanced features and content
              access. By subscribing to our services, you agree to:
            </p>

            <ul className="list-disc list-inside space-y-2 mb-6 text-gray-600">
              <li>Pay all subscription fees as specified in your chosen plan</li>
              <li>Provide accurate billing and payment information</li>
              <li>Update payment information promptly if it changes</li>
              <li>Comply with the terms specific to your subscription level</li>
            </ul>

            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
              Billing and Payment
            </h3>
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <ul className="space-y-3">
                <li>
                  <strong className="text-[#2aaac6]">Recurring Payments:</strong> Subscription fees
                  are charged on a recurring basis according to your selected billing cycle.
                </li>
                <li>
                  <strong className="text-[#2aaac6]">Price Changes:</strong> We reserve the right to
                  modify subscription prices with 30 days advance notice.
                </li>
                <li>
                  <strong className="text-[#2aaac6]">Failed Payments:</strong> If payment fails, we
                  may suspend access until payment is resolved.
                </li>
                <li>
                  <strong className="text-[#2aaac6]">Refunds:</strong> Refunds are provided
                  according to our refund policy, available upon request.
                </li>
              </ul>
            </div>

            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
              Cancellation and Refunds
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              You may cancel your subscription at any time through your account settings. Upon
              cancellation, you will retain access to premium features until the end of your current
              billing period. We do not provide prorated refunds for partial billing periods unless
              required by law.
            </p>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 border-b-2 border-[#2aaac6] pb-2">
              Acceptable Use Policy
            </h2>

            <p className="text-gray-600 leading-relaxed mb-4">
              You agree not to use the Service for any unlawful purpose or in any way that could
              damage, disable, overburden, or impair our Service. Prohibited activities include:
            </p>

            <ul className="list-disc list-inside space-y-2 mb-6 text-gray-600">
              <li>Violating any applicable local, state, national, or international law</li>
              <li>Transmitting any harmful, threatening, abusive, or offensive content</li>
              <li>Attempting to gain unauthorized access to our systems</li>
              <li>Interfering with or disrupting the Service or servers</li>
              <li>Impersonating any person or entity</li>
              <li>Collecting or harvesting personal information of other users</li>
            </ul>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 border-b-2 border-[#2aaac6] pb-2">
              Intellectual Property Rights
            </h2>

            <p className="text-gray-600 leading-relaxed mb-4">
              The Service and its original content, features, and functionality are and will remain
              the exclusive property of Dawan Media Group and its licensors. The Service is
              protected by copyright, trademark, and other laws. Our trademarks and trade dress may
              not be used without our prior written consent.
            </p>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 border-b-2 border-[#2aaac6] pb-2">
              Privacy Policy
            </h2>

            <p className="text-gray-600 leading-relaxed mb-6">
              Your privacy is important to us. Please review our Privacy Policy, which also governs
              your use of the Service, to understand our practices regarding the collection and use
              of your personal information.
            </p>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 border-b-2 border-[#2aaac6] pb-2">
              Limitation of Liability
            </h2>

            <p className="text-gray-600 leading-relaxed mb-6">
              In no event shall Dawan Media Group, its directors, employees, partners, agents,
              suppliers, or affiliates be liable for any indirect, incidental, special,
              consequential, or punitive damages, including loss of profits, data, use, goodwill, or
              other intangible losses, resulting from your use of the Service.
            </p>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 border-b-2 border-[#2aaac6] pb-2">
              Changes to Terms
            </h2>

            <div className="bg-blue-50 border-l-4 border-[#2aaac6] p-6 mb-8">
              <p className="text-gray-600">
                We reserve the right to modify or replace these Terms at any time. If a revision is
                material, we will try to provide at least 30 days notice prior to any new terms
                taking effect. Your continued use of our Service after such modifications
                constitutes acceptance of the updated Terms.
              </p>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 border-b-2 border-[#2aaac6] pb-2">
              Contact Information
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have any questions about these Terms and Conditions, please contact us:
            </p>

            <div className="bg-gray-50 p-6 rounded-lg">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="font-semibold text-[#2aaac6] mr-2">Email:</span>
                  <a href="mailto:info@dawan.africa" className="text-gray-700 hover:text-[#2aaac6]">
                    info@dawan.africa
                  </a>
                </li>
                <li className="flex items-center">
                  <span className="font-semibold text-[#2aaac6] mr-2">Phone:</span>
                  <a href="tel:+252628881171" className="text-gray-700 hover:text-[#2aaac6]">
                    +252628881171
                  </a>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-[#2aaac6] mr-2">Address:</span>
                  <span className="text-gray-700">
                    Dawan Media Group
                    <br />
                    Marinio Rd, Mogadishu, Somalia
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default TermsAndConditions
