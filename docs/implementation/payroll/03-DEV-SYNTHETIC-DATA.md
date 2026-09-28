# Dev synthetic payroll data

**Invented:** 2026-09-28, on branch `feat/payroll-completion`.  
**Owner instruction:** this is the dev branch, so missing salaries and the test month may be invented and checked here.  
**Not production.** These figures are not company rates, not KPI targets, and not the real cutover month. Host `ep-sweet-dew` stays untouched.

## Test month

| Item                     | Invented value                                                   |
| ------------------------ | ---------------------------------------------------------------- |
| Payroll month under test | `2026-09`                                                        |
| Take-home currency       | AMD                                                              |
| Profile start            | `2026-09-01`, open-ended                                         |
| Profile status           | `ACTIVE` (inserted already approved so a draft run can seed)     |
| Marker                   | `nbos:dev-synthetic:2026-09-28` in `compensation_profiles.notes` |

An employee who already has an approved profile covering September 2026 is left unchanged. Everyone else who must appear on that month gets an invented take-home:

| Who                                                        | Invented take-home |
| ---------------------------------------------------------- | ------------------ |
| Active employee with the lowest id and no covering profile | 300,000.00 AMD     |
| Every other employee who must be seeded for `2026-09`      | 100,000.00 AMD     |

300,000 AMD is the salary-first example: a later test payment of 320,000 AMD is 300,000 salary and 20,000 named bonus. It is not that employee's real salary.

The empty September draft created before these profiles existed is removed only when it is still `DRAFT` and has no salary lines, so the same month can be created again with seed.

Applied on dev `2026-09-28`: 19 invented profiles (one at 300,000.00 AMD, eighteen at 100,000.00 AMD). One employee who already had a covering profile was left unchanged. The empty September draft was removed.

Browser check the same day, logged in as the Finance account, on run `0002abc5-8eff-4020-a61b-0f1e4fe78d25`:

1. The month opened as `DRAFT`, 19 lines, payable 2,060,000 AMD, paid 0.
2. Send to review moved it to `REVIEW`. Approve moved it to `APPROVED` and created 19 salary expense cards. Bonus releases stayed 0 because no matrix amount was chosen before approval.
3. On the Pay now board, the invented 300,000 AMD card (Neetrino AI Service, expense `004e9a64-8e50-4755-aa8c-5bad27741389`) accepted 100,000 AMD. The card showed 100,000 paid and 200,000 remaining.
4. Removing that payment returned the card to 0 paid and 300,000 remaining.
5. A second payment of 50,000 AMD showed 50,000 paid and 250,000 remaining. Removing it returned the card to unpaid.
6. The payroll page then showed Approved, 19 expenses, payable 2,060,000 AMD, paid 0, remaining 2,060,000 AMD.

The 2,060,000 total includes the invented profiles and the one profile that was already on file. No payment was left on the shared month. Approval cannot return the month to draft. The named-bonus split of 320,000 was not entered in this browser session because the approved cards have no bonus releases.

Dev schema: `prisma migrate deploy` applied these pending migrations on `ep-nameless-term` only:

- `20260926200000_ats_call_lid`
- `20260927190000_video_meeting_duration_guard`
- `20260927233000_bonus_entry_sales_invoice_employee_slot_unique`
- `20260928010000_sales_bonus_policy_effective_to`
- `20260928020000_bonus_entry_sales_unslotted_role_unique`

## Amounts already fixed by the independent tests

These are the same figures as `payroll-p6-s2-expected.amounts.ts`. They are illustrations for the dev check, not a live invoice unless a later step loads one.

| Case                                                          | Invented result                                                     |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| Invoice 210,000 paid 100,000, then 100,000, then 10,000       | Remaining 110,000, then 10,000, then 0. Accrual stays 0 until PAID. |
| After PAID, Sales 8% and 2% under the 300,000 order cap       | Seller 16,800.00, assistant 4,200.00                                |
| Order 10,000,000 at 8:2, cap 300,000                          | Seller 240,000, assistant 60,000, excess 700,000                    |
| Development plan 200,000, released 170,000                    | Ordinary remaining 30,000                                           |
| Cash 320,000 against salary 300,000 and included bonus 60,000 | Salary 300,000, named bonus 20,000, bonus still unpaid 40,000       |

## Tax-free invoice

Created on dev `2026-09-28` by a direct insert. No payment was recorded, so sales accrual did not run and no WhatsApp call was made.

| Field                       | Value             |
| --------------------------- | ----------------- |
| Code                        | `DEV-FREE-210000` |
| Amount                      | 210,000.00 AMD    |
| Tax status                  | `TAX_FREE`        |
| Money status                | `NEW`             |
| Official accountant request | not sent          |
| Client notifications        | off               |
| Due date                    | 2099-12-31        |

Accountant WhatsApp is sent only for `TAX` invoices that are awaiting payment. This card is neither.

## Isolated postgres fixtures

Marker `nbos:dev-synthetic:payroll-postgres`, code prefix `DEV-PAY-PG`. Months are claimed only when free, in 2091–2096. Payment date `2098-06-15`. These rows are created and deleted by the tests. They are not the September 2026 run.

Checked on 2026-09-28 from the repository root: concurrent payments, concurrent bonus assignment, concurrent approval, the 320,000 cash cycle with a 20,000 refund, a journal failure inside the payment, carry restore, and invoice 210,000. Eight tests passed. The tests delete their own rows.

## February 2020 browser bonus

Marker `nbos:dev-synthetic:payroll-browser-bonus`, employee Dev Browserbonus, month `2020-02`. Salary profile 300,000 AMD covers only that month. Two delivery accruals, 40,000 and 20,000, earned `2020-01`. September 2026 was not edited.

Payroll run `630b2ad4-89e0-402e-a73b-ef38704deb0e` is approved. Payment `c2a4f33c-c333-4072-b2d8-9d48383b6fcb` is 320,000 with salary 300,000 and bonus part B 20,000. A browser refund of 20,000 left salary paid and restored part B. Expense paid is 300,000. These rows stay on dev until a later cleanup of this marker only.

## Still not invented

The real cutover month, production salaries, production KPI targets, and Delivery norms stay unset. Nothing here is applied to production.
