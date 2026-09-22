-- Additive role-unit kind. Existing REQUIRED / NOT_REQUIRED rows stay as they are.

ALTER TYPE "DeliveryRoleUnitKindEnum" ADD VALUE IF NOT EXISTS 'OPTIONAL';
