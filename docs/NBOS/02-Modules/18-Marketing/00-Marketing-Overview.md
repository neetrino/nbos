# Marketing Overview

> NBOS Platform - рабочий модуль маркетингового отдела: маркетинговые активности, каналы, аккаунты, attribution, расходы и связь с CRM/Finance.

## Назначение

`Marketing` - это не только аналитика лидов. Это рабочее место маркетингового отдела.

Модуль отвечает за:

- планирование маркетинговых активностей;
- запуск рекламных кампаний;
- ведение маркетинговых каналов и аккаунтов;
- связь маркетинговых расходов с Finance;
- передачу корректного источника в Lead/Deal;
- анализ того, какие каналы и активности реально приводят лиды, сделки и revenue.

Главный принцип:

```text
Marketing creates and tracks demand.
CRM processes leads and deals.
Finance tracks money.
Dashboard shows what needs attention.
```

## Граница модуля

### Marketing отвечает за

- Marketing Board;
- Campaigns / Activities;
- Marketing Accounts;
- Attribution source data;
- Marketing Dashboard;
- Attribution Review;
- связь с Finance Expense;
- marketing KPI input.

### Marketing не отвечает за

- Sales pipeline after lead qualification;
- Deal stage gates;
- Partner commission;
- payroll calculation;
- full P&L;
- external messenger conversation handling.

## Основные рабочие экраны

```text
Marketing
  Marketing Board
  Attribution Review
  Marketing Dashboard
  Marketing Settings
```

### Marketing Board

Главная доска работы маркетолога.

Стадии:

```text
Idea -> Preparing -> Ready -> Launched -> Finished -> Archived
```

Здесь создаются и двигаются маркетинговые активности:

- Instagram ad;
- Facebook ad;
- List.am account promotion;
- Website campaign;
- SMM activity;
- SEO activity;
- offline/other campaign.

### Attribution Review

Экран для лидов и сделок с неполными marketing fields.

Примеры:

- `From = Marketing`, но `Where` не заполнен;
- `Where = Instagram`, но `Which one` не выбран;
- Deal создан вручную без source;
- Lead пришёл из List.am, но не выбран account.

### Marketing Dashboard

Короткая аналитика маркетинга:

- leads by channel;
- leads by activity/account;
- MQL / SQL / Won;
- revenue by channel;
- spend where available;
- CPL/ROI only where spend exists.

### Marketing Settings

Настройки и справочники внутри Marketing:

- Channels;
- Accounts;
- Attribution options;
- Activity types;
- default expense rules.

`Channels`, `Accounts` и `Attribution Rules` не должны быть главными ежедневными экранами. Это настройки, куда заходят не каждый день.

## Core entities

```text
Marketing Channel
  -> Marketing Account
    -> Marketing Activity
      -> Lead Attribution
        -> CRM Lead
          -> CRM Deal
            -> Revenue Attribution

Marketing Activity
  -> Finance Expense Card / Expense Plan
```

### Marketing Channel

Канал привлечения:

- Instagram;
- Facebook;
- List.am;
- Website;
- SEO;
- Google;
- Offline;
- Other.

### Marketing Account

Конкретный аккаунт/источник внутри канала.

Примеры:

- List.am Account 1 / phone number;
- List.am Account 2 / phone number;
- Instagram page;
- Facebook page;
- website form;
- phone number.

### Marketing Activity

Конкретный рекламный запуск или маркетинговая активность.

Примеры:

- Instagram Spring Promo Reel;
- Facebook Website Discount Ad;
- List.am weekly active account;
- Website landing page campaign.

### Lead Attribution

Связь лида/сделки с источником:

```text
From = Marketing
Where = Instagram
Which one = Spring Promo Reel
```

или:

```text
From = Marketing
Where = List.am
Which one = List.am Account 3 / phone +374...
```

## From / Where / Which one

CRM Lead и Deal используют marketing fields:

```text
From
Where
Which one
```

Правило:

```text
Which one depends on Where.
```

Примеры:

| Where       | Which one показывает                                         |
| ----------- | ------------------------------------------------------------ |
| `List.am`   | список Marketing Accounts типа List.am                       |
| `Instagram` | список launched Instagram activities + Organic / Not from ad |
| `Facebook`  | список launched Facebook activities + Organic / Not from ad  |
| `Website`   | website forms/pages/campaigns                                |
| `SEO`       | organic source / page / keyword later                        |

## Organic / Not from ad

Для социальных каналов обязательно нужен пункт:

```text
Organic / Not from ad
```

Он используется, когда клиент пришёл из Instagram/Facebook, но не по конкретной рекламе:

- раньше видел активность;
- подписан на страницу;
- нашёл профиль сам;
- написал без рекламного клика.

## Связь с CRM

Marketing не заменяет CRM.

```text
Marketing Activity -> Lead Attribution -> CRM Lead -> Deal
```

CRM использует Marketing для корректного источника, но Sales продолжает работать с Lead/Deal внутри CRM.

## Связь с Finance

Marketing Activity может создавать или связывать Finance Expense.

```text
Marketing Activity launched
  -> budget / start date / end date / expected payment date
  -> Finance Expense Card
  -> payment tracked in Finance
```

Marketing Account может быть связан с Finance Expense Plan.

Пример List.am:

```text
Marketing Account: List.am Account 1
Linked Finance Expense Plan: List.am Account 1 weekly payment
```

Если Finance link отсутствует, attribution всё равно работает, но spend/CPL/ROI не считаются точно.

## Связь с My Company

My Company хранит KPI policies для маркетологов.

Marketing даёт фактические данные:

- MQL;
- SQL;
- leads by channel;
- conversion;
- revenue attribution;
- campaign performance.

Payroll/bonus calculation остаётся в Finance/My Company, не в Marketing.

## Sidebar placement

Marketing должен быть отдельным модулем, потому что это самостоятельное рабочее место отдела.

Каноническое место:

```text
Dashboard
CRM
Marketing
Project Hub
...
```

CRM и Marketing связаны, но не являются одним и тем же процессом.
