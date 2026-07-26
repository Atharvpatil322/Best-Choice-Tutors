/**
 * WhyChooseUs Component
 * SEO-friendly section explaining the key benefits of using Best Choice Tutors.
 * Uses semantic HTML for better search engine understanding.
 */

import { BadgeCheck, Shield, Users, Clock, GraduationCap, MessageSquare } from 'lucide-react';

const BENEFITS = [
  {
    icon: BadgeCheck,
    title: 'Verified Tutors',
    description:
      'All tutors undergo rigorous identity, qualification, and background checks before joining our platform.',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description:
      'Your transactions are protected with industry-standard security. Book with confidence knowing your payments are safe.',
  },
  {
    icon: Users,
    title: 'Personalised Matching',
    description:
      'We match you with tutors based on your subject, level, learning goals, and preferred teaching style.',
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description:
      'Choose from online or in-person sessions that fit your schedule. Learn at your own pace, on your own time.',
  },
  {
    icon: GraduationCap,
    title: 'Expert Tutors',
    description:
      'Our tutors are experienced professionals and qualified educators with deep subject knowledge.',
  },
  {
    icon: MessageSquare,
    title: 'Dedicated Support',
    description:
      'Our support team is here to help with bookings, tutor matching, and any questions you may have.',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50" aria-labelledby="why-choose-us-title">
      <div className="max-w-6xl mx-auto">
        <h2
          id="why-choose-us-title"
          className="text-2xl sm:text-3xl font-bold text-[#1A365D] text-center mb-3"
        >
          Why Choose Best Choice Tutors?
        </h2>
        <p className="text-slate-600 text-center max-w-2xl mx-auto mb-10 text-lg">
          We make expert tutoring accessible, transparent, and effective for every student.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article
                key={benefit.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-full bg-[#4FD1C5]/10 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-[#4FD1C5]" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-[#1A365D] mb-2">{benefit.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{benefit.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

