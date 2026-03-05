import React from 'react';
import { PageIntro } from '@/components/layout/PageIntro';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Lightbulb, Users, Shield, Cpu, Target, Award, Brain } from 'lucide-react';
import { FloatingCard } from '@/components/ui/floating-card';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: <Zap className="w-10 h-10 text-yellow-500 mb-4" />,
    title: "AI-Powered Course Generation",
    description: "Leverage the power of artificial intelligence to create comprehensive and engaging course content in minutes, not weeks.",
  },
  {
    icon: <Lightbulb className="w-10 h-10 text-green-500 mb-4" />,
    title: "Personalized Learning Paths",
    description: "Our platform adapts to individual learning styles and paces, ensuring a customized educational journey for every user.",
  },
  {
    icon: <Brain className="w-10 h-10 text-blue-500 mb-4" />,
    title: "Interactive Quizzes & Assessments",
    description: "Reinforce learning and assess understanding with dynamic quizzes and practical exercises integrated into each module.",
  },
  {
    icon: <Users className="w-10 h-10 text-purple-500 mb-4" />,
    title: "Collaborative Learning Environment",
    description: "Engage with peers, share insights, and learn together in a supportive and interactive community (feature coming soon).",
  },
];

const AboutPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-12 animate-fade-in">
      <PageIntro
        title="About SomaVilivyo"
        description="Empowering curious minds with AI-driven personalized education. Learn smarter, not harder."
        cardClassName="bg-gradient-to-br from-purple-50 via-pink-50 to-red-100"
        titleClassName="from-purple-600 via-pink-600 to-red-600"
      />

      <FloatingCard variant="glass" className="p-6 md:p-8">
        <div className="text-center">
          <Target className="w-16 h-16 text-indigo-600 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Our Mission</h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            At SomaVilivyo, our mission is to revolutionize education by making high-quality, personalized learning accessible to everyone, everywhere. We believe that technology, powered by artificial intelligence, can unlock human potential and foster a lifelong love for learning. We strive to create tools that are not just intelligent, but also intuitive and inspiring.
          </p>
        </div>
      </FloatingCard>

      <FloatingCard variant="glass" className="p-6 md:p-8">
        <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center flex items-center justify-center">
          <Award className="w-10 h-10 mr-3 text-red-600" />
          Why Choose SomaVilivyo?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/80 border border-gray-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
              <CardHeader className="items-center text-center">
                {feature.icon}
                <CardTitle className="text-2xl text-gray-700">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </FloatingCard>

      <FloatingCard variant="glass" className="p-6 md:p-8">
         <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center flex items-center justify-center">
          <Cpu className="w-10 h-10 mr-3 text-teal-600" />
          Our Technology
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-6 text-center">
          SomaVilivyo is built on a modern technology stack, including React for a dynamic frontend, Supabase for a robust backend and database, and cutting-edge AI models for content generation and personalization. We prioritize security, scalability, and user experience.
        </p>
        <div className="flex justify-center">
            <EnhancedButton 
                variant="gradient" 
                size="lg"
                className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
                onClick={() => alert('Dive deeper into our tech stack (Placeholder)')}
            >
                Learn More About Our Tech
            </EnhancedButton>
        </div>
      </FloatingCard>
      
      <FloatingCard variant="glass" className="p-6 md:p-8 text-center">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 flex items-center justify-center">
            <Shield className="w-10 h-10 mr-3 text-blue-600" />
            Our Commitment
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-4">
            We are committed to ethical AI, data privacy, and creating an inclusive platform for all learners. Your trust is paramount, and we continuously work to ensure SomaVilivyo is a safe and reliable space for education and growth.
        </p>
        <Link to="/privacy-policy">
          <EnhancedButton 
              variant="outline" 
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
              View Privacy Policy
          </EnhancedButton>
        </Link>
      </FloatingCard>
    </div>
  );
};

export default AboutPage;
