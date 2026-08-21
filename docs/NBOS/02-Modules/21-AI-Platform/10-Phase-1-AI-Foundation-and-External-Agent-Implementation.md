# Phase 1 — AI Foundation + External Agent + Provider/Model Foundation Implementation

> Canon-linked executable implementation checklist.
>
> Every numbered item must be verified against runtime, tests and the canonical documents in `21-AI-Platform`.

## Status format

- `[ ]` not started
- `[~]` partial
- `[x]` verified complete
- `[!]` blocked / business decision

A point is complete only when implementation, negative paths, tests and documentation align.

---

# A. Canon and runtime reconciliation

1. [x] Read `00-AI-Platform-Overview.md`.
2. [x] Read `01-AI-Actors-Identity-and-Access.md`.
3. [x] Read `02-AI-Capability-and-Action-Layer.md`.
4. [x] Read `03-External-Agent-Access.md`.
5. [x] Read `04-Internal-AI-Runtime.md`.
6. [x] Read `05-AI-Data-Security-and-Audit.md`.
7. [x] Read `06-AI-Providers-Models-and-Routing.md`.
8. [x] Read `07-AI-Admin-and-Connections-UX.md`.
9. [x] Read `08-External-Agent-Protocols-REST-and-MCP.md`.
10. [x] Read `09-External-Agent-API-and-MCP-Contract.md`.
11. [x] Read `11-Internal-Agent-Lifecycle-and-Assignments.md`.
12. [x] Read `12-AI-Prompts-Context-Memory-and-Knowledge.md`.
13. [x] Read `13-AI-Risk-and-Approval-Policy.md`.
14. [x] Read `14-AI-Evaluation-Usage-Cost-and-Observability.md`.
15. [x] Read `15-Customer-Facing-AI-Policy.md`.
16. [x] Read `99-AI-Cleanup-Register.md`.
17. [x] Read `00-Technical-Decisions-By-Module.md` global technical rules.
18. [x] Read Platform Access Foundation canon/runtime.
19. [x] Read Tasks canon and Task cleanup register.
20. [x] Read Drive canon relevant to Task artifacts.
21. [x] Read Audit runtime and schema.
22. [x] Read existing authentication/RBAC runtime.
23. [x] Read current integration/provider patterns without conflating them with AI Agent identities.
24. [x] Compare current `TaskStatusEnum` runtime with current Tasks canon.
25. [x] Confirm runtime semantics for Start Task.
26. [x] Confirm runtime semantics for Submit Review.
27. [x] Confirm canonical task discussion/comment storage.
28. [x] Confirm canonical task attachment/Drive linking flow.
29. [x] Confirm Work Space Product/Extension/Project relationship semantics.
30. [x] Confirm current API response/error/pagination conventions.
31. [x] Confirm current secret storage/encryption mechanisms usable for provider credentials.
32. [x] Confirm current BullMQ/worker propagation patterns for ActorContext/correlation data.
33. [x] Document all canon/runtime conflicts found before implementing around them.
34. [x] Classify each conflict as OK/PARTIAL/MISSING/STALE/BUSINESS DECISION.
35. [x] Produce a touched-module map for Phase 1.

Evidence: `17-Phase-1-Chat-1-Handoff.md`.

# B. Phase 1 scope lock

36. [x] Lock Phase 1 as shared AI foundation + External Workspace Agent + provider/model/internal-agent foundation.
37. [x] Confirm External Agent may receive `tasks.create` only via explicit grant.
38. [x] Confirm External Agent may receive `tasks.update` only via explicit grant.
39. [x] Define exact allowlisted fields for `tasks.update` from current Tasks domain rules.

Runtime: `apps/api/src/modules/tasks/task-agent-update.allowlist.ts`. Allowed: `title`, `description`, `priority`, `dueDate`. Forbidden: `status`, `workspaceId`, assignment, personal-board, `completionRules`, and the rest of `UpdateTaskDto`. Derived from `TasksService.update` rules, not from an agent DTO. 40. [x] Confirm External Agent has no `tasks.delete` capability in Phase 1. 41. [x] Confirm External Agent has no unrestricted arbitrary status mutation capability. 42. [x] Confirm External Agent cannot force final task completion when human review is required. 43. [x] Confirm REST and MCP are both Phase 1 deliverables. 44. [x] Confirm OpenAI provider connection foundation is Phase 1. 45. [x] Confirm Anthropic provider connection foundation is Phase 1. 46. [x] Confirm model-catalog synchronization is Phase 1. 47. [x] Confirm FIXED model policy is Phase 1. 48. [x] Confirm PRIMARY_FALLBACK model policy is Phase 1. 49. [x] Confirm Internal Agent entity/lifecycle foundation is Phase 1. 50. [x] Confirm full internal employee AI chat runtime is NOT Phase 1. 51. [x] Confirm production Messenger auto-reply runtime is NOT Phase 1. 52. [x] Confirm production RAG/vector infrastructure is NOT Phase 1. 53. [x] Confirm adaptive/learned model routing is NOT Phase 1. 54. [x] Confirm automatic activation of newly discovered models is forbidden. 55. [x] Confirm customer-facing autonomous high-risk actions are NOT Phase 1.

Item 39 is locked as Chat 3 work: derive the allowlist from `TasksService` update DTO / domain rules, not from agent controllers.

# C. Actor foundation

56. [x] Define normalized `ActorType` contract.
57. [x] Support `USER` actor.
58. [x] Support `EXTERNAL_AGENT` actor.
59. [x] Support `INTERNAL_AI` actor.
60. [x] Support `SYSTEM` actor where appropriate.
61. [x] Support `AUTOMATION` actor where appropriate.
62. [x] Define normalized `ActorContext` shared by policy/audit/capabilities.
63. [x] Include stable actor id/type/display identity.
64. [x] Include organization/tenant context where applicable.
65. [x] Add `onBehalfOf` support.
66. [x] Add channel/source metadata support.
67. [x] Add correlation/request id support.
68. [x] Ensure machine actors are never represented as fake Employees.
69. [x] Preserve employee actor behavior without widening existing access.
70. [x] Add actor normalization unit tests.

Runtime: `packages/shared/src/actor/*`. Tests: `normalize-actor-context.test.ts`.

# D. Audit actor migration

71. [x] Design backward-compatible AuditLog evolution.
72. [x] Preserve all existing audit history.
73. [x] Add actor type/id fields or equivalent normalized structure.
74. [x] Keep legacy `userId` compatibility where required.
75. [x] Allow AuditLog creation for non-Employee actors.
76. [x] Update AuditService logging interface to accept ActorContext.
77. [x] Update actor display resolution for Employee and AI actors.
78. [x] Add `onBehalfOf` audit fields/context.
79. [x] Add channel/protocol/source audit metadata where useful.
80. [x] Add correlation/execution id fields/context.
81. [x] Add safe credential/client metadata only where useful.
82. [x] Prevent raw bearer tokens from audit.
83. [x] Prevent provider API keys from audit.
84. [x] Prevent full sensitive prompt/context persistence by default.
85. [x] Audit External Agent lifecycle changes.
86. [~] Audit provider connection lifecycle changes.
87. [~] Audit model activation/deactivation.
88. [~] Audit model policy changes.
89. [~] Audit Internal Agent lifecycle changes.
90. [x] Audit capability/scope changes.
91. [~] Audit approval lifecycle.
92. [x] Add migration tests using representative historical AuditLog rows.
93. [x] Add human audit regression tests.
94. [x] Add External Agent audit tests.
95. [x] Add Internal AI audit contract tests.

Write path and display contract exist in `AuditService.log({ actor })`. Chat 2 closed 85 and 90 through `AiPlatformAuditService`; the remaining emitters (86–89, 91) land with the owning entities in Chats 5/7. Every lifecycle, credential, grant and scope mutation passes its own transaction client to `AuditService.log`, so the state change and its audit row commit together and an un-audited active grant or credential is unreachable. Machine display names resolve through the batched `AuditActorLookups` registered by `AiPlatformModule` (`audit-actor.resolver.test.ts`).

# E. External Agent persistence

96. [x] Add External Agent model/entity.
97. [x] Add stable id.
98. [x] Add human-readable name.
99. [x] Add description/purpose.
100.  [x] Add owner/creator Employee relation.
101.  [x] Add ACTIVE/DISABLED/REVOKED/EXPIRED semantics.
102.  [x] Add optional agent expiry.
103.  [x] Add lastUsedAt.
104.  [x] Add safe last-client/IP metadata only if useful.
105.  [x] Add createdAt/updatedAt.
106.  [x] Add appropriate indexes.
107.  [x] Ensure agent identity remains stable through credential rotation.
108.  [x] Add persistence tests.

Runtime: `packages/database/prisma/schema/ai-platform.prisma`, `apps/api/src/modules/ai-platform/agents/*`. `EXPIRED` is derived from `expiresAt` at read time rather than stored, so a lapsed agent cannot appear active through a stale status column. `REVOKED` is terminal through one mechanism used by every writer: `agent-row-lock.ts` takes `SELECT ... FOR UPDATE` on the agent row inside the transaction and only then reads state, and `resolveAgentState` reads `revokedAt` as well as the status column. Lifecycle transitions, credential issuance and grant/scope writes all go through that lock, so a concurrent revoke can neither be overtaken nor walked back. Each of those mutations also writes its audit row through the same transaction client, so no lifecycle change can commit without its trail. Indexes cover status, owner and every employee foreign key (migration `20260821170000`, a single transactional migration after the squash), so offboarding an employee does not scan the agent tables. Chat 3 added a real-database smoke (`agent-foundation.int.test.ts`): issue → authenticate → grant → scope, plus grant/scope versus revoke, which is what lifts item 108 out of `[~]`.

Item 108 is `[x]` after Chat 3: `agent-foundation.int.test.ts` exercises issue → authenticate → grant → scope against the real dev database, and the grant/scope-versus-revoke race sits in the same opt-in suite as `agent-credential.concurrency.int.test.ts`. Unit tests against the mocked Prisma client remain: `external-agent.service.test.ts`, `external-agent-state.test.ts`.

# F. External Agent credentials

109. [x] Create separate External Agent Credential model.
110. [x] Generate cryptographically strong opaque tokens.
111. [x] Store only secure token hash/derived verifier.
112. [x] Store safe prefix/key id for lookup/display.
113. [x] Show raw token only once on issuance.
114. [x] Show raw token only once on rotation.
115. [x] Support credential expiry.
116. [x] Support immediate credential revoke.
117. [x] Support credential rotation.
118. [x] Support temporary overlap during controlled rotation if implemented.
119. [x] Agent disable/revoke invalidates all credentials immediately.
120. [x] Never log Authorization token.
121. [x] Never expose token hash in API/UI.
122. [x] Implement safe token verification.
123. [x] Add invalid token tests.
124. [x] Add revoked token tests.
125. [x] Add expired token tests.
126. [x] Add rotation tests.

Runtime: `apps/api/src/modules/ai-platform/credentials/*`. Token layout `nbos_agt_<keyId>_<secret>`, hex encoded so the separator can never occur inside a segment; only the argon2id verifier is persisted. Parsing is canonical (18 hex chars of key id, 64 of secret), so malformed and oversized input is refused before any database work. Rotation issues a new credential row against the same `agentId`, so agent identity, grants and audit history survive rotation.

Overlap (118) may only ever shorten the predecessor: the requested window must be in the future, must not exceed the existing expiry and must fit inside `AGENT_CREDENTIAL_MAX_OVERLAP_MS`. The maximum window is **24 hours**, approved by the developer on 2026-08-21; that value decides how long a leaked predecessor secret stays usable after rotation, so it is recorded with its date on `AGENT_CREDENTIAL_MAX_OVERLAP_MS` and read by the boundary tests rather than duplicated as a literal. A predecessor can be rotated exactly once — the row is locked `FOR UPDATE` and an existing successor produces a deterministic conflict instead of a raw unique-constraint error. Invalidation (119) holds under concurrency because every writer takes the agent row lock first: the module-wide order is **agent row → credential row**, so rotation and agent revoke can never deadlock against each other. That order is proven against a real PostgreSQL database by the opt-in `agent-credential.concurrency.int.test.ts` (0 deadlocks in 25 concurrent rounds; 19 of 25 with the order inverted) and guarded at unit level by an acquisition-order assertion. Tests: `agent-token.test.ts`, `agent-secret-hash.test.ts`, `agent-credential.service.test.ts`, `agent-credential.rotation.test.ts`, `agent-credential.concurrency.int.test.ts` (opt-in, real database).

# G. External Agent authentication boundary

127. [x] Implement dedicated External Agent authentication guard/middleware.
128. [x] Keep employee JWT/session authentication separate.
129. [x] Build ActorContext from authenticated External Agent.
130. [x] Reject disabled agent.
131. [x] Reject revoked agent.
132. [x] Reject expired agent/credential.
133. [x] Use stable machine-readable auth errors.
134. [x] Avoid record existence leakage through auth errors.
135. [x] Require TLS production assumption.
136. [x] Accept token in Authorization header.
137. [x] Do not require query-string token.
138. [x] Redact Authorization values from logs/errors.
139. [x] Add auth observability without secrets.
140. [x] Add Employee-vs-Agent boundary tests.

Runtime: `apps/api/src/modules/ai-platform/auth/*`. `AgentAuthGuard` writes `request.agent` and never `request.user`, so an agent can never enter an employee RBAC guard as a user; an employee JWT fails the canonical token parse before any database lookup. An unknown key id runs the _same_ `argon2.verify` call against a per-process decoy verifier (primed at module init), so "no such key" and "wrong secret" share both the code path and the cost. Channel provenance comes from `@AgentChannel()` route metadata, never from a client header or a request path, so a REST caller cannot label itself as MCP in ActorContext or Audit.

Auth observability (139) is a structured secret-free warning log per rejected attempt — reason, public key id, channel, correlation id — and deliberately not an AuditLog row: unauthenticated traffic is attacker-controlled and unbounded, so a row per attempt would be a write amplifier. Refusals of a known credential remain traceable through the agent's own lifecycle trail.

Item 140 is closed by Chat 4. `protocol/agent-protocol.http.int.test.ts` boots a Nest application with the production guard chain (`ThrottlerGuard → OriginGuard → AuthGuard → EmployeeGuard → PermissionGuard → RequireActiveSessionGuard`), the production `ValidationPipe`, `TransformInterceptor` and `GlobalExceptionFilter`, mounts the real agent controllers next to an employee route, and drives it over real HTTP. It proves an agent token serves an agent route with no employee session, that the same token never reaches an employee permission check, that an employee route still rejects it, that a query-string token is refused, and that the presented credential never appears in a response body. Tests: `agent-auth.guard.test.ts`, `agent-authenticator.service.test.ts`, `agent-protocol.http.int.test.ts`.

# H. Capability registry

141. [x] Define stable capability key format.
142. [x] Define capability version strategy.
143. [x] Define owning module.
144. [x] Define read/write classification.
145. [x] Define risk class.
146. [x] Define allowed scope types.
147. [x] Define input schema metadata.
148. [x] Define output/projection schema metadata.
149. [x] Define idempotency requirement metadata.
150. [x] Define audit behavior metadata.
151. [x] Define approval requirement metadata.
152. [x] Define rate-limit class metadata.
153. [x] Prevent unknown capability grants.
154. [x] Register Phase 1 Work Space/Task/Drive capabilities deterministically.
155. [x] Register `tasks.create` separately.
156. [x] Register `tasks.update` separately.
157. [x] Do not register `tasks.delete` for External Agent Phase 1.
158. [x] Do not register generic `tasks.set_status(anyStatus)`.
159. [x] Add capability-registry tests.

Runtime: `packages/shared/src/ai/capability-*.ts`. Risk and idempotency follow `02-AI-Capability-and-Action-Layer.md`: `tasks.submit_review` is `MEDIUM` + `REQUIRED` per the canonical example, and `tasks.start` is also `REQUIRED` because a replayed start is a semantic state mutation. Each definition additionally declares `requiresTargetDataClassification`, which is what lets the evaluator fail closed instead of assuming a classification. The registry is shared, so REST, MCP and future internal tool adapters cannot define their own vocabulary. Schema metadata is a descriptor (id + field allowlist); the concrete validators and projections bind to those descriptors in Chats 3–4. `AI_CAPABILITIES_FORBIDDEN_PHASE_1` keeps `tasks.delete`, `tasks.set_status` and `tasks.force_complete` unregisterable, and `AgentGrantService` rejects any key absent from the registry. Tests: `capability-registry.test.ts`, `agent-grant.service.test.ts`.

# I. Capability grants and resource scopes

160. [x] Add External Agent capability grant persistence.
161. [x] Add resource scope persistence.
162. [x] Support Work Space scope.
163. [x] Keep Project scope structurally possible.
164. [x] Keep Product scope structurally possible.
165. [x] Keep explicit resource scope structurally possible.
166. [x] Keep organization scope structurally possible but do not grant broadly by default.
167. [x] Support grant revoke.
168. [x] Support optional grant expiry if useful.
169. [x] Capability grant must not imply all resources.
170. [x] Resource scope must not imply all actions.
171. [x] Add indexes for actor/capability/scope evaluation.
172. [x] Audit grant create/change/revoke.
173. [x] Add grant-evaluation tests.
174. [x] Add cross-Workspace denial tests.
175. [x] Add revoked-grant denial tests.

Runtime: `packages/database/prisma/schema/ai-platform.prisma`, `apps/api/src/modules/ai-platform/grants/agent-grant.service.ts`. Capability grants ("what") and resource scopes ("where") are separate tables evaluated together, so neither implies the other. AI principals are never written into `ResourceAccessGrant`, which stays employee-only. ORGANIZATION scope stores the `PLATFORM_ORGANIZATION_SCOPE_ID` sentinel so the uniqueness index holds without a nullable scope column, and it is never granted implicitly. RESOURCE scopes are unique on `(agent, scopeType, scopeId, resourceType)` with a normalized empty string for non-resource rows, so granting `FILE:123` cannot upsert over an existing `TASK:123`. Grant and scope mutations take the shared agent row lock (`agent-row-lock.ts`) _inside_ their transaction and read terminal state only after the lock, so a revoke committing concurrently cannot be overtaken by a grant that checked first. Each mutation writes its AuditLog row through the same transaction client, so a failed audit rolls the grant back rather than leaving it active and untraceable. Tests: `agent-grant.service.test.ts`, `agent-grant.scope.test.ts`, `agent-scope.test.ts`, `agent-policy.service.test.ts`.

# J. Policy evaluator

176. [x] Implement one reusable Policy Evaluator.
177. [x] Default to DENY.
178. [x] Evaluate actor state.
179. [x] Evaluate credential state where applicable.
180. [x] Evaluate capability grant.
181. [x] Evaluate resource scope.
182. [x] Evaluate module-specific restrictions.
183. [x] Evaluate data classification/restrictions.
184. [x] Evaluate action risk.
185. [x] Evaluate approval requirement.
186. [~] Evaluate usage/rate limits.
187. [x] Support ALLOW.
188. [x] Support DENY.
189. [x] Support REQUIRE_APPROVAL.
190. [x] Return structured internal denial reasons.
191. [x] Map safe external errors without existence leakage.
192. [x] Make prompt/document/message content unable to alter policy result.
193. [x] Add policy unit tests.
194. [x] Add deny-by-default tests.
195. [x] Add scope traversal/isolation tests.

Runtime: `packages/shared/src/ai/policy-evaluator.ts` (pure decision) and `apps/api/src/modules/ai-platform/policy/agent-policy.service.ts` (state loading, denial audit, safe error).

The agent id is not an input: `AgentPolicyQuery` derives it from `actor`, so a caller cannot ask for a decision about one principal while presenting another (178). Classification is fail-closed (183) — a capability that declares `requiresTargetDataClassification` is denied with `DATA_CLASSIFICATION_UNKNOWN` when the caller cannot state the target's classification, rather than passing an unenforceable ceiling. Evaluation order is deliberate: everything independent of the concrete resource, _including_ the rate limit, is decided before the scope match, so a throttled agent receives the same `429` whether or not the target is in scope and the status code is not a scope oracle (191). Item 192 holds structurally: `AiPolicyRequest` accepts no free-text content, so task text, documents and messages are not inputs to the decision. Item 186 is partial — the evaluator consumes a `rateLimitExceeded` verdict but the counters and windows themselves are section U work. Out-of-scope and non-existent resources both surface as `AGENT_RESOURCE_NOT_AVAILABLE` with an identical message, and a failed denial audit keeps the safe deterministic error instead of degrading into an internal error. Tests: `policy-evaluator.test.ts`, `policy-error-mapping.test.ts`, `agent-policy.service.test.ts`, `agent-policy.assert.test.ts`.

# K. Domain Action Gateway

196. [x] Create shared AI/agent capability invocation boundary.
197. [x] Prohibit direct Prisma domain writes from REST agent controllers.
198. [x] Prohibit direct Prisma domain writes from MCP tool adapters.
199. [x] Prohibit direct Prisma domain writes from future Internal AI tool adapters.
200. [x] Route Task actions through Tasks application/domain services.
201. [x] Route Drive operations through Drive services.
202. [x] Preserve ActorContext through invocation.
203. [x] Preserve correlation id through invocation.
204. [x] Validate capability input schemas.
205. [~] Validate output projection schemas.
206. [x] Re-check target scope server-side.
207. [x] Audit successful material mutations after domain commit.
208. [x] Audit failures/denials where policy requires.
209. [~] Preserve transaction boundaries.
210. [x] Add gateway integration tests.

Runtime: `apps/api/src/modules/ai-platform/gateway/agent-capability.gateway.ts`. Items 197–198 are closed by Chat 4: the REST controllers and the MCP server hold no Prisma client and no Tasks/Drive dependency — their only collaborator is `AgentProtocolInvoker`, which calls `AgentCapabilityGateway.invoke`. Item 203 is closed by Chat 4: `AgentAuthGuard` resolves or mints the correlation id before authentication, so every invocation carries one. Item 204 validates catalog field names plus enum/date/sort at the gateway (`agent-capability.validators.ts`). Item 205 is partial: handlers emit purpose-built projections rather than running a second output-schema validator. Item 207 audits after domain commit even if idempotency `complete()` fails. Item 209 is partial: domain commit and idempotency `complete()` are not one transaction; stale `IN_PROGRESS` is never reclaimed (conflict instead of a second domain write). List `workspaces.read` denials (except the empty authorized set) go through `assertAllowed`. Evidence: `19-Phase-1-Chat-3-Handoff.md`.

# L. Work Space discovery and isolation

211. [x] Implement authorized Work Space list/discovery.
212. [x] Implement authorized Work Space detail projection.
213. [x] Return only granted/derived authorized Work Spaces.
214. [x] Hide unauthorized names/counts.
215. [x] Resolve Product/Extension Work Space semantics canonically.
216. [x] Never trust client-provided Project/Product relationships as authority.
217. [x] Re-resolve scope server-side on every action.
218. [x] Test agent Work Space A cannot discover Work Space B.
219. [x] Test guessed Work Space B id fails safely.
220. [x] Test shared Project does not automatically widen Work Space scope.
221. [x] Test disabled agent loses discovery.

Runtime: Extension delivery resolves `extensionId → Extension.productId → Product Work Space`. `WorkSpace.productId` is unique, so an Extension row cannot share it with the Product Work Space.

# M. Task read capabilities

222. [x] Implement `tasks.list`.
223. [x] Scope `tasks.list` to authorized Work Space.
224. [x] Implement `tasks.read`.
225. [x] Use purpose-built Task projection.
226. [x] Include id/code/title.
227. [x] Include description safely.
228. [x] Include status.
229. [x] Include priority.
230. [x] Include due date.
231. [x] Include permitted Work Space/Sprint context.
232. [x] Include permitted checklist state where needed.
233. [x] Include permitted links only.
234. [x] Exclude unrelated Finance data.
235. [x] Exclude Credentials/secrets.
236. [x] Exclude unrelated customer/private data.
237. [x] Add bounded pagination.
238. [x] Add stable agent-useful filters/sorting.
239. [x] Add unauthorized task read tests.
240. [x] Add payload-minimization tests.

Runtime: `tasks.read_links` returns a link only when `evaluate('tasks.read_links')` ALLOWs that target. `RESOURCE(Task A)` does not reveal Task B in the same Work Space. Missing and out-of-scope ids are omitted. Task projections include `updatedAt` for the `tasks.update` optimistic lock.

# N. Task discussion/context read

241. [x] Confirm canonical discussion source.
242. [x] Implement `tasks.read_discussion`.
243. [x] Apply Task/Work Space access check first.
244. [x] Limit discussion history/page size.
245. [x] Preserve author/source metadata.
246. [x] Preserve AI/human provenance.
247. [x] Treat discussion text as untrusted content.
248. [x] Exclude hidden/private content according to Tasks rules.
249. [x] Add discussion access tests.

# O. Drive artifact reads

250. [x] Implement linked Task artifact metadata read.
251. [x] Verify Task/Work Space link before artifact access.
252. [x] Apply Drive policy in addition to Agent scope.
253. [x] Block forbidden secret artifacts.
254. [x] Avoid exposing arbitrary bucket paths.
255. [x] Use safe/short-lived download mechanism.
256. [x] Apply read size/type constraints where relevant.
257. [x] Add cross-Task artifact isolation tests.
258. [x] Add cross-Work Space artifact isolation tests.

# P. Task create capability

259. [x] Implement `tasks.create` as separately grantable capability.
260. [x] Require authorized target Work Space.
261. [x] Define strict Task create input DTO/schema.
262. [x] Apply normal Tasks defaults/business validation.
263. [x] Prevent unrelated Project/Product/entity guessed-id linking.
264. [x] Apply assignment/reviewer rules from Tasks domain.
265. [x] Apply priority/due-date validation.
266. [x] Apply idempotency to create.
267. [x] Preserve External Agent as creator/source provenance without fake Employee impersonation.
268. [x] Audit Task creation.
269. [x] Test create allowed when capability granted.
270. [x] Test create denied without capability.
271. [x] Test create denied outside Work Space scope.
272. [x] Test duplicate retry does not duplicate Task.

# Q. Task update capability

273. [x] Implement separately grantable `tasks.update`.
274. [x] Define explicit editable-field allowlist.
275. [x] Reject unknown/non-allowlisted fields.
276. [x] Reject deletion through update.
277. [x] Reject arbitrary status assignment through update.
278. [x] Reject direct final-completion bypass.
279. [x] Reject unauthorized Work Space reassignment.
280. [x] Reject audit/system/security-field mutation.
281. [x] Use Tasks domain services/commands.
282. [x] Add optimistic precondition/version/updatedAt check where needed.
283. [x] Avoid silently overwriting materially newer human changes. (`expectedUpdatedAt` is required on `tasks.update` and applied as `UPDATE … WHERE id AND updatedAt`.)
284. [x] Audit material Task updates.
285. [x] Test allowed-field updates.
286. [x] Test denied-field updates.
287. [x] Test stale update conflict.
288. [x] Test update denied without capability.

# R. Semantic Task workflow actions

289. [x] Implement `tasks.start`.
290. [x] Map `tasks.start` to current Tasks lifecycle.
291. [x] Reject invalid Start transition deterministically.
292. [x] Implement `tasks.comment`.
293. [x] Preserve External Agent authorship/source on comment.
294. [x] Implement `tasks.submit_review`.
295. [x] Map submit-review to current Tasks lifecycle.
296. [x] Reject invalid submit-review transition.
297. [x] Ensure External Agent cannot force Completed.
298. [x] Ensure External Agent cannot delete Task.
299. [x] Ensure returned-from-review Task can be read/reworked normally.
300. [x] Audit semantic Task actions.
301. [x] Add valid-transition tests.
302. [x] Add invalid-transition tests.

Runtime: `tasks.start` is `UPDATE … WHERE status IN (OPEN, ON_HOLD)`. `tasks.submit_review` is `OPEN|IN_PROGRESS|ON_HOLD`. Concurrent complete yields count 0 instead of a silent overwrite.

# S. Artifact writes

303. [x] Implement generated artifact upload through Drive.
304. [x] Create Drive File Asset using existing ownership rules.
305. [x] Link artifact to authorized Task/Work Space.
306. [x] Store agent/source provenance.
307. [x] Validate file size.
308. [x] Validate file type.
309. [x] Apply established unsafe/executable-file policy.
310. [x] Prevent arbitrary unrelated entity links.
311. [x] Apply idempotency to artifact link creation where necessary.
312. [x] Add upload/link tests.

# T. Idempotency

313. [x] Define common External Agent idempotency contract.
314. [x] Support `Idempotency-Key` for REST mutations.
315. [x] Support equivalent `clientOperationId` for MCP tools.
316. [x] Scope idempotency to actor/capability appropriately.
317. [x] Store operation identity/result safely.
318. [x] Return original compatible result for safe duplicate retry.
319. [x] Prevent duplicate Task create.
320. [x] Prevent duplicate comments.
321. [x] Prevent duplicate artifact links.
322. [x] Prevent duplicate semantic transitions.
323. [x] Add duplicate/retry tests.

Runtime: `AgentIdempotencyService` stores `(agentId, capabilityKey, operationKey)` with a SHA-256 fingerprint. Chat 4 closed 314–315: the REST `Idempotency-Key` header and the MCP `clientOperationId` tool argument are both bound to `invocation.idempotencyKey` by `AgentProtocolInvoker`, and a parity test asserts the two transports produce the same key for the same operation. Artifact bytes travel in `invocation.payload`, so the fingerprint covers the real content and never a JSON field. `abort()` runs only when `dispatch` fails. After domain commit, `complete()` failure leaves `IN_PROGRESS`; retries (including after 60s) return conflict and do not re-enter Tasks/Drive. A crash between reserve and dispatch can pin the key until operational cleanup (K 209).

# U. Rate limits and abuse controls

324. [ ] Define per-External-Agent request limits.
325. [ ] Define per-capability limits for expensive/mutating actions.
326. [ ] Define payload size limits.
327. [ ] Define optional concurrency limits.
328. [ ] Return stable rate-limit error/retry metadata.
329. [ ] Ensure abusive Agent cannot consume employee API capacity globally.
330. [ ] Add rate-limit tests.

# V. REST machine API

331. [x] Implement dedicated `/api/v1/agent` namespace.
332. [x] Implement `GET /agent/me` or equivalent identity endpoint.
333. [x] Implement Work Space discovery endpoints.
334. [x] Implement Task read/list endpoints.
335. [x] Implement Task create endpoint.
336. [x] Implement Task allowlisted update endpoint.
337. [x] Implement semantic start endpoint.
338. [x] Implement comment endpoint.
339. [x] Implement submit-review endpoint.
340. [x] Implement discussion read endpoint.
341. [x] Implement artifact list/read endpoint.
342. [x] Implement artifact attach/upload endpoint.
343. [x] Do not expose Task delete endpoint for Agent Phase 1.
344. [x] Use consistent JSON error envelope.
345. [x] Use stable error codes from `09` contract.
346. [x] Add pagination contract.
347. [x] Add idempotency documentation.
348. [x] Generate/update OpenAPI contracts.
349. [x] Add REST contract tests.

Runtime: `apps/api/src/modules/ai-platform/rest/*` — three controllers on `v1/agent` behind the global `api` prefix. Every handler resolves a registry operation and calls `AgentProtocolInvoker`; none of them holds Prisma, Tasks or Drive. 341 is addressed through the owning task (`GET /tasks/:taskId/artifacts[/:fileAssetId]`) rather than the bare `/artifacts/:id/download` sketched in `09` §2, so the Task/Work Space link that authorizes the file is part of the request; `09` §2 permits adapting route mechanics. 342 takes base64 `contentBase64` capped at 512 KiB and hands the decoded bytes to the gateway as a binary payload. 343 has no route and no capability to reach. 344–345 come from `AgentProtocolExceptionFilter` + `toAgentErrorResponse`; `@SkipTransform()` keeps the employee `{ data, timestamp }` wrapper off agent responses. 346 reuses the gateway page meta. 348 is asserted against the generated document in `rest/agent-openapi.test.ts`. Not exposed in Phase 1: `tasks.read_links` has no REST route, because `09` §2 does not define one.

# W. MCP server/adapter

350. [x] Implement remote MCP endpoint/server supported by stack.
351. [x] Authenticate MCP through the same External Agent credential system.
352. [x] Build same ActorContext as REST.
353. [x] Implement `nbos_get_identity`.
354. [x] Implement `nbos_list_workspaces`.
355. [x] Implement `nbos_get_workspace`.
356. [x] Implement `nbos_list_tasks`.
357. [x] Implement `nbos_get_task`.
358. [x] Implement `nbos_create_task`.
359. [x] Implement `nbos_update_task`.
360. [x] Implement `nbos_start_task`.
361. [x] Implement `nbos_get_task_discussion`.
362. [x] Implement `nbos_add_task_comment`.
363. [x] Implement `nbos_list_task_artifacts`.
364. [x] Implement `nbos_get_task_artifact`.
365. [x] Implement `nbos_attach_task_artifact`.
366. [x] Implement `nbos_submit_task_review`.
367. [x] Do not expose delete tool in Phase 1.
368. [~] Use structured input/output schemas.
369. [x] Ensure MCP tools invoke same capabilities/domain services as REST.
370. [x] Ensure MCP authorization decisions match REST.
371. [x] Propagate correlation id/protocol metadata.
372. [x] Add MCP contract tests.
373. [x] Add REST-vs-MCP parity tests.

Runtime: `apps/api/src/modules/ai-platform/mcp/*`. Stateless Streamable HTTP JSON-RPC 2.0 at `POST /api/v1/agent/mcp` (`initialize`, `notifications/initialized`, `ping`, `tools/list`, `tools/call`); `GET`/`DELETE` answer 405 because Phase 1 offers no server-initiated stream. Implemented directly rather than on the MCP SDK: the Phase 1 surface is tools-only, and a hand-written adapter avoids two new production dependencies while keeping error/idempotency behaviour byte-identical to REST. 351–352 reuse `AgentAuthGuard` with `@AgentChannel('mcp')`, so the same credential yields the same `ActorContext` with `channel.source = 'mcp'`. 368 is `[~]`: input schemas are published and generated from the capability catalog, but no `outputSchema` is advertised — that depends on the catalog output validator still open as K 205. Denials are returned as `isError: true` tool results carrying the same stable code REST returns, which is what 370 is tested on. Not exposed: `tasks.read_links`, absent from the `09` §12 tool list.

# X. External client setup and acceptance

374. [x] Document generic REST setup.
375. [x] Document Cursor MCP setup pattern.
376. [x] Document Codex MCP/API setup pattern where supported.
377. [x] Document Claude Code MCP/API setup pattern where supported.
378. [x] Ensure setup requires only NBOS URL + External Agent token.
379. [x] Ensure setup never requires DB credentials.
380. [x] Ensure setup never requires SSH.
381. [x] Ensure setup never requires Employee admin JWT/session.
382. [x] Ensure setup never requires OpenAI/Anthropic provider keys.

Runtime: [`21-External-Agent-Client-Setup.md`](21-External-Agent-Client-Setup.md). 378–382 are not only documentation: the protocol accepts exactly one credential form (`Authorization: Bearer` — query-string tokens are rejected), agent routes are `@Public()` so no employee session participates, and no capability reaches Credentials, the vault or a provider key. 376 notes the REST fallback for Codex builds without remote MCP support. The setup guides were written against the implemented endpoints but have not been walked end-to-end against a deployed host with a live token.

# Y. AI Provider connection foundation

383. [ ] Create generic AI Provider Connection abstraction/model.
384. [ ] Support provider type OPENAI.
385. [ ] Support provider type ANTHROPIC.
386. [ ] Allow multiple connections per provider structurally.
387. [ ] Add connection name/status.
388. [ ] Add createdBy/audit metadata.
389. [ ] Add optional provider organization/project metadata where applicable.
390. [ ] Add lastValidatedAt.
391. [ ] Add lastModelSyncAt.
392. [ ] Add enable/disable semantics.
393. [ ] Add provider adapter interface.
394. [ ] Keep business modules provider-independent.
395. [ ] Add provider connection persistence tests.

# Z. Provider credential security

396. [ ] Store provider credentials through approved encrypted secret mechanism.
397. [ ] Never expose provider key to AI actor.
398. [ ] Never expose provider key after save.
399. [ ] Never log provider key.
400. [ ] Never store provider key in Audit changes.
401. [ ] Support key rotation/replacement.
402. [ ] Support connection disable/revoke behavior.
403. [ ] Validate provider connection without exposing secret.
404. [ ] Audit provider connection lifecycle.
405. [ ] Add secret-redaction tests.

# AA. Model catalog

406. [ ] Create AI Model catalog entity.
407. [ ] Store provider/model external id.
408. [ ] Store stable internal NBOS model id.
409. [ ] Store display name.
410. [ ] Store discoveredAt.
411. [ ] Store lastSeenAt.
412. [ ] Support DISCOVERED status.
413. [ ] Support ACTIVE status.
414. [ ] Support DISABLED status.
415. [ ] Support DEPRECATED status.
416. [ ] Support UNAVAILABLE status.
417. [ ] Implement OpenAI model-list synchronization.
418. [ ] Implement Anthropic model-list synchronization.
419. [ ] Implement manual Sync Models action.
420. [ ] Implement scheduled synchronization path/contract.
421. [ ] Do not auto-activate newly discovered models.
422. [ ] Preserve historical model records when provider stops listing them.
423. [ ] Record provider metadata/capabilities where reliable.
424. [ ] Allow internal suitability tags/notes.
425. [ ] Distinguish provider metadata from internal suitability judgment.
426. [ ] Support alias/snapshot metadata where provider exposes it.
427. [ ] Add model-sync tests.
428. [ ] Add new-model-discovery tests.
429. [ ] Add disappeared/unavailable-model tests.

# AB. Model Policy / routing foundation

430. [ ] Create AI Model Policy entity.
431. [ ] Create model-policy candidate relation.
432. [ ] Support policy name/purpose/status.
433. [ ] Support FIXED mode.
434. [ ] Support PRIMARY_FALLBACK mode.
435. [ ] Support ordered fallback candidates.
436. [ ] Allow candidates from the same provider.
437. [ ] Allow candidates from different providers.
438. [ ] Validate candidates are enabled/available for production assignment.
439. [ ] Do not silently auto-promote DISCOVERED model.
440. [ ] Record routing policy version/config identity where practical.
441. [ ] Define fallback reasons (provider error/rate limit/timeout/unavailable/etc.).
442. [ ] Preserve idempotency across retries/fallback for mutating workflows.
443. [ ] Keep TIERED/ADAPTIVE structurally possible.
444. [ ] Do not implement learned/adaptive router in Phase 1.
445. [ ] Add FIXED policy tests.
446. [ ] Add PRIMARY_FALLBACK configuration tests.
447. [ ] Add cross-provider fallback configuration tests.

# AC. Internal Agent foundation

448. [ ] Create Internal AI Agent model/entity.
449. [ ] Add stable id/name/purpose.
450. [ ] Add owner Employee.
451. [ ] Support DRAFT status.
452. [ ] Support ACTIVE status.
453. [ ] Support PAUSED status.
454. [ ] Support DISABLED status.
455. [ ] Support ARCHIVED status.
456. [ ] Link Internal Agent to capability grants/scopes architecture.
457. [ ] Link Internal Agent to Model Policy.
458. [ ] Add prompt-policy linkage contract.
459. [ ] Add approval-policy linkage contract.
460. [ ] Add surface/channel assignment model.
461. [ ] Preserve channel/source in execution context.
462. [ ] Add `onBehalfOf` support for employee-initiated future actions.
463. [ ] Ensure Internal Agent is not provider/model identity.
464. [ ] Ensure model changes do not alter Agent permissions.
465. [ ] Validate required dependencies before Agent activation.
466. [ ] Pause/disable blocks new executions.
467. [ ] Preserve attribution after archive.
468. [ ] Audit Internal Agent lifecycle/config changes.
469. [ ] Add Internal Agent persistence/lifecycle tests.

# AD. Prompt policy/version foundation

470. [ ] Create Prompt Policy entity or equivalent configuration domain.
471. [ ] Create Prompt Version entity.
472. [ ] Support DRAFT prompt version.
473. [ ] Support TESTING prompt version.
474. [ ] Support PUBLISHED prompt version.
475. [ ] Support RETIRED prompt version.
476. [ ] Allow Internal Agent to reference published prompt policy/version.
477. [ ] Preserve prompt version identity in execution metadata contract.
478. [ ] Support future rollback semantics.
479. [ ] Audit publish/rollback/config changes.
480. [ ] Do not let prompt grant capabilities/resources.
481. [ ] Add prompt-version lifecycle tests.

# AE. Context / memory / knowledge contracts

482. [ ] Define Context Assembler interface/contract.
483. [ ] Require authorization before context retrieval.
484. [ ] Use purpose-built module projections.
485. [ ] Define source/provenance metadata contract.
486. [ ] Define freshness metadata contract.
487. [ ] Define redaction/classification contract.
488. [ ] Define context size/token budget contract.
489. [ ] Mark user/task/document/message/file content as untrusted data.
490. [ ] Define session context contract.
491. [ ] Define persistent-memory interface but keep disabled/unimplemented by default.
492. [ ] Require memory owner/scope/purpose/retention/provenance.
493. [ ] Forbid secrets in AI memory.
494. [ ] Define future Knowledge/RAG source interface.
495. [ ] Ensure future retrieval cannot bypass authorization.
496. [ ] Do not build unrestricted global vector store in Phase 1.

# AF. Risk / approval foundation

497. [ ] Add capability risk metadata.
498. [ ] Implement `ALLOW/DENY/REQUIRE_APPROVAL` policy contract.
499. [ ] Create approval request persistence/entity.
500. [ ] Store requesting actor/capability/resource.
501. [ ] Store safe payload summary.
502. [ ] Store canonical payload digest.
503. [ ] Support PENDING.
504. [ ] Support APPROVED.
505. [ ] Support REJECTED.
506. [ ] Support EXPIRED.
507. [ ] Support CANCELLED.
508. [ ] Support CONSUMED.
509. [ ] Bind approval to exact/material payload.
510. [ ] Material payload change invalidates approval.
511. [ ] Default approval to one-time.
512. [ ] Require authorized Employee approver.
513. [ ] Prevent AI self-approval.
514. [ ] Add approval expiration.
515. [ ] Revalidate actor/grants/domain state before approved commit.
516. [ ] Audit approval lifecycle.
517. [ ] Add approval-policy tests.

# AG. Customer-facing AI policy foundation

518. [ ] Add customer-facing channel/risk classification contract.
519. [ ] Define conversation/customer scope context.
520. [ ] Keep customer context isolated from other customers.
521. [ ] Define DRAFT_ONLY mode.
522. [ ] Define APPROVAL_REQUIRED mode.
523. [ ] Define AUTO_SEND_ALLOWED mode contract for future narrow policies.
524. [ ] Separate draft capability from send capability.
525. [ ] Define escalation contract/reason.
526. [ ] Define internal-only vs customer-visible content requirement/contract.
527. [ ] Ensure customer messages are untrusted input.
528. [ ] Ensure customer text cannot widen tools/capabilities.
529. [ ] Ensure no Credentials/secrets in customer-facing context.
530. [ ] Do not implement production Messenger auto-send runtime in Phase 1.
531. [ ] Add customer-isolation policy tests/contracts where possible.

# AH. Usage, cost and observability foundation

532. [ ] Create/extend AI execution record contract.
533. [ ] Attribute execution to actor/agent.
534. [ ] Attribute provider connection.
535. [ ] Attribute model.
536. [ ] Attribute Model Policy/routing config.
537. [ ] Attribute capability/domain/channel.
538. [ ] Store correlation id.
539. [ ] Track status/success/failure.
540. [ ] Track latency.
541. [ ] Track retry count.
542. [ ] Track fallback occurrence/reason.
543. [ ] Track provider usage units/tokens where available.
544. [ ] Track estimated/provider-reported cost where available.
545. [ ] Keep pricing-version/effective-date concept for historical cost integrity.
546. [ ] Define basic budget/usage limit schema/contracts.
547. [ ] Avoid storing full sensitive prompts solely for metrics.
548. [ ] Add execution/usage attribution tests.

# AI. Evaluation foundation

549. [ ] Create evaluation suite/run contracts or entities sufficient for future use.
550. [ ] Support model/model-policy evaluation target.
551. [ ] Support prompt-version attribution.
552. [ ] Support dataset/version identity.
553. [ ] Support aggregate quality/latency/cost results.
554. [ ] Keep deterministic/human/model-based grading separable.
555. [ ] Do not automatically activate/promote model based only on provider release.
556. [ ] Do not automatically promote based only on LLM-judge score.
557. [ ] Add admin notes/suitability/evaluation status to model management.

# AJ. Central AI administration UI

558. [ ] Add central `Settings -> AI & Agents` area (or accepted equivalent).
559. [ ] Add Overview page/summary.
560. [ ] Add External Agents list.
561. [ ] Add External Agent create flow.
562. [ ] Add External Agent detail/edit flow.
563. [ ] Add capability grant UI.
564. [ ] Add Work Space scope grant UI.
565. [ ] Add one-time token issuance display.
566. [ ] Add token rotate flow.
567. [ ] Add token revoke flow.
568. [ ] Add External Agent disable/re-enable flow.
569. [ ] Add last-used metadata.
570. [ ] Add External Agent audit/activity view/link.
571. [ ] Never redisplay raw token/hash after issuance.
572. [ ] Add Providers page.
573. [ ] Add OpenAI provider connection flow.
574. [ ] Add Anthropic provider connection flow.
575. [ ] Add Validate Connection action.
576. [ ] Add Rotate/Replace Provider Key flow.
577. [ ] Add Disable Provider flow.
578. [ ] Add Models page.
579. [ ] Add Sync Models action.
580. [ ] Show DISCOVERED models separately.
581. [ ] Add model Activate/Disable actions.
582. [ ] Show provider/model metadata and internal notes/tags.
583. [ ] Add Model Policies page.
584. [ ] Add FIXED policy create/edit UI.
585. [ ] Add PRIMARY_FALLBACK policy create/edit UI.
586. [ ] Allow cross-provider candidates.
587. [ ] Add Internal Agents page/shell.
588. [ ] Add Internal Agent create/configure UI foundation.
589. [ ] Add Model Policy assignment.
590. [ ] Add prompt-policy assignment placeholder/foundation.
591. [ ] Add approval-policy assignment placeholder/foundation.
592. [ ] Add Usage page/shell.
593. [ ] Add Approvals page/queue shell.
594. [ ] Add AI Audit/Activity view.
595. [ ] Add admin authorization tests.

# AK. Contextual module access UI

596. [ ] Add Work Space `Settings -> AI Access` contextual view.
597. [ ] Show External Agents currently scoped to that Work Space.
598. [ ] Allow authorized admin to grant existing Agent access from Work Space context.
599. [ ] Allow authorized admin to revoke Work Space access contextually.
600. [ ] Link to canonical central External Agent detail.
601. [ ] Ensure contextual UI uses the same grants as central AI administration.
602. [ ] Do not create a second Work Space-specific permission database.

# AL. Security hardening

603. [ ] Verify External Agent cannot access Credentials secret endpoints.
604. [ ] Verify External Agent token cannot authenticate to unrestricted Employee-only APIs.
605. [ ] Verify Agent cannot enumerate unauthorized Projects.
606. [ ] Verify Agent cannot enumerate unauthorized Products.
607. [ ] Verify Agent cannot enumerate unauthorized Work Spaces.
608. [ ] Verify Agent cannot enumerate unauthorized Tasks.
609. [ ] Verify REST and MCP both enforce same isolation.
610. [ ] Verify Authorization headers are redacted.
611. [ ] Verify credential hashes are never API-visible.
612. [ ] Verify provider keys are never API-visible after save.
613. [ ] Verify revoked credential blocks next REST request.
614. [ ] Verify revoked credential blocks next MCP invocation.
615. [ ] Verify disabled External Agent blocks all credentials.
616. [ ] Verify malformed/oversized payload rejection.
617. [ ] Verify prompt/task/comment/file content cannot alter authorization.
618. [ ] Verify Drive link cannot escape authorized scope.
619. [ ] Verify no raw SQL/database capability exists.
620. [ ] Verify no Task delete capability exists for External Agent Phase 1.
621. [ ] Verify no force-complete capability exists.
622. [ ] Verify no unrestricted Finance mutation capability exists.
623. [ ] Verify no unrestricted client-message send capability exists.
624. [ ] Verify newly discovered model cannot become production-active automatically.
625. [ ] Verify provider credential never enters AI context.
626. [ ] Verify queued sensitive actions revalidate revoked actor/grant as designed.

# AM. Regression and compatibility

627. [ ] Existing Employee login works.
628. [ ] Existing Employee RBAC behavior remains unchanged.
629. [ ] Existing Platform Access human grants remain valid.
630. [ ] Existing Audit pages/APIs still display historical human rows.
631. [ ] Existing Tasks UI behavior remains intact.
632. [ ] Existing Tasks workflow remains intact.
633. [ ] Existing Drive access remains intact and not widened.
634. [ ] Existing Integrations behavior remains intact.
635. [ ] Existing API application boots.
636. [ ] Existing worker boots.
637. [ ] Existing scheduler boots.
638. [ ] Prisma migrations are production-safe/forward-fixable according to project standards.
639. [ ] Validate migrations on representative existing data.
640. [ ] Run relevant lint/typecheck/test suites.

# AN. Documentation synchronization

641. [ ] Update `00-Documentation-Hub.md` with AI canon links.
642. [ ] Update `00-Technical-Decisions-By-Module.md` with AI Platform decisions.
643. [ ] Update `00-Implementation-Roadmap.md` with Phase 1 AI Foundation slice.
644. [ ] Update Architecture Layers wording so AI is not merely an Automation Layer feature.
645. [ ] Update Platform Access docs if runtime contracts evolve.
646. [ ] Update Audit docs for actor-aware audit.
647. [ ] Update Tasks docs for any lifecycle/runtime decisions resolved.
648. [ ] Update Drive docs if Agent artifact access introduces new canonical behavior.
649. [ ] Update `99-AI-Cleanup-Register.md` with resolved/open conflicts and evidence.
650. [ ] Add External Agent REST setup documentation.
651. [ ] Add External Agent MCP setup documentation.
652. [ ] Add token rotation/revocation runbook.
653. [ ] Add leaked External Agent token incident runbook.
654. [ ] Add provider-key rotation incident/runbook guidance.
655. [ ] Add policy denial/scope troubleshooting guide.
656. [ ] Add model sync/availability troubleshooting guide.

# AO. Final External Agent acceptance

657. [ ] Create one test External Agent scoped to one non-production/test Work Space.
658. [ ] Agent REST lists only authorized Work Space.
659. [ ] Agent MCP lists only authorized Work Space.
660. [ ] Agent REST lists only authorized tasks.
661. [ ] Agent MCP lists only authorized tasks.
662. [ ] Agent cannot read known task from another Work Space via REST.
663. [ ] Agent cannot read known task from another Work Space via MCP.
664. [ ] Agent reads permitted linked artifact.
665. [ ] Agent cannot read unrelated Drive artifact.
666. [ ] Agent with `tasks.create` creates a Task.
667. [ ] Agent without `tasks.create` cannot create a Task.
668. [ ] Agent with `tasks.update` updates an allowed field.
669. [ ] Agent cannot update a forbidden field.
670. [ ] Agent cannot delete a Task.
671. [ ] Agent starts allowed Task.
672. [ ] Agent posts progress/comment with visible AI provenance.
673. [ ] Agent attaches generated artifact.
674. [ ] Agent submits Task for review.
675. [ ] Human review/completion still controls final completion.
676. [ ] Duplicate create retry does not duplicate Task.
677. [ ] Duplicate comment retry does not duplicate comment.
678. [ ] Duplicate transition retry does not duplicate effects.
679. [ ] Revoking credential blocks next REST request.
680. [ ] Revoking credential blocks next MCP invocation.
681. [ ] Disabling Agent blocks all credentials.
682. [ ] Audit identifies External Agent + protocol + capability + resource + result.
683. [ ] No audit/log contains raw Agent token.
684. [ ] Cross-Work Space negative suite passes.
685. [ ] REST/MCP parity suite passes.

# AP. Final Provider/Model/Internal foundation acceptance

686. [ ] Connect a test OpenAI provider connection securely.
687. [ ] Validate OpenAI connection.
688. [ ] Sync OpenAI model catalog.
689. [ ] Connect a test Anthropic provider connection securely.
690. [ ] Validate Anthropic connection.
691. [ ] Sync Anthropic model catalog.
692. [ ] Newly discovered model appears as DISCOVERED, not ACTIVE.
693. [ ] Admin can explicitly activate/disable model.
694. [ ] Provider key cannot be retrieved after save.
695. [ ] Create FIXED Model Policy with one active model.
696. [ ] Create PRIMARY_FALLBACK policy with ordered models.
697. [ ] PRIMARY_FALLBACK can include models from different providers.
698. [ ] Create Internal Agent in DRAFT.
699. [ ] Assign capabilities/scopes contract to Internal Agent.
700. [ ] Assign Model Policy to Internal Agent.
701. [ ] Assign prompt-policy foundation/config.
702. [ ] Activate Internal Agent only when required dependencies validate.
703. [ ] Pause/disable blocks new execution contract/path.
704. [ ] Audit records provider/model/Internal Agent configuration changes.
705. [ ] Usage/execution records can attribute agent/provider/model/policy.

# AQ. Final architecture review

706. [ ] No External Agent controller contains direct domain Prisma writes.
707. [ ] No MCP tool adapter contains direct domain Prisma writes.
708. [ ] REST and MCP share the same authentication/policy/capability/domain path.
709. [ ] External Agent and Internal Agent use the same normalized Actor/Policy/Capability concepts.
710. [ ] Provider/Model selection is separated from Agent identity and permissions.
711. [ ] Model changes do not alter domain grants.
712. [ ] Prompt configuration does not grant permissions.
713. [ ] Customer-facing safety is enforceable outside prompt text.
714. [ ] Secrets remain excluded from AI context and audit.
715. [ ] Existing human authorization is not replaced/broken.
716. [ ] Cleanup Register reflects every remaining known gap.
717. [ ] Phase 1 non-goals remain absent.
718. [ ] Final security review confirms deny-by-default behavior.
719. [ ] Final architecture review confirms future employee AI chat can reuse the foundation without redesign.
720. [ ] Final architecture review confirms future Messenger AI can reuse the foundation without redesign.
721. [ ] Final architecture review confirms future Documents/CRM/Analytics AI can reuse the foundation without redesign.

---

# Exit criterion

Phase 1 is complete only when all of the following are true:

1. trusted external coding agents can use both REST and MCP against explicitly authorized Work Spaces/Tasks;
2. Task create/update are separately grantable and safely constrained;
3. Task delete and force-completion are unavailable to External Agents;
4. strict Work Space/Task/Drive isolation and provenance are proven by negative tests;
5. provider connections and model catalogs for OpenAI/Anthropic are manageable centrally and securely;
6. newly discovered models never become production-active automatically;
7. FIXED and PRIMARY_FALLBACK model policies can be configured, including cross-provider candidates;
8. Internal Agent identity/configuration foundation exists independently of provider/model choice;
9. prompt, approval, customer-facing safety and usage/evaluation foundations are represented canonically and in runtime contracts where required by this checklist;
10. current human NBOS workflows remain intact;
11. the architecture can add internal AI runtime, Messenger AI, Documents AI, CRM AI and Analytics AI without creating a second identity/authorization/action system.
