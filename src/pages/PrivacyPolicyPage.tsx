
import React from 'react';
import { PageIntro } from '@/components/layout/PageIntro';
import { FloatingCard } from '@/components/ui/floating-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldCheck } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-12 animate-fade-in">
      <PageIntro
        title="Privacy Policy"
        description="Your privacy is important to us. This policy explains how we collect, use, and protect your personal information."
        icon={<ShieldCheck className="w-12 h-12" />}
        cardClassName="bg-gradient-to-br from-gray-50 via-slate-50 to-stone-100"
        titleClassName="from-gray-600 via-slate-600 to-stone-600"
      />

      <FloatingCard variant="glass" className="p-6 md:p-8">
        <ScrollArea className="h-[60vh] w-full">
          <div className="prose prose-lg max-w-none text-gray-700 pr-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Introduction</h2>
            <p>Welcome to SomaVilivyo ("us", "we", or "our"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us at privacy@somavilivyo.app.</p>
            <p>This privacy notice describes how we might use your information if you:
              <ul>
                <li>Visit our website at [Your Website URL]</li>
                <li>Engage with us in other related ways ― including any sales, marketing, or events</li>
              </ul>
            </p>
            <p>In this privacy notice, if we refer to:
              <ul>
                <li>"Website," we are referring to any website of ours that references or links to this policy</li>
                <li>"Services," we are referring to our Website, and other related services, including any sales, marketing, or events</li>
              </ul>
            </p>
            <p>The purpose of this privacy notice is to explain to you in the clearest way possible what information we collect, how we use it, and what rights you have in relation to it. If there are any terms in this privacy notice that you do not agree with, please discontinue use of our Services immediately.</p>
            <p><strong>Last updated: {new Date().toLocaleDateString()}</strong></p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">1. What Information Do We Collect?</h2>
            <p><strong>Personal information you disclose to us:</strong> We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services or otherwise when you contact us.</p>
            <p>The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make and the products and features you use. The personal information we collect may include the following: Name, Email Address, Password (hashed), Usage Data.</p>
            
            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">2. How Do We Use Your Information?</h2>
            <p>We use personal information collected via our Services for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
            <p>We use the information we collect or receive:
              <ul>
                <li>To facilitate account creation and logon process.</li>
                <li>To post testimonials.</li>
                <li>To manage user accounts.</li>
                <li>To send administrative information to you.</li>
                <li>To protect our Services.</li>
                <li>To respond to user inquiries/offer support to users.</li>
              </ul>
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">3. Will Your Information Be Shared With Anyone?</h2>
            <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">4. How Long Do We Keep Your Information?</h2>
            <p>We keep your information for as long as necessary to fulfill the purposes outlined in this privacy notice unless otherwise required by law.</p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">5. How Do We Keep Your Information Safe?</h2>
            <p>We aim to protect your personal information through a system of organizational and technical security measures.</p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">6. What Are Your Privacy Rights?</h2>
            <p>In some regions (like the EEA and UK), you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time.</p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">7. Controls for Do-Not-Track Features</h2>
            <p>Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track (“DNT”) feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online.</p>
            
            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">8. Updates to This Notice</h2>
            <p>We may update this privacy notice from time to time. The updated version will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible. We encourage you to review this privacy notice frequently to be informed of how we are protecting your information.</p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">9. How Can You Contact Us About This Notice?</h2>
            <p>If you have questions or comments about this notice, you may email us at privacy@somavilivyo.app or by post to:</p>
            <p>[Your Company Name]<br />[Your Company Address Line 1]<br />[Your Company Address Line 2]<br />[City, State, Zip Code]<br />[Country]</p>
          </div>
        </ScrollArea>
      </FloatingCard>
    </div>
  );
};

export default PrivacyPolicyPage;

