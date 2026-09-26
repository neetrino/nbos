# UI կոմպոնենտներ և ոճավորում (NBOS)

---

## 1. UI կառուցվածք

| Շերտ           | Տեղադրություն                                                        | Նպատակ                                        |
| -------------- | -------------------------------------------------------------------- | --------------------------------------------- |
| Layout         | `apps/web/src/components/layout/` (`AppLayout`, `Sidebar`, `Topbar`) | Նավիգացիա, shell                              |
| UI primitives  | `apps/web/src/components/ui/`                                        | shadcn/Base UI style կոմպոնենտներ             |
| Shared widgets | `apps/web/src/components/shared/`                                    | Վերօգտագործվող UI                             |
| Account        | `apps/web/src/components/account/`                                   | Հաշվի UI                                      |
| Feature UI     | `apps/web/src/features/*`                                            | Դոմեյն-կենտրոնացված էկրաններ, dialogs, tables |

---

## 2. Դիզայն համակարգ

- **Tailwind CSS 4** (`apps/web/package.json`)։
- **class-variance-authority**, **tailwind-merge**, **clsx** — utility class composition (`cn` helper՝ `apps/web/src/lib/utils.ts` ենթադրաբար)։
- **lucide-react** պատկերակներ։
- **@base-ui/react** և package.json-ում **shadcn** CLI package — tipical shadcn stack։

---

## 3. Գլոբալ ոճեր

- `apps/web/src/app/globals.css` — գլոբալ CSS (Tailwind 4 pipeline)։
- Root layout font variables՝ `apps/web/src/app/layout.tsx` (Geist, Inter, JetBrains Mono)։

---

## 4. Թեմա (dark/light)

- `next-themes` dependency package.json-ում — **օգտագործման վայրերը** այս վերլուծությամբ ամբողջությամբ չեն քարտեզագրվել — **Partial/Unknown** առանց grep ամբողջ `ThemeProvider`։

---

## 5. Loading / skeleton

Յուրաքանչյուր feature իրականացնում է սեփական loading state-երը — **կենտրոնացված pattern չի փաստագրված** այս ֆայլում առանց համապատասխան `loading.tsx` ֆայլերի որոնման։

---

## 6. Responsive

Tailwind responsive class-ներ feature կոմպոնենտներում — ստանդարտ մոտեցում։

---

## 7. Մեծ կոմպոնենտների և բիզնես-լոգիկայի ռիսկ

- `apps/web/src/features/` թղթապանակը **մեծ է** — հավանական է **խառը** UI + data fetching մեկ ֆայլում։
- **Խորհուրդ**՝ նոր կոդում տարանջել `hooks/` (data) և `components/` (render) նույն feature-ի ներսում։

---

## 8. Կրկնված UI pattern-ներ

- Sidebar child nav + permission checks — կրկնվող structure `NAV_ITEMS` array-ում (`Sidebar.tsx`) — **ընդունելի**, բայց երկար ֆայլ (~570+ տող) — **տեխնիկական պարտք** ընթերցման համար։

---

## 9. Հիմնական կոմպոնենտների պատասխանատվություն

| Կոմպոնենտ   | Ֆայլ                              | Props / տվյալ               | Ուր է օգտագործվում |
| ----------- | --------------------------------- | --------------------------- | ------------------ |
| `AppLayout` | `components/layout/AppLayout.tsx` | `children`                  | `(app)/layout.tsx` |
| `Sidebar`   | `components/layout/Sidebar.tsx`   | pathname, permissions hooks | `AppLayout`        |
| `Topbar`    | `components/layout/Topbar.tsx`    | (ստուգել ֆայլը)             | `AppLayout`        |

---

## 10. Rich text

- `@tiptap/*` packages — փաստաթղթերի / editor UI համար (մանրամասն feature-ով)։

---

## 11. UI cleanup պլան (առաջարկ)

1. `Sidebar.tsx` բաժանել `nav-config.ts` + փոքր subcomponents։
2. Dead UI dependencies audit (օր. եթե `next-themes` չի օգտագործվում — հեռացնել)։
3. Storybook **չկա** — եթե անհրաժեշտ է, ավելացնել որպես առանձին նախագիծ (այս փաստաթուղթը չի ավելացնում package)։

---

_Հիմք՝ `apps/web/src/components`, `features`, `package.json`, root `layout.tsx`, 2026-05-01։_
