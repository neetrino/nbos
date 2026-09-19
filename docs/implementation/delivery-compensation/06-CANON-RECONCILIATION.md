# Delivery Compensation v2 — сверка со старым каноном

**Дата сверки:** 2026-09-19. **Модель не менялась:** правила остаются в [бизнес-каноне](../../NBOS/03-Business-Logic/11-Delivery-Compensation-Configurator.md). Этот файл закрывает хвост, на котором остановилась подготовка 2026-09-18: чтобы разработчик не принял старые формулировки за текущее правило.

Реализация по-прежнему не начата. Старые тексты про 70/30, Bonus-вкладку и четыре значения `From` оставлены как **legacy** для уже существующих продуктов и записей.

## Приоритет при чтении

В этом ограниченном scope побеждает v2:

- расчёт delivery-бонуса Product/Extension новой модели;
- каталог функций и конфигуратор;
- вкладки Product/Delivery (работа vs деньги);
- закрытость units/тарифов;
- `From = Network`.

Не побеждает и не переписывает: оклад, KPI, Sales engine кроме Network, funding/release/payroll, Wallet как проекция существующего ledger.

Конфликт «Core Entities всегда главнее» в Hub не применяется к перечисленному scope. Для остальной платформы иерархия Hub сохраняется.

## Что заменено, что остаётся

| Старое правило                                          | Для новой модели                                                                 | Для legacy-записей                                        |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Delivery developer pool 70/30                           | Не вызывается. Каждая роль имеет свои units × тариф                              | Сохраняется, автопересчёт запрещён                        |
| Сумма delivery-бонуса вручную / процент от заказа       | Конфигуратор + каталог                                                           | Сохраняется                                               |
| Bonus-вкладка в Product/Delivery                        | Вкладка «Функции»; суммы только Wallet/Finance                                   | Старый UI можно оставить на legacy-карточках до adoption  |
| Сотрудник видит чужие бонусы продукта (CEO на Delivery) | На Delivery — нет денег. CEO смотрит Finance                                     | Legacy RBAC Bonus-вкладки не расширять на v2              |
| `From`: Sales / Marketing / Partner / Client            | Плюс отдельный `Network` со стартовыми ставками Client                           | Исторические `SALES + NETWORKING` не переклассифицировать |
| Начисление delivery при Done/Acceptance                 | Плановый `BonusEntry` при первом Development; выплата по старым funding-правилам | Старые earned-period правила не ломать                    |

## Файлы, сверенные 2026-09-19

Точечные пометки добавлены, legacy-текст не вычищен целиком:

- `docs/NBOS/00-Documentation-Hub.md` — исключение приоритета в scope v2;
- `docs/NBOS/00-Technical-Decisions-By-Module.md` — строка Developer bonus;
- `docs/NBOS/00-Implementation-Roadmap.md` — документация готова, код не начат;
- `docs/NBOS/04-Roles-and-Access/01-Role-Definitions.md` — 70/30 только legacy;
- `docs/NBOS/03-Business-Logic/03-Bonus-Payroll-Logic.md` — Network и пометка delivery;
- `docs/NBOS/02-Modules/04-Finance/05-Bonus-and-Payroll.md` — 70/30 помечен как legacy;
- `docs/NBOS/02-Modules/01-CRM/02-Lead-Pipeline.md`, `03-Deal-Pipeline.md` — `From` включает Network;
- `docs/NBOS/02-Modules/02-Projects-Hub/03-Products-and-Extensions.md`, `07-Delivery-Board.md` — вкладка «Функции»;
- `docs/NBOS/05-UI-Specifications/07-Professional-Delivery-Card.md` — тот же tab order;
- `docs/NBOS/02-Modules/07-My-Company/00-My-Company-Overview.md` — каталог функций;
- `docs/NBOS/02-Modules/07-My-Company/07-Compensation-and-Policies.md` — роли delivery v2;
- `docs/NBOS/00-Delta-New-Description.md` — модель delivery закрыта в v2;
- `docs/AI-START-HERE.md` — приоритет конфликта в этом scope.

Ранее (2026-09-18) уже стояли баннеры в Hub, Core Entities, Bonus/Payroll, Wallet, Compensation.

## Намеренно не переписывалось

- Полные legacy-разделы 70/30 и Product Bonus Pool — нужны, пока старые продукты живут в системе.
- Seller-ставки Sales/Marketing/Partner/Client — не менялись; Network добавлен отдельно.
- Канал `NETWORKING` внутри Sales — это не `From = Network`.
- Калькулятор себестоимости/цены Seller, ежемесячные SEO/maintenance, публичные units — вне scope.
- Коммерческие AMD/unit и базовые units — владелец ещё не задал; выдумывать нельзя.

## Готовность документации

Документация пакета считается закрытой для передачи в разработку, когда:

1. Есть полный пакет `01`–`05` и этот журнал сверки.
2. Старые якорные файлы больше не утверждают 70/30, Bonus-вкладку и четыре `From` как единственное текущее правило без ссылки на v2.
3. Проверка ссылок/формата записана в [плане фаз](02-PHASES-AND-SLICES.md) § «Проверка документации».

Это **не** gate реализации и не разрешение production rollout.
