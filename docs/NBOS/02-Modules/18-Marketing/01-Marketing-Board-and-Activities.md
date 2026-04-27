# Marketing Board and Activities

> NBOS Marketing - рабочая доска маркетолога, карточки активностей, запуск рекламы и связь с расходами.

## Назначение

`Marketing Board` - главный ежедневный экран маркетолога.

Он нужен, чтобы маркетинг не вёл идеи, посты, рекламы и запуски в хаотичных чатах или таблицах.

## Board stages

Канонические стадии:

```text
Idea -> Preparing -> Ready -> Launched -> Finished -> Archived
```

### Idea

Идея ещё не готова к работе.

Примеры:

- попробовать рекламу нового продукта;
- сделать пост о кейсе;
- запустить List.am account для новой категории;
- подготовить story/reel.

### Preparing

Маркетолог работает над материалами:

- текст;
- креатив;
- audience;
- budget draft;
- channel/account;
- UTM/identifier later.

### Ready

Активность готова к запуску, но ещё не запущена.

Перед переходом в `Launched` система проверяет обязательные поля.

### Launched

Активность запущена.

На этом этапе она становится доступной в CRM attribution `Which one`, если её channel подходит.

### Finished

Активность завершена, но ещё доступна для аналитики.

### Archived

Историческая активность. Не показывается в новых Lead attribution списках по умолчанию, но сохраняется для старых лидов/сделок.

## Marketing Activity card

Карточка активности хранит:

- title;
- channel;
- activity type;
- marketing account, если нужен;
- status/stage;
- owner;
- description;
- budget;
- currency;
- start date;
- end date;
- expected payment date;
- linked expense card;
- linked expense plan, если activity связана с recurring account;
- leads count;
- MQL count;
- SQL count;
- deals won count;
- revenue attributed;
- notes/files.

## Activity types

Примеры типов:

- ad campaign;
- SMM post;
- story/reel;
- List.am promotion;
- website landing;
- SEO work;
- offline activity;
- other.

## Launch process

Когда маркетолог переводит карточку в `Launched`, система открывает launch popup.

Обязательные поля:

- channel;
- title;
- start date;
- end date, если activity имеет срок;
- budget, если это paid activity;
- expected payment date, если создаётся expense;
- account/page/phone, если channel требует account.

Процесс:

```text
Marketing Activity -> Mark as Launched
  -> fill launch fields
  -> activity becomes available for attribution
  -> if budget exists, create/propose Finance Expense Card
```

## Finance expense creation

Если при запуске указан budget, NBOS создаёт или предлагает создать `Expense Card`.

Поля Expense Card:

- amount = budget;
- category = Marketing;
- channel = activity channel;
- linked marketing activity;
- expected payment date;
- status = Planned / Upcoming;
- description from activity.

Для Facebook/Instagram:

```text
start date = today by default
end date = selected by marketer
expected payment date = end date or end date + configured delay
```

Причина: такие платформы часто списывают деньги после периода рекламы, а не в момент запуска.

## Launched list

`Launched` не обязательно должен быть отдельным экраном. Это может быть saved view/filter на Marketing Board.

Показывает:

- active campaigns;
- active List.am accounts;
- current budget;
- dates;
- linked expenses;
- leads generated;
- issues.

## Stage gates

### Move to Launched

Нельзя запустить paid activity без:

- channel;
- title;
- start date;
- budget;
- expected payment date or explicit no-expense reason.

Для channel-specific rules:

- `List.am` требует Marketing Account;
- `Instagram/Facebook` требует Activity name and Organic option separately;
- `Website` требует page/form/campaign label, если known.

### Move to Finished

Перед завершением желательно заполнить:

- end date;
- actual spend if known;
- result note;
- linked expense status, если был budget.

Не нужно блокировать завершение, если Finance ещё не оплатил expense. Finance lifecycle живёт в Finance.

## Files and creative assets

Marketing Activity может иметь файлы:

- creative images;
- videos;
- text drafts;
- screenshots;
- invoice/receipt files;
- analytics screenshots.

Файлы должны храниться через Drive logical links.

## Tasks

Marketing Activity может создавать tasks:

- prepare creative;
- approve copy;
- launch campaign;
- check results;
- close report.

Задачи живут в Tasks/Work Space, Marketing Activity только связывает их.
