# Marketing Accounts and Attribution

> NBOS Marketing - каналы, аккаунты, `From / Where / Which one` и связь источников с CRM.

## Назначение

Marketing Accounts нужны, чтобы точно понимать, какой конкретный источник принёс lead.

Пример:

```text
Where = List.am
Which one = List.am Account 2 / phone +374...
```

или:

```text
Where = Instagram
Which one = Spring Promo Reel
```

## Channels

Channel - верхний уровень источника.

Примеры:

- List.am;
- Instagram;
- Facebook;
- Website;
- SEO;
- Google;
- Offline;
- Other.

Channels живут в `Marketing Settings`, а не как отдельный ежедневный экран.

## Marketing Account

Marketing Account - конкретный аккаунт/номер/страница внутри канала.

Примеры:

```text
List.am Account 1
  phone number: +374...
  linked finance expense plan: List.am weekly payment

Instagram Main Page
  handle: @...
```

Поля:

- channel;
- account name;
- identifier;
- phone number, если есть;
- status: Active / Paused / Archived;
- linked finance expense plan;
- default cost, если finance plan отсутствует;
- notes;
- owner.

## Finance Expense Plan link

Marketing Account может быть связан с Finance Expense Plan.

Это особенно важно для List.am:

```text
Marketing Account: List.am Account 5
Finance Expense Plan: List.am Account 5 weekly subscription
```

Связь должна быть ручной, но управляемой.

Почему не auto-link:

- названия могут отличаться;
- один expense plan может быть создан раньше account;
- account может появиться сначала в Marketing;
- finance data нельзя связывать гаданием.

## Add new List.am account process

### Вариант 1: сначала Finance

```text
Finance -> Create Expense Plan
Marketing -> Add Marketing Account
  Channel = List.am
  Phone = ...
  Link Expense Plan = selected from Finance plans
```

### Вариант 2: сначала Marketing

```text
Marketing -> Add Marketing Account
  Channel = List.am
  Phone = ...
  Finance link = missing

Finance -> Create Expense Plan later
Marketing -> Link Expense Plan
```

Если Finance link отсутствует:

```text
Attribution works: Yes
Spend tracking: Missing finance link
```

## From / Where / Which one rules

CRM fields:

```text
From
Where
Which one
```

Marketing controls the options for `Where` and `Which one`.

### From

Examples:

- Marketing;
- Seller;
- Partner;
- Existing Client;
- Other.

When `From = Marketing`, `Where` and `Which one` become required before moving Lead/Deal to the next meaningful stage.

### Where

Marketing channel.

### Which one

Dynamic list based on `Where`.

| Where       | Which one source                                      |
| ----------- | ----------------------------------------------------- |
| `List.am`   | Active Marketing Accounts for List.am                 |
| `Instagram` | Launched Instagram Activities + Organic / Not from ad |
| `Facebook`  | Launched Facebook Activities + Organic / Not from ad  |
| `Website`   | Website forms/pages/campaign labels                   |
| `SEO`       | Organic / page / keyword later                        |

## Organic / Not from ad

For social channels, always show:

```text
Organic / Not from ad
```

It means the client came from the channel, but not from a specific paid campaign.

## Lead attribution lifecycle

```text
Lead created
  -> From / Where / Which one selected
  -> Lead moves through CRM
  -> Deal created
  -> attribution copied from Lead
  -> Deal Won
  -> revenue attributed back to Marketing source
```

If Deal is created manually, marketing fields must be filled manually before progressing to the next stage.

## Attribution Review

This screen shows records that need cleanup:

- lead missing From;
- lead From = Marketing but Where missing;
- lead Where requires Which one but empty;
- deal created manually without marketing fields;
- archived source used on active deal;
- suspicious "Other" usage.

Actions:

- open lead/deal;
- quick set source;
- bulk update where safe;
- mark as unknown with reason.

## Future automation

Later NBOS can auto-detect source:

- call tracking for List.am phone numbers;
- UTM parameters;
- website forms;
- external ad platform integrations;
- messenger source metadata.

But MVP must work manually and reliably.
