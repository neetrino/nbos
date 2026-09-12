# I18N HY terminology pilot

Date: 2026-09-12. Status: draft for owner review. HY is **not** in the language switcher and is still rejected by `PATCH /me/preferences`.

Canon: [07-Interface-Localization.md](../NBOS/01-Platform-Overview/07-Interface-Localization.md). Stage 7 of [I18N-IMPLEMENTATION-PLAN.md](./I18N-IMPLEMENTATION-PLAN.md).

This is a 50-100 line terminology sheet, not catalog enablement. Machine Armenian here is a starting proposal. Do not treat it as final. After owner approval we add `messages/hy/*`, ICU plurals, and only then expose the language.

## Short vs full

| Key idea   | EN                   | RU (current) | HY short       | HY full                 |
| ---------- | -------------------- | ------------ | -------------- | ----------------------- |
| Dashboard  | Overview / Dashboard | Обзор        | Ակնարկ         | Կառավարման կենտրոն      |
| Task       | Task                 | Задача       | Առաջադրանք     | Աշխատանքային առաջադրանք |
| New task   | New task             | Новая задача | Նոր առաջադրանք | Ստեղծել նոր առաջադրանք  |
| Project    | Project              | Проект       | Նախագիծ        | Նախագիծ                 |
| Product    | Product              | Продукт      | Արտադրանք      | Արտադրանք նախագծի մեջ   |
| Lead       | Lead                 | Лид          | Լիդ            | Հնարավոր հաճախորդ       |
| Deal       | Deal                 | Сделка       | Գործարք        | Վաճառքի գործարք         |
| Meeting    | Meeting              | Встреча      | Հանդիպում      | Հանդիպում օրացույցում   |
| Expense    | Expense              | Расход       | Ծախս           | Ծախսի քարտ              |
| Payment    | Payment              | Платёж       | Վճարում        | Ֆինանսական վճարում      |
| Invoice    | Invoice              | Счёт         | Հաշիվ          | Հաշիվ-ապրանքագիր        |
| Appearance | Appearance           | Оформление   | Տեսք           | Ինտերֆեյսի տեսք         |
| Language   | Language             | Язык         | Լեզու          | Ինտերֆեյսի լեզու        |
| My Account | My Account           | Мой аккаунт  | Հաշիվ          | Իմ հաշիվը               |
| My wallet  | My wallet            | Мой кошелёк  | Դրամապանակ     | Իմ դրամապանակը          |
| Save       | Save                 | Сохранить    | Պահել          | Պահպանել                |
| Cancel     | Cancel               | Отмена       | Չեղարկել       | Չեղարկել                |
| Sign Out   | Sign Out             | Выйти        | Ելք            | Դուրս գալ               |
| Sign in    | Sign in              | Войти        | Մուտք          | Մուտք գործել            |
| English    | English              | English      | English        | English                 |
| Russian    | Русский              | Русский      | Ռուսերեն       | Ռուսերեն                |
| Armenian   | Հայերեն              | Հայերեն      | Հայերեն        | Հայերեն                 |

## Frequent chrome

| EN                | RU                   | HY short            |
| ----------------- | -------------------- | ------------------- |
| Create            | Создать              | Ստեղծել             |
| Close             | Закрыть              | Փակել               |
| Details           | Детали               | Մանրամասն           |
| Open              | Открыть              | Բացել               |
| Search            | Поиск                | Որոնել              |
| Notifications     | Уведомления          | Ծանուցումներ        |
| Settings          | Настройки            | Կարգավորումներ      |
| Tasks             | Задачи               | Առաջադրանքներ       |
| Work Spaces       | Рабочие пространства | Աշխատատարածքներ     |
| Documents         | Документы            | Փաստաթղթեր          |
| Calendar          | Календарь            | Օրացույց            |
| Finance           | Финансы              | Ֆինանսներ           |
| Clients           | Клиенты              | Հաճախորդներ         |
| Partners          | Партнёры             | Գործընկերներ        |
| Password          | Пароль               | Գաղտնաբառ           |
| Overview          | Обзор                | Ակնարկ              |
| Bonuses           | Бонусы               | Բոնուսներ           |
| Payroll           | Зарплата             | Աշխատավարձ          |
| Activity          | Активность           | Գործունեություն     |
| Base              | Оклад                | Հիմնադրույք         |
| Incoming          | Входящие             | Մուտքային           |
| Paid              | Выплачено            | Վճարված             |
| Remaining         | Остаток              | Մնացորդ             |
| Potential         | Потенциал            | Պոտենցիալ           |
| In progress       | В работе             | Ընթացքում           |
| Next payroll      | Ближайшая выплата    | Հաջորդ վճարում      |
| Corrections       | Корректировки        | Ուղղումներ          |
| Change password   | Сменить пароль       | Փոխել գաղտնաբառը    |
| Active sessions   | Активные сессии      | Ակտիվ սեսիաներ      |
| Access restricted | Доступ ограничен     | Մուտքը սահմանափակ է |
| Export            | Экспорт              | Արտահանել           |

## Open questions for the owner

1. Dashboard: short **Ակնարկ** or keep **Dashboard** as a product name?
2. Lead: keep **լիդ** or use **հնարավոր հաճախորդ**?
3. Wallet: **դրամապանակ** or a compensation-specific word?
4. Payroll: **աշխատավարձ** or **վճարացուցակ**?
5. First HY enablement: short chrome only, or legal/finance long forms too?

Do not add `hy` to `WRITABLE_INTERFACE_LOCALES` or the switcher until these are answered and catalogs pass the same EN/RU acceptance.
