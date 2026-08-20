Chat 1
Foundation + Audit

Chat 2
Credentials + Auth + Policy

Chat 3
Capabilities + Tasks

Chat 4
REST + MCP

Chat 5
Providers + Models

Chat 6
Admin UI

Chat 7
Security + regression

Chat 8
Final 700-point verification

---

Изучи новую каноническую документацию модуля:
docs/NBOS/02-Modules/21-AI-Platform/
Мы спроектировали новый AI Platform для NBOS с нуля: External Agents, REST + MCP, безопасные capabilities/scopes, actor-aware Audit, Workspace/Tasks access, OpenAI/Anthropic providers, model catalog/routing, Internal Agent foundation, approvals, prompts/context/memory boundaries, usage/evaluation и AI administration UI.
Твоя задача — реализовать Phase 1 полностью по документации, используя как основной executable checklist:
docs/NBOS/02-Modules/21-AI-Platform/10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md
Правила работы:

- Сначала внимательно изучи все документы 21-AI-Platform, связанные текущие NBOS docs и реальный runtime/code.
- Не считай старую реализацию автоматически правильной: если docs/runtime расходятся, сначала проведи reconciliation согласно checklist.
- Выполняй пункты checklist последовательно и отмечай статус каждого: [x], [~], [!].
- Не создавай параллельную архитектуру и не обходи существующие domain services прямыми Prisma writes.
- External REST и MCP должны использовать один Actor → Policy → Capability → Domain Action → Audit foundation.
- Сохраняй полную обратную совместимость существующих human RBAC, Tasks, Drive, Audit, API/worker/scheduler.
- Не упрощай security/isolation/idempotency/negative tests.
- tasks.create и ограниченный tasks.update должны управляться отдельными permissions; tasks.delete и force-complete в Phase 1 запрещены.
- Не останавливайся после создания структуры/DTO/API: доведи Phase 1 до всех tests, UI, migrations, docs synchronization и Final Acceptance из checklist.
- Если найдёшь реальное противоречие, которое невозможно безопасно решить на основании canon/runtime, зафиксируй его как [!] BUSINESS DECISION и объясни конкретно, что требуется решить. В остальных случаях принимай senior-level техническое решение самостоятельно.
  Definition of Done: все применимые пункты Phase 1 checklist реализованы, протестированы и подтверждены evidence; существующий NBOS не сломан; External Agent реально может подключиться по REST/MCP и безопасно работать с разрешёнными Workspace/Tasks.
