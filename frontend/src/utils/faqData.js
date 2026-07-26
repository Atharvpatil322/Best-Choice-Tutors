/**
 * Shared FAQ Data Source
 * Single source of truth for FAQ questions and answers.
 * Used by both the FAQ UI component and the FAQ schema generator.
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

/**
 * Returns the FAQ items array.
 * @returns {Array<{question: string, answer: string}>}
 */
export function getFaqItems() {
  return FAQ_ITEMS;
}

/**
 * Returns FAQ items formatted for JSON-LD FAQ schema.
 * @returns {Array<{question: string, answer: string}>}
 */
export function getFaqForSchema() {
  return FAQ_ITEMS.map((item) => ({
    question: item.question,
    answer: item.answer,
  }));
}

export default FAQ_ITEMS;

