
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

interface PrivacyPolicyDialogProps {
  trigger: React.ReactNode;
}

const PrivacyPolicyDialog: React.FC<PrivacyPolicyDialogProps> = ({ trigger }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[60vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Privacy Policy</DialogTitle>
          <DialogDescription>
            Last updated: {new Date().toLocaleDateString()}. Please read our privacy policy carefully.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow my-4 pr-6">
          <div className="prose prose-sm max-w-none text-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Introduction</h3>
            <p>Welcome to SomaVilivyo ("us", "we", or "our"). We are committed to protecting your personal information and your right to privacy...</p>
            {/* Truncated for brevity in this component, full text on PrivacyPolicyPage.tsx */}
            <p><strong>1. What Information Do We Collect?</strong></p>
            <p>Personal information you disclose to us: We collect personal information that you voluntarily provide to us when you register...</p>
            <p><strong>2. How Do We Use Your Information?</strong></p>
            <p>We use personal information collected via our Services for a variety of business purposes...</p>
            <p><strong>3. Will Your Information Be Shared With Anyone?</strong></p>
            <p>We only share information with your consent, to comply with laws...</p>
            <p><strong>4. How Long Do We Keep Your Information?</strong></p>
            <p>We keep your information for as long as necessary...</p>
            <p><strong>5. How Do We Keep Your Information Safe?</strong></p>
            <p>We aim to protect your personal information through a system of organizational and technical security measures.</p>
            <p><strong>6. What Are Your Privacy Rights?</strong></p>
            <p>You may review, change, or terminate your account at any time.</p>
            <p><strong>7. Controls for Do-Not-Track Features</strong></p>
            <p>We do not currently respond to DNT browser signals...</p>
            <p><strong>8. Updates to This Notice</strong></p>
            <p>We may update this privacy notice from time to time...</p>
            <p><strong>9. How Can You Contact Us About This Notice?</strong></p>
            <p>If you have questions or comments, email us at privacy@somavilivyo.app.</p>
            <div className="mt-4">
              <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Read Full Privacy Policy
              </Link>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyPolicyDialog;

