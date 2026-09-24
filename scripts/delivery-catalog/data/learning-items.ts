import type { CatalogSeedItem } from './catalog-seed-types';

/** Extra modules of an LMS product. Employee training stays in hr_ops. */
export const LEARNING_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'LMS_COURSES',
    category: 'learning',
    iconKey: 'GraduationCap',
    title: 'Course catalog',
    summary: 'Programs and courses with structure and publication.',
    scopeBoundaries:
      'Course records, programs, publication status, ordering, and catalog display. Lesson content is a separate card.',
    units: { BACKEND: 18, FRONTEND: 14, PM: 3, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'LMS_LESSONS',
    category: 'learning',
    iconKey: 'BookOpen',
    title: 'Lessons and materials',
    summary: 'Lesson units with attached learning materials.',
    scopeBoundaries:
      'Lesson structure, text and file materials, ordering, and progress markers per lesson. Video hosting is a separate card.',
    units: { BACKEND: 16, FRONTEND: 16, PM: 3, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'LMS_ENROLLMENTS',
    category: 'learning',
    iconKey: 'UserPlus',
    title: 'Learner enrollment',
    summary: 'Assigning learners to courses and tracking access.',
    scopeBoundaries:
      'Enrollment, access window, group assignment, and revocation. Payments are a separate card.',
    units: { BACKEND: 16, FRONTEND: 10, PM: 3, QA: 4 },
  },
  {
    code: 'LMS_ASSESSMENTS',
    category: 'learning',
    iconKey: 'ListChecks',
    title: 'Tests and assessments',
    summary: 'Knowledge checks with a passing score.',
    scopeBoundaries:
      'Question set, passing score, attempts, results, and retake rules. Certificates are a separate card.',
    units: { BACKEND: 20, FRONTEND: 14, PM: 3, DESIGNER: 3, QA: 5 },
  },
  {
    code: 'LMS_CERTIFICATES',
    category: 'learning',
    iconKey: 'Star',
    title: 'Course certificates',
    summary: 'Issuing a certificate after a completed course.',
    scopeBoundaries:
      'Template, issue on completion, download, and verification code. Print layout extras are a separate card.',
    units: { BACKEND: 12, FRONTEND: 10, PM: 2, DESIGNER: 4, QA: 3 },
  },
];
