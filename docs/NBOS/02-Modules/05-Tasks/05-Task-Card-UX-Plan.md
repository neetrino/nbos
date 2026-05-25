# Task Card UX Plan

> NBOS Platform - implementation plan for the compact, functional task card/sheet.

## Goal

The task card must be the main execution surface for a task: compact enough for daily use, but complete enough that users can change the task without leaving the board.

## Product Requirements

- Header shows task title, code, status, priority, readiness, and primary actions.
- Main task fields are editable inline: title, description, status, priority, start date, due date, and assignee.
- Completion rules are visible before completion and show concrete blockers when completion is denied.
- Checklists are operational: create checklist, add item, toggle item, remove item, and remove empty/obsolete checklist.
- Linked entities, parent task, subtasks, people, and dates are visible in a scan-friendly structure.
- Task discussion area is not a dead placeholder: until Messenger task chat is fully wired, it supports local notes for the current sheet session and clearly shows system activity from task metadata.
- Buttons must perform real actions or be disabled/hidden with a clear reason.
- Layout must stay compact on desktop and collapse cleanly on narrow screens.

## UX Shape

- Right sheet width: wide enough for a two-column execution surface, without covering the whole app unnecessarily.
- Left rail: task properties, rules, links, subtasks, and checklists.
- Right rail: task discussion/activity with a message composer.
- Visual style: NBOS minimal operational UI, low decoration, clear borders, restrained status colors, icon-first controls where the action is obvious.

## Implementation Notes

- Use existing task endpoints first: `PUT /tasks/:id`, status patches, link delete, checklist CRUD.
- Keep Messenger integration as a future backend wiring task; the current UI must still be useful by supporting local task notes and derived activity.
- Do not add broad task features here such as estimates, attachments, recurring setup, or advanced dependencies unless the backend model is ready.

## Acceptance Criteria

- A user can open a task, edit its core fields, start/hold/complete/reopen it, and see the board update through `onUpdate`.
- A user can manage checklist structure and items without refreshing.
- Completion blockers are shown in context and are cleared after successful updates.
- Task chat panel has usable composer/history behavior in the sheet session.
- Empty states are quiet and compact, not explanatory marketing blocks.
- Typecheck passes for the web app.
