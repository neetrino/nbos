-- NBOS local/dev database bootstrap (idempotent).
--
-- Local development syncs the schema with `prisma db push` because the committed
-- migration history contains an `ALTER TYPE ... ADD VALUE` used in the same
-- transaction, which PostgreSQL rejects on a fresh `prisma migrate deploy`.
-- `db push` creates the schema but does not run the data-seed INSERTs embedded in
-- the migrations, so the base system Roles and Departments must be seeded here
-- before `seed:rbac` (which only creates Permissions/RolePermissions) and
-- `seed:admin` (which creates the first login-able employee) can run.
--
-- Role ids/slugs mirror the migration seeds and shared RBAC constants
-- (packages/shared/src/rbac, .../constants). Safe to run repeatedly.

INSERT INTO "roles" ("id", "name", "slug", "level", "is_system", "updated_at") VALUES
  ('role-owner',             'Owner',                'owner',              1, true, now()),
  ('role-ceo',               'CEO',                  'ceo',                2, true, now()),
  ('role-head-sales',        'Head of Sales',        'head-sales',         3, true, now()),
  ('role-head-delivery',     'Head of Delivery',     'head-delivery',      3, true, now()),
  ('role-finance-director',  'Finance Director',     'finance-director',   3, true, now()),
  ('role-head-marketing',    'Head of Marketing',    'head-marketing',     3, true, now()),
  ('role-seller',            'Seller',               'seller',             4, true, now()),
  ('role-seller-assistant',  'Seller Assistant',     'seller-assistant',   4, true, now()),
  ('role-pm',                'Project Manager',      'pm',                 4, true, now()),
  ('role-developer',         'Developer',            'developer',          5, true, now()),
  ('role-developer-frontend','Developer Frontend',   'developer-frontend', 5, true, now()),
  ('role-junior-developer',  'Junior Developer',     'junior-developer',   5, true, now()),
  ('role-designer',          'Designer',             'designer',           5, true, now()),
  ('role-qa',                'QA Engineer',          'qa',                 5, true, now()),
  ('role-tech-specialist',   'Tech Specialist',      'tech-specialist',    5, true, now()),
  ('role-marketing',         'Marketing Specialist', 'marketing',          5, true, now()),
  ('role-observer',          'Observer',             'observer',           6, true, now())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "departments" ("id", "name", "slug", "sort_order", "updated_at") VALUES
  ('dept-executive',   'Executive',   'executive',   0, now()),
  ('dept-sales',       'Sales',       'sales',       1, now()),
  ('dept-marketing',   'Marketing',   'marketing',   2, now()),
  ('dept-delivery',    'Delivery',    'delivery',    3, now()),
  ('dept-development', 'Development', 'development', 4, now()),
  ('dept-support',     'Support',     'support',     5, now()),
  ('dept-finance',     'Finance',     'finance',     6, now()),
  ('dept-hr',          'HR',          'hr',          7, now())
ON CONFLICT ("id") DO NOTHING;
