
import React from 'react';
import { PageIntro } from '@/components/layout/PageIntro';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageSquare, LifeBuoy, Users, Info } from 'lucide-react';
import { FloatingCard } from '@/components/ui/floating-card';
import { EnhancedButton } from '@/components/ui/enhanced-button';

const faqs = [
  {
    question: "How do I create a new course?",
    answer: "You can create a new course by navigating to the 'Create Course' section from the sidebar. Follow the on-screen prompts to define your course structure, content, and quizzes. Our AI will assist you in generating engaging material.",
  },
  {
    question: "How can I track my learning progress?",
    answer: "Your learning progress is displayed on your Dashboard and within each course. You can see completed modules, quiz scores, and overall course completion percentage.",
  },
  {
    question: "What if I forget my password?",
    answer: "If you forget your password, you can use the 'Forgot Password' link on the login page. An email will be sent to your registered address with instructions to reset your password.",
  },
  {
    question: "How is my data protected?",
    answer: "We take data protection very seriously. All your personal information and course data are encrypted and stored securely. Please refer to our Privacy Policy for more details.",
  },
  {
    question: "Can I access my courses on multiple devices?",
    answer: "Yes, SomaVilivyo is a web-based platform, so you can access your courses from any device with an internet connection and a web browser, including desktops, laptops, tablets, and smartphones.",
  },
];

const HelpSupportPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-12 animate-fade-in">
      <PageIntro
        title="Help & Support Center"
        description="Find answers to your questions, get help with issues, and learn more about using SomaVilivyo."
        cardClassName="bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-100"
        titleClassName="from-blue-600 via-sky-600 to-cyan-600"
      />

      <FloatingCard variant="glass" className="p-6 md:p-8">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 flex items-center">
          <LifeBuoy className="w-8 h-8 mr-3 text-blue-600" />
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={index} className="bg-white/80 border border-blue-200/50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <AccordionTrigger className="p-4 md:p-6 text-lg font-medium text-gray-700 hover:text-blue-700 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="p-4 md:p-6 pt-0 text-gray-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </FloatingCard>

      <FloatingCard variant="glass" className="p-6 md:p-8">
        <h2 className="text-3xl font-semibold text-gray-800 mb-8 flex items-center">
          <MessageSquare className="w-8 h-8 mr-3 text-green-600" />
          Contact Support
        </h2>
        <p className="text-gray-600 mb-8 text-lg">
          If you can't find the answer you're looking for in our FAQs, please don't hesitate to reach out to our support team. We're here to help!
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-green-700">
                <Mail className="w-6 h-6 mr-3" /> Email Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-3">Send us an email and we'll get back to you as soon as possible.</p>
              <EnhancedButton variant="gradient" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700" onClick={() => window.location.href = 'mailto:somavilivyo@gmail.com'}>
                somavilivyo@gmail.com
              </EnhancedButton>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-purple-700">
                <Phone className="w-6 h-6 mr-3" /> Call Us (Mon-Fri, 9am-5pm)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-3">Speak directly with a support agent for urgent issues.</p>
              <EnhancedButton variant="gradient" className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700" onClick={() => alert('Calling +254778368909 (Placeholder)')}>
                +254778368909
              </EnhancedButton>
            </CardContent>
          </Card>
        </div>
         <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Looking for our community or more resources?</p>
            <div className="flex justify-center gap-4">
                <Button variant="outline" size="lg" onClick={() => alert('Navigating to Community Forums (Placeholder)')}>
                    <Users className="mr-2 h-5 w-5"/> Community Forums
                </Button>
                 <Button variant="outline" size="lg" onClick={() => alert('Navigating to Knowledge Base (Placeholder)')}>
                    <Info className="mr-2 h-5 w-5"/> Knowledge Base
                </Button>
            </div>
        </div>
      </FloatingCard>
    </div>
  );
};

export default HelpSupportPage;

