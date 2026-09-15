-- `EmployeeDepartment.dept_role` is a legacy display field: once a department has seats,
-- leadership comes from `departments.head_seat_id` plus the active seat assignment.
--
-- Seat assignment used to write the derived role only when it created the membership row.
-- Anyone who already belonged to the department before seats existed kept their old value,
-- so a head could stay recorded as MEMBER (and an ex-head as HEAD). The upsert and the
-- end-of-assignment reconcile now both write the derived role; this backfills what drifted.
--
-- Departments without active seats are left alone on purpose — there the legacy value is
-- still the only thing we have.

UPDATE "employee_departments" ed
SET "dept_role" = derived."dept_role"
FROM (
  SELECT ed."id",
         CASE
           WHEN bool_or(s."id" = d."head_seat_id") THEN 'HEAD'
           WHEN bool_or(s."kind" = 'DEPUTY') THEN 'DEPUTY'
           ELSE 'MEMBER'
         END AS "dept_role"
  FROM "employee_departments" ed
  JOIN "departments" d ON d."id" = ed."department_id"
  -- Left joins so an employee with no seat in this department still yields a MEMBER row.
  LEFT JOIN "org_seat_assignments" a
    ON a."employee_id" = ed."employee_id"
   AND a."ends_at" IS NULL
   AND a."status" IN ('ACTIVE', 'TEMPORARY')
  LEFT JOIN "org_seats" s
    ON s."id" = a."seat_id"
   AND s."department_id" = ed."department_id"
   AND s."status" = 'ACTIVE'
  WHERE EXISTS (
    SELECT 1 FROM "org_seats" x
    WHERE x."department_id" = ed."department_id" AND x."status" = 'ACTIVE'
  )
  GROUP BY ed."id"
) AS derived
WHERE ed."id" = derived."id"
  AND ed."dept_role" <> derived."dept_role";
