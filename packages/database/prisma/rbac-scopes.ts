/**
 * Shared vocabulary for the RBAC seed matrices.
 *
 * A matrix row is ordered by the `ACTIONS` tuple: VIEW, EDIT, ADD, DELETE. Modules that are
 * absent from a role's matrix receive no grant at all, which is the same as `NONE`.
 */

export type Scope = 'NONE' | 'OWN' | 'DEPARTMENT' | 'ALL';

export type MatrixRow = [Scope, Scope, Scope, Scope];

export type MatrixEntry = Record<string, MatrixRow>;

/** ✅ Full — everything, company-wide. */
export const F: MatrixRow = ['ALL', 'ALL', 'ALL', 'ALL'];
/** 👁 Read — see everything, change nothing. */
export const R: MatrixRow = ['ALL', 'NONE', 'NONE', 'NONE'];
/** 🔶 Limited — own records only, no create. */
export const L: MatrixRow = ['OWN', 'OWN', 'NONE', 'NONE'];
/** 🔶 Limited + create — own records, may add (Seller invoices). */
export const LA: MatrixRow = ['OWN', 'OWN', 'OWN', 'NONE'];
/** Department scope — the departments the role is granted through. */
export const D: MatrixRow = ['DEPARTMENT', 'DEPARTMENT', 'DEPARTMENT', 'NONE'];
/** ❌ None. */
export const N: MatrixRow = ['NONE', 'NONE', 'NONE', 'NONE'];
/** View all + create, no edit/delete — Seller / Head of Sales on Clients. */
export const VA: MatrixRow = ['ALL', 'NONE', 'ALL', 'NONE'];
/** View own + create own, no edit/delete — Head of Marketing invoices. */
export const VA_OWN: MatrixRow = ['OWN', 'NONE', 'OWN', 'NONE'];
/**
 * Manage — full company-wide access except delete. Used where records are retired through a
 * lifecycle (offboarding, archiving) rather than destroyed, so DELETE stays with the CEO.
 */
export const M: MatrixRow = ['ALL', 'ALL', 'ALL', 'NONE'];
