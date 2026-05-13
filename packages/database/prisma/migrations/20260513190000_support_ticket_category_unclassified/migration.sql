-- Ticket intake: allow "not yet triaged" category (canon: category finalized at triage).
ALTER TYPE "TicketCategoryEnum" ADD VALUE IF NOT EXISTS 'UNCLASSIFIED';
