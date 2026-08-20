# Contact ↔ Product

> **Статус:** канон Accepted (2026-08-20). Runtime: schema + API + Связать `product` + Won seed + merge remap + WhatsApp invite resolve + Product Overview contacts — see Clients / CRM Implementation-Status.

## 1. What this is

**Contact ↔ Product** is a **membership link**, not a merge. A person (Contact) can belong to a specific delivery line (`Product`) inside a Project.

```
Contact (person)
  └── Project (brand / business)
        ├── Product A — primary / additional Contacts
        └── Product B — may have a different primary Contact
```

`Extension` does **not** own contacts. People for an Extension are the parent Product’s contacts.

## 2. Data model

| Piece           | Rule                                                                             |
| --------------- | -------------------------------------------------------------------------------- |
| Primary         | `Product.contactId` — **required** (same pattern as `Project.contactId`)         |
| Additional      | `ProductAdditionalContact` junction (`productId` + `contactId`)                  |
| Wire format     | Ordered `contactIds[]`: first id → primary FK, rest → junction                   |
| Roles / purpose | **None** in this slice (no Decision Maker / Technical). Billing stays on Company |

One Contact may be primary or additional on **many Products** in the same Project (e.g. director on Website, IT on App).

Product primary **may differ** from Project primary.

## 3. Cascade rules

| Event                                    | Rule                                                                                                                             |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Add / set Contact on Product             | Same person **must** be on the Project: primary if Project primary empty, else additional. Never fan-out Project → all Products. |
| Remove Contact from Product              | Stay on Project.                                                                                                                 |
| Remove Contact from Project              | Remove from **all** Products of that Project (no orphan memberships).                                                            |
| New Product (create / Won)               | Copy only `Project.contactId` → `Product.contactId`. Do **not** copy Project additional contacts.                                |
| Deal Won create Product                  | `Product.contactId = Deal.contactId ?? Project.contactId`. Do **not** overwrite an existing Product’s contacts.                  |
| Support ticket `contactId` + `productId` | Does **not** create Product membership.                                                                                          |

## 4. Lead «Связать» → контакт к работе

Attach types: `deal` \| `project` \| `product` \| `lead`.

- `type: 'product'` — attach to that Product (primary if empty, else additional), cascade up to Project, Trash source Lead (same as Project path).
- `type: 'project'` — Project only (unchanged).
- Deal attach: cascade to Project as today; **also** to one Product when the deal has a single clear anchor (`existingProductId`, else that deal’s order `productId`). If ambiguous — Project only.

UI labels: **Проект** searches Projects; **Продукт** searches Products. Do not label Project as «Продукт».

## 5. WhatsApp client invite

Group is Product-scoped. Invitee resolve order:

1. `Product.contactId`
2. `Project.contactId`
3. Deal contact (order / context deal)

Invite primary only (`Contact.phone`). Additional contacts are not invited. Changing primary does not auto-resend; use Product Settings Invite.

## 6. Contact merge

Remap in the same transaction as Project/Deal/Company:

- `Product.contactId`
- `ProductAdditionalContact`

If survivor is already primary on a Product, absorbed is not made a second primary (additional or drop if already linked).

## 7. UI

| Surface                                          | Behavior                                                                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Product Overview                                 | Product-scoped contacts picker (`product-contacts`). Must **not** edit Project contacts.                               |
| Project contacts                                 | Unchanged Project-scoped editor.                                                                                       |
| Contact card / portfolio Product Context         | Chips for Products where the contact is primary or additional — **membership only**, not every product on the project. |
| Drive hub / project list / Order contact display | Stay Project-scoped.                                                                                                   |
| Billing reminders                                | Stay Product WhatsApp **group** (not 1:1 Contact).                                                                     |

## 8. Permissions

Same as editing Project contacts / creating Contact: Seller, PM, CEO. No separate Product-contact ACL.

## 9. Out of slice

- Purpose on links
- Invite all additional / extra phones
- Extension-owned contacts
- Auto-membership from Support
- Default ticket contact from Product page
- Invoice/Subscription `contact` field (docs-only in Finance; not invented here)

## 10. Related docs

- Contacts card / merge: `02-Contacts.md`
- Products: `../02-Projects-Hub/03-Products-and-Extensions.md`
- Lead Связать: `../01-CRM/07-Lead-and-Deal-Merge.md`
- Relation picker: `../../03-Business-Logic/07-Relation-Field-Picker.md`
- WhatsApp: `../../06-Integrations/08-Product-WhatsApp-Groups.md`
- Entity matrix: `../../03-Business-Logic/06-Entity-Relationships.md`
