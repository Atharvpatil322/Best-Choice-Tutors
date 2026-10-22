/**
 * Shared FAQ Data Source
 * Single source of truth for FAQ questions and answers.
 * Fallback for the FAQ section when the API cannot be reached.
 */

const FAQ_ITEMS = [
  {
    question: 'What tutoring services do you offer?',
    answer:
      'We provide personalized tutoring services for a wide range of subjects, including Math, English, Science, and test preparation, tailored to each student\'s learning needs.',
  },
  {
    question: 'Do you offer online tutoring?',
    answer:
      'Yes, we offer both online and in-person tutoring sessions, allowing students to learn from anywhere with flexible scheduling.',
  },
  {
    question: 'How do I choose the right tutor?',
    answer:
      'We match students with experienced tutors based on their academic goals, subject requirements, grade level, and learning preferences.',
  },
  {
    question: 'Which subjects do you cover?',
    answer:
      'Our tutors provide support in Mathematics, English, Science, Physics, Chemistry, Biology, SAT, ACT, AP courses, and many other subjects.',
  },
  {
    question: 'How can I book a tutoring session?',
    answer:
      'You can book a tutoring session by contacting us through our website, submitting an inquiry form, or reaching out to our support team.',
  },
];

export default FAQ_ITEMS;

