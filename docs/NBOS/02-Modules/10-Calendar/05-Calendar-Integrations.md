# Calendar Integrations

Calendar is a focused surface. It integrates with other modules only where the date belongs to the main Calendar scope.

## CRM

CRM can create `Meeting` records.

Examples:

- Schedule Meeting from Deal;
- discovery call;
- offer presentation;
- demo.

Deal follow-up deadlines are not part of the main Calendar unless later accepted as a Meeting.

## Projects Hub

Projects Hub provides:

- Product deadline projections;
- Extension deadline projections;
- links from deadline item to Product/Extension card.

Project-level dates are not shown unless they represent Product/Extension delivery.

## Clients

Meeting can link to:

- Contact;
- Company;
- Client Portfolio;
- external Messenger conversation.

This helps Seller/PM prepare for client meeting.

## Messenger

Calendar does not replace Messenger.

Meeting card may link to:

- CRM Inbox conversation;
- Project WhatsApp Group;
- internal Deal/Product chat.

## Notifications

Notifications handles reminders.

Examples:

- meeting starts in 30 minutes;
- Product deadline approaching;
- Extension deadline missed.

## Finance

Finance dates are not shown in main Calendar.

Finance module may have its own calendar/grid views for:

- invoices;
- subscriptions;
- expenses;
- salary/payroll;
- partner payouts.

## Tasks

Task due dates are not shown in main Calendar.

Tasks module can have its own deadline view/calendar if needed.

## Support

Support SLA dates are not shown in main Calendar.

Support module owns SLA views and reminders.

## My Company

Team schedule/vacations are not in main Calendar for MVP.

If later needed:

- show availability only when scheduling a Meeting;
- keep HR/team schedule inside My Company.

## Google Calendar

Google Calendar sync is future work, not MVP.

Possible future behavior:

- NBOS client meetings sync to Google Calendar;
- Google events imported for conflict warning;
- user-level opt-in;
- no sync of Finance/Task/Support internals to the main Calendar by default.
