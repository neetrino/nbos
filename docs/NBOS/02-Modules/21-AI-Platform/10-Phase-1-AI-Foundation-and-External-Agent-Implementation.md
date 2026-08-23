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
86. [x] Audit provider connection lifecycle changes.
87. [x] Audit model activation/deactivation.
88. [x] Audit model policy changes.
89. [x] Audit Internal Agent lifecycle changes.
90. [x] Audit capability/scope changes.
91. [x] Audit approval lifecycle.
92. [x] Add migration tests using representative historical AuditLog rows.
93. [x] Add human audit regression tests.
94. [x] Add External Agent audit tests.
95. [x] Add Internal AI audit contract tests.

Write path and display contract exist in `AuditService.log({ actor })`. Chat 2 closed 85 and 90 through `AiPlatformAuditService`. Chat 5 closed 86–89 with the provider/model/Internal Agent services. Chat 10 closed 91 with `APPROVAL_REQUESTED` / `APPROVAL_DECIDED` / `APPROVAL_CANCELLED` / `APPROVAL_EXPIRED` / `APPROVAL_CONSUMED` on `AI_APPROVAL_REQUEST`. Every lifecycle, credential, grant, scope, provider, model and Internal Agent mutation passes its own transaction client to `AuditService.log`. Machine display names resolve through the batched `AuditActorLookups` registered by `AiPlatformModule` — External Agents and Internal Agents both register (`audit-actor.resolver.test.ts`). INTERNAL_AI writes never set `userId`.

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
186. [x] Evaluate usage/rate limits.
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

The agent id is not an input: `AgentPolicyQuery` derives it from `actor`, so a caller cannot ask for a decision about one principal while presenting another (178). Classification is fail-closed (183) — a capability that declares `requiresTargetDataClassification` is denied with `DATA_CLASSIFICATION_UNKNOWN` when the caller cannot state the target's classification, rather than passing an unenforceable ceiling. Evaluation order is deliberate: everything independent of the concrete resource, _including_ the rate limit, is decided before the scope match, so a throttled agent receives the same `429` whether or not the target is in scope and the status code is not a scope oracle (191). Item 192 holds structurally: `AiPolicyRequest` accepts no free-text content, so task text, documents and messages are not inputs to the decision. Item 186: `AgentProtocolInvoker` passes a live `rateLimitExceeded: true` verdict into `AgentPolicyService.evaluate` with an empty target before throwing `AGENT_RATE_LIMITED` with `Retry-After`, so a capability-budget refusal is not a scope oracle. Request/pre-auth ceilings still refuse at their guards. Tests: `policy-evaluator.test.ts`, `policy-error-mapping.test.ts`, `agent-policy.service.test.ts`, `agent-policy.assert.test.ts`, `agent-protocol.invoker.test.ts`.

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
205. [x] Validate output projection schemas.
206. [x] Re-check target scope server-side.
207. [x] Audit successful material mutations after domain commit.
208. [x] Audit failures/denials where policy requires.
209. [x] Preserve transaction boundaries.
210. [x] Add gateway integration tests.

Runtime: `apps/api/src/modules/ai-platform/gateway/agent-capability.gateway.ts`. Items 197–198 are closed by Chat 4: the REST controllers and the MCP server hold no Prisma client and no Tasks/Drive dependency — their only collaborator is `AgentProtocolInvoker`, which calls `AgentCapabilityGateway.invoke`. Item 203 is closed by Chat 4: `AgentAuthGuard` resolves or mints the correlation id before authentication, so every invocation carries one. Item 204 validates catalog field names plus enum/date/sort at the gateway (`agent-capability.validators.ts`). Item 205: `projectCapabilityOutput` strips undeclared fields at the gateway; list envelopes keep `items` / `meta` (the live `{ items, meta }` handler shape that `toAgentResponseBody` turns into `09` `{ data, meta }`). A top-level `page` key is not the list envelope. Item 207 audits after domain commit even if idempotency `complete()` fails. Item 209 is closed
for `tasks.attach_artifact` by post-Phase-1 Chat 3 (independent verifier, 2026-08-23). Chat 12
already commits the five DB-only Task writes and their idempotency checkpoint in one
transaction. Attach cannot put R2 and PostgreSQL in one ACID transaction; Drive persists
`FileArtifactOperation` before upload and finalizes FileAsset/FileLink + operation completion
in one PostgreSQL transaction. Resume is live attach + Drive `prepare` (F1 short-circuit
removed). Real-Postgres int: FileAsset+COMPLETED same TX, rollback after crash, concurrent
finalize → one FileAsset. Live Neon **dev** REST exact retry same ids; MCP a distinct
COMPLETED operation. Production migrate is an operations step. List `workspaces.read` denials
(except the empty authorized set) go through `assertAllowed`. Evidence:
`35-Post-Phase-1-Chat-3-Drive-Artifact-Lifecycle-Handoff.md`.

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

324. [x] Define per-External-Agent request limits.
325. [x] Define per-capability limits for expensive/mutating actions.
326. [x] Define payload size limits.
327. [x] Define optional concurrency limits.
328. [x] Return stable rate-limit error/retry metadata.
329. [x] Ensure abusive Agent cannot consume employee API capacity globally.
330. [x] Add rate-limit tests.

Runtime: `apps/api/src/modules/ai-platform/limits/`. The chain on every `/api/v1/agent` route (REST and MCP) is `AgentPreAuthGuard` → `AgentAuthGuard` → `AgentRateLimitGuard` → `AgentUsageInterceptor`. `AgentPreAuthThrottleService` bounds requests and failed authentications per source address before any credential lookup or Argon2 verification, so unauthenticated traffic cannot buy verification work; `AgentRateLimitGuard` then charges the authenticated agent, never an IP, and runs before the `lastUsedAt` write, so an exhausted credential stops buying usage writes. `AgentRateLimitService` delegates to `AgentRateLimitStore`: Redis when `REDIS_STATE_URL`/`REDIS_URL` is set (shared ceiling, fail-closed on Redis errors), otherwise process memory. Vitest uses memory unless `AI_RATE_LIMIT_REDIS_IN_TEST=1`. `AgentProtocolInvoker` charges the per-capability class, feeds a live `rateLimitExceeded` verdict into policy, and holds the concurrency slot around the gateway call, so REST and MCP share one counter for the same capability. The body ceiling is enforced by `createAgentJsonBodyParser`, mounted on the agent prefix ahead of the global parsers, on the bytes actually read from the socket rather than on a declared `Content-Length`.

Chosen values (`agent-rate-limit.constants.ts`, all named constants):

| Budget                         | Constant                                 | Value        |
| ------------------------------ | ---------------------------------------- | ------------ |
| Window                         | `AGENT_RATE_LIMIT_WINDOW_MS`             | 60 s         |
| Requests per agent             | `AGENT_REQUEST_LIMIT_PER_WINDOW`         | 600 / window |
| `READ_STANDARD`                | `AGENT_CAPABILITY_LIMIT_PER_WINDOW`      | 300 / window |
| `WRITE_STANDARD`               | `AGENT_CAPABILITY_LIMIT_PER_WINDOW`      | 60 / window  |
| `WRITE_SENSITIVE`              | `AGENT_CAPABILITY_LIMIT_PER_WINDOW`      | 20 / window  |
| Requests per source (pre-auth) | `AGENT_PREAUTH_REQUEST_LIMIT_PER_WINDOW` | 900 / window |
| Failed auth per source         | `AGENT_PREAUTH_FAILURE_LIMIT_PER_WINDOW` | 20 / window  |
| Concurrency per agent          | `AGENT_CONCURRENCY_LIMIT`                | 8 in flight  |
| Request body                   | `AGENT_MAX_REQUEST_BYTES`                | 768 KiB      |
| JSON-RPC batch                 | `AGENT_MCP_MAX_BATCH_MESSAGES`           | 20 messages  |

329 is structural, not tuning: the agent namespace carries `@SkipThrottle()` and never draws from the employee `ThrottlerGuard` default, an exhausted agent budget cannot reduce the employee allowance, and the pre-auth ceiling keeps unauthenticated agent traffic from consuming shared database and hashing capacity. An HTTP integration test asserts the employee probe still answers **200** during an agent flood, not merely "not 429". 328 returns `AGENT_RATE_LIMITED` (HTTP 429) with `Retry-After` plus `X-RateLimit-Limit` / `-Remaining` / `-Reset`. MCP returns the same code inside the JSON-RPC error envelope with `retryAfterSeconds`, because a per-message refusal cannot set a status on an HTTP response that also carries admitted messages. Oversized bodies are refused with `AGENT_VALIDATION_FAILED` (413) in the `09` envelope before parsing and before the domain is reached, whether the size was declared, understated, or sent chunked. Counters share Redis when a state URL is configured so multiple API instances cannot multiply the ceiling; without Redis they remain per process. An HTTP integration test asserts the employee probe still answers **200** during an agent flood, not merely "not 429".

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
368. [x] Use structured input/output schemas.
369. [x] Ensure MCP tools invoke same capabilities/domain services as REST.
370. [x] Ensure MCP authorization decisions match REST.
371. [x] Propagate correlation id/protocol metadata.
372. [x] Add MCP contract tests.
373. [x] Add REST-vs-MCP parity tests.

Runtime: `apps/api/src/modules/ai-platform/mcp/*`. Stateless Streamable HTTP JSON-RPC 2.0 at `POST /api/v1/agent/mcp` (`initialize`, `notifications/initialized`, `ping`, `tools/list`, `tools/call`); `GET`/`DELETE` answer 405 because Phase 1 offers no server-initiated stream. Implemented directly rather than on the MCP SDK: the Phase 1 surface is tools-only, and a hand-written adapter avoids two new production dependencies while keeping error/idempotency behaviour byte-identical to REST. 351–352 reuse `AgentAuthGuard` with `@AgentChannel('mcp')`, so the same credential yields the same `ActorContext` with `channel.source = 'mcp'`. 368: list-envelope tools (`workspaces.list`, `tasks.list`, `tasks.discussion`) publish a closed `outputSchema` with catalog item fields plus `items`/`meta`; other capability tools publish item fields only; identity has no output schema. The gateway still projects undeclared fields away (K 205). Denials are returned as `isError: true` tool results carrying the same stable code REST returns, which is what 370 is tested on. Not exposed: `tasks.read_links`, absent from the `09` §12 tool list.

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

383. [x] Create generic AI Provider Connection abstraction/model.
384. [x] Support provider type OPENAI.
385. [x] Support provider type ANTHROPIC.
386. [x] Allow multiple connections per provider structurally.
387. [x] Add connection name/status.
388. [x] Add createdBy/audit metadata.
389. [x] Add optional provider organization/project metadata where applicable.
390. [x] Add lastValidatedAt.
391. [x] Add lastModelSyncAt.
392. [x] Add enable/disable semantics.
393. [x] Add provider adapter interface.
394. [x] Keep business modules provider-independent.
395. [x] Add provider connection persistence tests.

Runtime: `packages/database/prisma/schema/ai-providers.prisma`, `apps/api/src/modules/ai-platform/providers/*`. `AiProviderAdapter` is the only provider surface; OpenAI and Anthropic implement it. Multiple connections per provider are allowed (no unique on provider type). Optional `baseUrl` is HTTPS-only, no userinfo, default port, and host-allowlisted (`api.openai.com` / `api.anthropic.com`); localhost, private and link-local hosts are rejected at save and at request time. Provider HTTP uses `redirect: 'manual'` and refuses 3xx. Tests: `ai-provider-connection.service.test.ts`, `ai-provider-url.test.ts`, `openai.adapter.test.ts`, `anthropic.adapter.test.ts`.

# Z. Provider credential security

396. [x] Store provider credentials through approved encrypted secret mechanism.
397. [x] Never expose provider key to AI actor.
398. [x] Never expose provider key after save.
399. [x] Never log provider key.
400. [x] Never store provider key in Audit changes.
401. [x] Support key rotation/replacement.
402. [x] Support connection disable/revoke behavior.
403. [x] Validate provider connection without exposing secret.
404. [x] Audit provider connection lifecycle.
405. [x] Add secret-redaction tests.

Runtime: `AiProviderSecretStore` encrypts with AES-256-GCM v2 via `apps/api/src/common/utils/crypto.ts` and `CREDENTIALS_ENCRYPTION_KEY`. The ciphertext lives in `ai_provider_secrets`, not on the connection view. Create/rotate/validate responses and audit `changes` carry only `keyPrefix`. Revoke deletes the secret row. No External Agent capability reaches this store (`ai-provider-isolation.test.ts`). Tests: `ai-provider-key.test.ts`, `ai-provider-connection.service.test.ts`.

# AA. Model catalog

406. [x] Create AI Model catalog entity.
407. [x] Store provider/model external id.
408. [x] Store stable internal NBOS model id.
409. [x] Store display name.
410. [x] Store discoveredAt.
411. [x] Store lastSeenAt.
412. [x] Support DISCOVERED status.
413. [x] Support ACTIVE status.
414. [x] Support DISABLED status.
415. [x] Support DEPRECATED status.
416. [x] Support UNAVAILABLE status.
417. [x] Implement OpenAI model-list synchronization.
418. [x] Implement Anthropic model-list synchronization.
419. [x] Implement manual Sync Models action.
420. [x] Implement scheduled synchronization path/contract.
421. [x] Do not auto-activate newly discovered models.
422. [x] Preserve historical model records when provider stops listing them.
423. [x] Record provider metadata/capabilities where reliable.
424. [x] Allow internal suitability tags/notes.
425. [x] Distinguish provider metadata from internal suitability judgment.
426. [x] Support alias/snapshot metadata where provider exposes it.
427. [x] Add model-sync tests.
428. [x] Add new-model-discovery tests.
429. [x] Add disappeared/unavailable-model tests.

Runtime: `AiModel` has a stable UUID plus `providerModelId`. Sync (`AiModelSyncService`) inserts new rows as `DISCOVERED`, refreshes metadata/`lastSeenAt` without promoting status, returns `UNAVAILABLE` models to `DISCOVERED` (not `ACTIVE`), and marks disappeared `DISCOVERED`/`ACTIVE` as `UNAVAILABLE` without deleting `DISABLED`/`DEPRECATED`. Manual sync uses an employee actor. Scheduled sync is `runScheduledCatalogSync` with a SYSTEM `ActorContext` and machine audit; one connection failure does not stop the rest. Chat 7 bound the Nest job: `SchedulerAiService.runAiModelCatalogSync` calls `AI_MODEL_CATALOG_SYNC_CONTRACT.runnerMethod` under the shared scheduler lease, `AiModelCatalogSyncCron` registers `ai-model-catalog-sync` (`0 */6 * * *`), and the catalog entry keeps `rosterIntent: 'off'` so the job stays opt-in behind `SCHEDULER_AI_MODEL_CATALOG_SYNC_ENABLED`. The runner lives in its own service instead of `SchedulerService`, which is already at the file-size limit, and the scheduler process reaches it through `AiPlatformCoreModule` (services only, no External Agent or admin HTTP surface). Ownership is fenced in the database, not only in memory: the scheduler passes a `ModelSyncOwnership` probe (`isSchedulerLeaseHeld`) that the sync runs as the first statement of its write transaction, selecting the `scheduler_leases` row `FOR UPDATE` for this owner and fencing token against `clock_timestamp()`. A successor's `acquire` therefore waits on the same row instead of committing beside the previous owner, and a run that already lost the lease matches no row and aborts before its first write. The job is also reachable from the Settings manual runner (`POST /api/platform/scheduler/jobs/ai-model-catalog-sync/run`), which takes the same lease. Provider metadata and suitability tags are separate columns. Tests: `ai-model-sync.rules.test.ts`, `ai-model-sync.service.test.ts`, `ai-model-catalog.service.test.ts`.

# AB. Model Policy / routing foundation

430. [x] Create AI Model Policy entity.
431. [x] Create model-policy candidate relation.
432. [x] Support policy name/purpose/status.
433. [x] Support FIXED mode.
434. [x] Support PRIMARY_FALLBACK mode.
435. [x] Support ordered fallback candidates.
436. [x] Allow candidates from the same provider.
437. [x] Allow candidates from different providers.
438. [x] Validate candidates are enabled/available for production assignment.
439. [x] Do not silently auto-promote DISCOVERED model.
440. [x] Record routing policy version/config identity where practical.
441. [x] Define fallback reasons (provider error/rate limit/timeout/unavailable/etc.).
442. [x] Preserve idempotency across retries/fallback for mutating workflows.
443. [x] Keep TIERED/ADAPTIVE structurally possible.
444. [x] Do not implement learned/adaptive router in Phase 1.
445. [x] Add FIXED policy tests.
446. [x] Add PRIMARY_FALLBACK configuration tests.
447. [x] Add cross-provider fallback configuration tests.

Runtime: `AiModelPolicy` + `AiModelPolicyCandidate`. Phase 1 modes are `FIXED` and `PRIMARY_FALLBACK`; `TIERED`/`ADAPTIVE` exist on the enum and are rejected at the service boundary. `PRIMARY_FALLBACK` requires exactly one enabled PRIMARY with the lowest enabled priority. Admin write still rejects DISCOVERED enabled candidates. Runtime resolve reads one active snapshot and skips temporarily unavailable fallbacks so they cannot block a healthy primary. Assignment (`requireAssignableForProduction`) re-checks only the enabled PRIMARY. Candidate replacement increments `version`. `resolveRoute` passes `operationKey` through unchanged. Tests: `ai-model-policy.rules.test.ts`, `ai-model-policy.service.test.ts`, `ai-model-policy.resolver.test.ts`.

# AC. Internal Agent foundation

448. [x] Create Internal AI Agent model/entity.
449. [x] Add stable id/name/purpose.
450. [x] Add owner Employee.
451. [x] Support DRAFT status.
452. [x] Support ACTIVE status.
453. [x] Support PAUSED status.
454. [x] Support DISABLED status.
455. [x] Support ARCHIVED status.
456. [x] Link Internal Agent to capability grants/scopes architecture.
457. [x] Link Internal Agent to Model Policy.
458. [x] Add prompt-policy linkage contract.
459. [x] Add approval-policy linkage contract.
460. [x] Add surface/channel assignment model.
461. [x] Preserve channel/source in execution context.
462. [x] Add `onBehalfOf` support for employee-initiated future actions.
463. [x] Ensure Internal Agent is not provider/model identity.
464. [x] Ensure model changes do not alter Agent permissions.
465. [x] Validate required dependencies before Agent activation.
466. [x] Pause/disable blocks new executions.
467. [x] Preserve attribution after archive.
468. [x] Audit Internal Agent lifecycle/config changes.
469. [x] Add Internal Agent persistence/lifecycle tests.

Runtime: `packages/database/prisma/schema/ai-internal-agents.prisma`, `apps/api/src/modules/ai-platform/internal-agents/*`. Identity is the Internal Agent row, not a model name. Grants/scopes reuse the External Agent capability registry and scope types on Internal-specific tables (`grantCapability` / `revokeCapability` / `grantScope` / `revokeScope` / list). A model-policy change cannot rewrite permissions. After the row lock, `ACTIVE + modelPolicyId=null` is rejected; policy replace and activation revalidate a production-eligible PRIMARY. `promptPolicyId` and `approvalPolicyId` are opaque linkage contracts (AD/AF runtime is later). Surfaces map to ActorContext channels, including `messenger`. Pause/disable/archive fail `assertInternalAgentCanExecute`. Archive keeps the row for Audit display names. `actorContextFromInternalAgent` never writes `userId`. Tests: `internal-agent.service.test.ts`, `internal-agent-grant.service.test.ts`, `internal-agent-execution.test.ts`.

# AD. Prompt policy/version foundation

470. [x] Create Prompt Policy entity or equivalent configuration domain.
471. [x] Create Prompt Version entity.
472. [x] Support DRAFT prompt version.
473. [x] Support TESTING prompt version.
474. [x] Support PUBLISHED prompt version.
475. [x] Support RETIRED prompt version.
476. [x] Allow Internal Agent to reference published prompt policy/version.
477. [x] Preserve prompt version identity in execution metadata contract.
478. [x] Support future rollback semantics.
479. [x] Audit publish/rollback/config changes.
480. [x] Do not let prompt grant capabilities/resources.
481. [x] Add prompt-version lifecycle tests.

Runtime: `packages/database/prisma/schema/ai-prompts.prisma`,
`apps/api/src/modules/ai-platform/prompts/*`. `AiPromptPolicy` + `AiPromptVersion` with
DRAFT / TESTING / PUBLISHED / RETIRED. Only DRAFT content is editable. Publish retires the
previous PUBLISHED row (partial unique index: one published version per policy). Rollback clones a
previously published version into a new identity (`predecessorVersionId`) and publishes it.
`InternalAiAgent.promptPolicyId` is now a real FK; assignment and activation revalidate a
PUBLISHED version. Execution records `{ promptPolicyId, promptVersionId, version, contentDigest }`
and never puts instruction text on `ActorContext`. Audit stores ids, version numbers and digest —
not `platformSafety` / `agentRole` text. Prompt services never write grant/scope tables (480).
Tests: `prompt-version-lifecycle.test.ts`, `ai-prompt-policy.service.test.ts`,
`internal-agent.service.test.ts`, `prompt-context-isolation.security.test.ts`,
`ai-admin.prompt-policies.http.int.test.ts`.

# AE. Context / memory / knowledge contracts

482. [x] Define Context Assembler interface/contract.
483. [x] Require authorization before context retrieval.
484. [x] Use purpose-built module projections.
485. [x] Define source/provenance metadata contract.
486. [x] Define freshness metadata contract.
487. [x] Define redaction/classification contract.
488. [x] Define context size/token budget contract.
489. [x] Mark user/task/document/message/file content as untrusted data.
490. [x] Define session context contract.
491. [x] Define persistent-memory interface but keep disabled/unimplemented by default.
492. [x] Require memory owner/scope/purpose/retention/provenance.
493. [x] Forbid secrets in AI memory.
494. [x] Define future Knowledge/RAG source interface.
495. [x] Ensure future retrieval cannot bypass authorization.
496. [x] Do not build unrestricted global vector store in Phase 1.

Runtime: `packages/shared/src/ai/context-*.ts`, `session-context.ts`, `persistent-memory.ts`,
`knowledge-source.ts` and thin Nest wrappers in `apps/api/src/modules/ai-platform/context/`.
`assembleAuthorizedContext` refuses DENY / REQUIRE_APPROVAL and a replayed ALLOW for another actor
before any fragment is kept. Each source must match the decision capability **and**
`matchedScope` (missing scope never widens). Classification uses the tighter of the request ceiling
and `capability.maxDataClassification`. Sources are purpose-built projections (no Prisma domain
load). Each kept fragment carries provenance, freshness (`stale` vs `maxAgeMs`), classification,
redaction and TRUSTED_CONFIG vs UNTRUSTED_CONTENT. SECRET classification and secret-shaped fields
(including nested objects/arrays) are omitted. Budget keeps trusted config first, then records
truncation. Session context is `SESSION_ONLY` and cannot become org-wide memory. Persistent memory
is disabled by default; writes still reject incomplete contracts and nested secrets. Knowledge
retrieve requires a bound ALLOW (actor + capability + source scope + classification), then returns
`KNOWLEDGE_RETRIEVAL_DISABLED`. No embedding / vector-store / pgvector code. Tests:
`context-assembler.test.ts`, `session-memory-knowledge.test.ts`, `ai-context-foundation.test.ts`,
`prompt-context-isolation.security.test.ts`.

# AF. Risk / approval foundation

497. [x] Add capability risk metadata.
498. [x] Implement `ALLOW/DENY/REQUIRE_APPROVAL` policy contract.
499. [x] Create approval request persistence/entity.
500. [x] Store requesting actor/capability/resource.
501. [x] Store safe payload summary.
502. [x] Store canonical payload digest.
503. [x] Support PENDING.
504. [x] Support APPROVED.
505. [x] Support REJECTED.
506. [x] Support EXPIRED.
507. [x] Support CANCELLED.
508. [x] Support CONSUMED.
509. [x] Bind approval to exact/material payload.
510. [x] Material payload change invalidates approval.
511. [x] Default approval to one-time.
512. [x] Require authorized Employee approver.
513. [x] Prevent AI self-approval.
514. [x] Add approval expiration.
515. [x] Revalidate actor/grants/domain state before approved commit.
516. [x] Audit approval lifecycle.
517. [x] Add approval-policy tests.

Runtime: `packages/database/prisma/schema/ai-approvals.prisma`,
`packages/shared/src/ai/approval-*.ts`, `apps/api/src/modules/ai-platform/approvals/*`.
`AiApprovalRequest` stores requester actor, capability, resource, SHA-256 payload digest and a
secret-stripped summary. Lifecycle is PENDING → APPROVED/REJECTED/CANCELLED/EXPIRED → CONSUMED
(one-time). Employee JWT + `COMPANY:EDIT` decides; machine actors cannot approve. Consume
revalidates actor identity, capability, digest, a fresh ALLOW decision and domain state before
marking CONSUMED. Audit: `APPROVAL_REQUESTED` / `APPROVAL_DECIDED` / `APPROVAL_CANCELLED` /
`APPROVAL_EXPIRED` / `APPROVAL_CONSUMED` with ids/digest only. Admin queue:
`GET/POST /api/ai-admin/approvals`. Tests: `approval-lifecycle.test.ts`,
`approval-payload.test.ts`, `approval-revalidation.test.ts`,
`ai-approval-request.service.test.ts`, `ai-admin.approvals.http.int.test.ts`.

# AG. Customer-facing AI policy foundation

518. [x] Add customer-facing channel/risk classification contract.
519. [x] Define conversation/customer scope context.
520. [x] Keep customer context isolated from other customers.
521. [x] Define DRAFT_ONLY mode.
522. [x] Define APPROVAL_REQUIRED mode.
523. [x] Define AUTO_SEND_ALLOWED mode contract for future narrow policies.
524. [x] Separate draft capability from send capability.
525. [x] Define escalation contract/reason.
526. [x] Define internal-only vs customer-visible content requirement/contract.
527. [x] Ensure customer messages are untrusted input.
528. [x] Ensure customer text cannot widen tools/capabilities.
529. [x] Ensure no Credentials/secrets in customer-facing context.
530. [x] Do not implement production Messenger auto-send runtime in Phase 1.
531. [x] Add customer-isolation policy tests/contracts where possible.

Runtime: `packages/shared/src/ai/customer-facing-*.ts`, `customer-isolation.ts`,
`capability-catalog.customer.ts`. Modes are DRAFT_ONLY / APPROVAL_REQUIRED / AUTO_SEND_ALLOWED.
`messenger.reply_draft` and `messenger.reply_send` are distinct registry keys (canon
`messenger.reply.draft` / `messenger.reply.send`); send is HIGH + `approval: REQUIRED`. Granting
draft does not grant send. AUTO_SEND_ALLOWED with an empty category allowlist still requires
approval — nothing auto-sends by default. Customer messages are `UNTRUSTED_CONTENT` and are not
policy inputs. Conversation scope matches channel + conversationId + customerId deny-by-default.
INTERNAL_ONLY content cannot be disclosed. Secrets are refused in approval payloads and by the
existing context assembler. REST/MCP and the Domain Action Gateway have no Messenger send handler.
Tests: `customer-facing-policy.test.ts`, `customer-isolation.test.ts`,
`approval-customer-isolation.security.test.ts`, `capability-registry.test.ts`.

# AH. Usage, cost and observability foundation

532. [x] Create/extend AI execution record contract.
533. [x] Attribute execution to actor/agent.
534. [x] Attribute provider connection.
535. [x] Attribute model.
536. [x] Attribute Model Policy/routing config.
537. [x] Attribute capability/domain/channel.
538. [x] Store correlation id.
539. [x] Track status/success/failure.
540. [x] Track latency.
541. [x] Track retry count.
542. [x] Track fallback occurrence/reason.
543. [x] Track provider usage units/tokens where available.
544. [x] Track estimated/provider-reported cost where available.
545. [x] Keep pricing-version/effective-date concept for historical cost integrity.
546. [x] Define basic budget/usage limit schema/contracts.
547. [x] Avoid storing full sensitive prompts solely for metrics.
548. [x] Add execution/usage attribution tests.

Chat 11: `AiExecution` is an attribution/metrics row (capability invocations and future model calls). Opaque ids, no FKs, no prompt/completion/secret columns. External Agent protocol records capability rows best-effort after domain commit (`AgentProtocolInvoker`); a metrics failure must not fail Tasks/Drive. Provider/model/policy/token/cost fields exist on the row and are filled when a model invocation records them — Phase 1 has no Internal Agent model-call loop, so live External Agent rows typically have those nullable. Budgets are `AiBudgetLimit` + pure `evaluateAiBudget` / `shouldHardStopAiBudget`; HARD*STOP is defined as blocking a \_new* model invocation, never wrapping an in-flight Tasks/Drive commit. External Agent abuse controls remain section U rate limits. Tests: `execution-evaluation.test.ts`, `ai-execution.service.test.ts`, `agent-protocol.invoker.test.ts`.

# AI. Evaluation foundation

549. [x] Create evaluation suite/run contracts or entities sufficient for future use.
550. [x] Support model/model-policy evaluation target.
551. [x] Support prompt-version attribution.
552. [x] Support dataset/version identity.
553. [x] Support aggregate quality/latency/cost results.
554. [x] Keep deterministic/human/model-based grading separable.
555. [x] Do not automatically activate/promote model based only on provider release.
556. [x] Do not automatically promote based only on LLM-judge score.
557. [x] Add admin notes/suitability/evaluation status to model management.

Chat 8 live negatives still hold (555/556). Chat 11 added `AiEvaluationSuite` / `AiEvaluationDataset` / `AiEvaluationRun` with exactly one `gradingKind` per run. `evaluationScoreMayAutoActivateModel()` is hardcoded `false`; completing a run does not write `AiModel.status`. `AiModel.evaluationStatus` is admin-owned (`NOT_EVALUATED` / `PENDING` / `EVALUATED` / `UNSUITABLE`); catalog sync does not set it (DB default `NOT_EVALUATED`). Tests: `execution-evaluation.test.ts`, `ai-evaluation.service.test.ts`, `ai-model-catalog.service.test.ts`.

# AJ. Central AI administration UI

558. [x] Add central `Settings -> AI & Agents` area (or accepted equivalent).
559. [x] Add Overview page/summary.
560. [x] Add External Agents list.
561. [x] Add External Agent create flow.
562. [x] Add External Agent detail/edit flow.
563. [x] Add capability grant UI.
564. [x] Add Work Space scope grant UI.
565. [x] Add one-time token issuance display.
566. [x] Add token rotate flow.
567. [x] Add token revoke flow.
568. [x] Add External Agent disable/re-enable flow.
569. [x] Add last-used metadata.
570. [x] Add External Agent audit/activity view/link.
571. [x] Never redisplay raw token/hash after issuance.
572. [x] Add Providers page.
573. [x] Add OpenAI provider connection flow.
574. [x] Add Anthropic provider connection flow.
575. [x] Add Validate Connection action.
576. [x] Add Rotate/Replace Provider Key flow.
577. [x] Add Disable Provider flow.
578. [x] Add Models page.
579. [x] Add Sync Models action.
580. [x] Show DISCOVERED models separately.
581. [x] Add model Activate/Disable actions.
582. [x] Show provider/model metadata and internal notes/tags.
583. [x] Add Model Policies page.
584. [x] Add FIXED policy create/edit UI.
585. [x] Add PRIMARY_FALLBACK policy create/edit UI.
586. [x] Allow cross-provider candidates.
587. [x] Add Internal Agents page/shell.
588. [x] Add Internal Agent create/configure UI foundation.
589. [x] Add Model Policy assignment.
590. [x] Add prompt-policy assignment placeholder/foundation.
591. [x] Add approval-policy assignment placeholder/foundation.
592. [x] Add Usage page/shell.
593. [x] Add Approvals page/queue shell.
594. [x] Add AI Audit/Activity view.
595. [x] Add admin authorization tests.

Runtime: Employee admin HTTP is `/api/ai-admin` with existing `COMPANY` + `EDIT` (not `AgentAuthGuard`). Controllers wrap Chat 2/5 services; composition reads go through `AiAdminQueryService`. Settings → AI & Agents uses `ModuleHeroSlotProvider` + `PageHeroNavLinks`. Raw External Agent tokens and provider keys appear once in a modal / password field and never on later list/detail. REVOKED is terminal in UI (no enable/issue/grant). Sync does not auto-activate. Model Policies expose only `FIXED` and `PRIMARY_FALLBACK`; TIERED/ADAPTIVE are not in the UI. Internal Agents create as DRAFT and activate only via `InternalAgentService.activate`. Usage lists recent `AiExecution` rows and enabled budgets; Approvals remain the Chat 10 queue. 584/585: `PolicyCandidateEditor` replaces FIXED primary and ordered PRIMARY_FALLBACK candidates through `replacePolicyCandidates`.

# AK. Contextual module access UI

596. [x] Add Work Space `Settings -> AI Access` contextual view.
597. [x] Show External Agents currently scoped to that Work Space.
598. [x] Allow authorized admin to grant existing Agent access from Work Space context.
599. [x] Allow authorized admin to revoke Work Space access contextually.
600. [x] Link to canonical central External Agent detail.
601. [x] Ensure contextual UI uses the same grants as central AI administration.
602. [x] Do not create a second Work Space-specific permission database.

Runtime: Work Space Settings → AI Access is gated by `COMPANY` + `EDIT` and calls `GET/POST/DELETE /api/ai-admin/workspaces/:workspaceId/access`. Grants write `external_agent_resource_scope` through `AgentGrantService.grantScope` / `revokeScope` with `scopeType: 'WORKSPACE'`. Token rotation is not offered in the contextual sheet. REVOKED agents cannot be granted.

# AL. Security hardening

603. [x] Verify External Agent cannot access Credentials secret endpoints.
604. [x] Verify External Agent token cannot authenticate to unrestricted Employee-only APIs.
605. [x] Verify Agent cannot enumerate unauthorized Projects.
606. [x] Verify Agent cannot enumerate unauthorized Products.
607. [x] Verify Agent cannot enumerate unauthorized Work Spaces.
608. [x] Verify Agent cannot enumerate unauthorized Tasks.
609. [x] Verify REST and MCP both enforce same isolation.
610. [x] Verify Authorization headers are redacted.
611. [x] Verify credential hashes are never API-visible.
612. [x] Verify provider keys are never API-visible after save.
613. [x] Verify revoked credential blocks next REST request.
614. [x] Verify revoked credential blocks next MCP invocation.
615. [x] Verify disabled External Agent blocks all credentials.
616. [x] Verify malformed/oversized payload rejection.
617. [x] Verify prompt/task/comment/file content cannot alter authorization.
618. [x] Verify Drive link cannot escape authorized scope.
619. [x] Verify no raw SQL/database capability exists.
620. [x] Verify no Task delete capability exists for External Agent Phase 1.
621. [x] Verify no force-complete capability exists.
622. [x] Verify no unrestricted Finance mutation capability exists.
623. [x] Verify no unrestricted client-message send capability exists.
624. [x] Verify newly discovered model cannot become production-active automatically.
625. [x] Verify provider credential never enters AI context.
626. [~] Verify queued sensitive actions revalidate revoked actor/grant as designed. Phase 1 executes every agent capability inline, so there is no queued sensitive action to revalidate before its domain commit; the item stays open until deferred execution exists.

Runtime: `apps/api/src/modules/ai-platform/security/` holds the hardening suite as executable tests, not as a review note.

| File                                         | Items                               |
| -------------------------------------------- | ----------------------------------- |
| `agent-boundary.security.http.int.test.ts`   | 603, 604, 609, 610, 613–616         |
| `agent-scope-isolation.security.test.ts`     | 605–608, 617                        |
| `agent-surface.security.test.ts`             | 611, 612, 619–625                   |
| `gateway/agent-drive.handler.test.ts`        | 618                                 |
| `gateway/agent-replay-authorization.test.ts` | replay re-authorization (see below) |

Replay re-authorization is separate hardening and is **not** 626. `AgentReplayAuthorization` re-runs the policy for the original target before `AgentCapabilityGateway` replays a stored idempotent result, so a capability grant or resource scope revoked after the first success cannot be honoured by a retry. Task-scoped replays re-enter `AgentTaskAccess.requireAuthorizedTask`; workspace-scoped replays re-target the Work Space; an input that resolves to neither is refused as unavailable rather than allowed. That lifecycle point is after the first domain commit, whereas 626 asks for revalidation of a queued action immediately before its own commit, which Phase 1 has no execution path for. 619–623 are asserted against the capability catalog and the published REST/MCP operation registry together, so a capability cannot be reachable on one protocol only. 616 covers unknown JSON fields (refused by `pickCapabilityInput`, never forwarded to the domain), oversized bodies (413) and malformed JSON-RPC. 624 pins `AI_MODEL_STATUS_ON_DISCOVERY` so a synced model is `DISCOVERED`; activation stays an explicit admin action. 625 asserts the serialized Internal Agent execution context carries no secret-shaped material.

# AM. Regression and compatibility

627. [x] Existing Employee login works.
628. [x] Existing Employee RBAC behavior remains unchanged.
629. [x] Existing Platform Access human grants remain valid.
630. [x] Existing Audit pages/APIs still display historical human rows.
631. [x] Existing Tasks UI behavior remains intact.
632. [x] Existing Tasks workflow remains intact.
633. [x] Existing Drive access remains intact and not widened.
634. [x] Existing Integrations behavior remains intact.
635. [x] Existing API application boots.
636. [x] Existing worker boots.
637. [x] Existing scheduler boots.
638. [~] Prisma migrations are production-safe/forward-fixable according to project standards.
639. [x] Validate migrations on representative existing data.
640. [x] Run relevant lint/typecheck/test suites.

Evidence (dev Neon `ep-late-frost-ag5aixzw`; production was not contacted):

| Item    | Evidence                                                                                                                                                                            |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 627–634 | `auth` 10/37, `platform-access` 4/8, `audit` 4/28, `tasks` 21/105, web `features/tasks` 26/95, `drive` 24/140, `integrations` 25/177, `src/security` 2/7 (files/tests, all passing) |
| 630     | Dev `audit_logs`: 339 rows, 0 without `actor_type` after the backfill                                                                                                               |
| 635     | `PROCESS_ROLE=api` boots; `/api/health` 200; `/api/v1/agent/me` and MCP return the `09` envelope with `AGENT_AUTH_INVALID`                                                          |
| 636     | `PROCESS_ROLE=worker` boots, registers all four queues, `/health` 200, Prisma ready; `/ready` stays false because this environment has no Redis service                             |
| 637     | `PROCESS_ROLE=scheduler` boots and registers `ai-model-catalog-sync` (paused, roster off)                                                                                           |
| 638–639 | `prisma migrate status` → 213 migrations, schema up to date; Phase 1 migrations are additive                                                                                        |
| 640     | `pnpm test` 838 files / 4245 tests passed (+2/4 skipped), `pnpm test:regression` 22/284, `pnpm lint` 0 errors, `pnpm typecheck` exit 0                                              |

Chat 8 closed 627, 631 and 636. 627/631: a browser walk on 2026-08-22 signed in as an Employee,
loaded `/dashboard`, `/tasks` (46 of 109 tasks, Open/In Progress/Review/On hold columns, including
the Agent-created acceptance tasks appearing as ordinary human-visible Tasks) and the AI & Agents
module. 636: with local Redis reachable, `GET :4102/ready` returned
`{"ready":true,"workers":["drive.zip-export-jobs","mail","reports.export-jobs","whatsapp.product-groups"]}`.
A pre-existing dev-only React hydration warning on `/tasks` was observed and is unrelated to the AI
Platform. 638 is still `[~]` for one reason: `20260821150000_audit_actor_aware` backfills `audit_logs` and builds two non-`CONCURRENTLY` indexes, which the project migration standard classifies as needing explicit approval and a window on a large production table. Everything else is additive DDL on new tables.

# AN. Documentation synchronization

641. [x] Update `00-Documentation-Hub.md` with AI canon links.
642. [x] Update `00-Technical-Decisions-By-Module.md` with AI Platform decisions.
643. [x] Update `00-Implementation-Roadmap.md` with Phase 1 AI Foundation slice.
644. [x] Update Architecture Layers wording so AI is not merely an Automation Layer feature.
645. [x] Update Platform Access docs if runtime contracts evolve.
646. [x] Update Audit docs for actor-aware audit.
647. [x] Update Tasks docs for any lifecycle/runtime decisions resolved.
648. [x] Update Drive docs if Agent artifact access introduces new canonical behavior.
649. [x] Update `99-AI-Cleanup-Register.md` with resolved/open conflicts and evidence.
650. [x] Add External Agent REST setup documentation.
651. [x] Add External Agent MCP setup documentation.
652. [x] Add token rotation/revocation runbook.
653. [x] Add leaked External Agent token incident runbook.
654. [x] Add provider-key rotation incident/runbook guidance.
655. [x] Add policy denial/scope troubleshooting guide.
656. [x] Add model sync/availability troubleshooting guide.

Runtime: 650/651 stay in `21-External-Agent-Client-Setup.md` (extended with the U rate-limit budgets and headers, not duplicated). 652–656 are `25-AI-Platform-Operations-Runbooks.md`. 645 needed no contract change — Platform Access remains employee-only and already states that AI principals never enter `ResourceAccessGrant`.

# AO. Final External Agent acceptance

657. [x] Create one test External Agent scoped to one non-production/test Work Space.
658. [x] Agent REST lists only authorized Work Space.
659. [x] Agent MCP lists only authorized Work Space.
660. [x] Agent REST lists only authorized tasks.
661. [x] Agent MCP lists only authorized tasks.
662. [x] Agent cannot read known task from another Work Space via REST.
663. [x] Agent cannot read known task from another Work Space via MCP.
664. [x] Agent reads permitted linked artifact.
665. [x] Agent cannot read unrelated Drive artifact.
666. [x] Agent with `tasks.create` creates a Task.
667. [x] Agent without `tasks.create` cannot create a Task.
668. [x] Agent with `tasks.update` updates an allowed field.
669. [x] Agent cannot update a forbidden field.
670. [x] Agent cannot delete a Task.
671. [x] Agent starts allowed Task.
672. [x] Agent posts progress/comment with visible AI provenance.
673. [x] Agent attaches generated artifact.
674. [x] Agent submits Task for review.
675. [x] Human review/completion still controls final completion.
676. [x] Duplicate create retry does not duplicate Task.
677. [x] Duplicate comment retry does not duplicate comment.
678. [x] Duplicate transition retry does not duplicate effects.
679. [x] Revoking credential blocks next REST request.
680. [x] Revoking credential blocks next MCP invocation.
681. [x] Disabling Agent blocks all credentials.
682. [x] Audit identifies External Agent + protocol + capability + resource + result.
683. [x] No audit/log contains raw Agent token.
684. [x] Cross-Work Space negative suite passes.
685. [x] REST/MCP parity suite passes.

Evidence: live walk against the running API (`localhost:4100`, dev Neon `ep-late-frost-ag5aixzw`) on
2026-08-22, 29/29 PASS, driver in `apps/api/.chat8/ao/`, full transcript in `.chat8/ao-run.log`,
created rows in `.chat8/ao-artifacts.json`. Every item was exercised over both protocols where the
checklist names both. `tasks.delete` has no REST route, no published MCP tool (14 tools, none
matching delete/force/set_status) and no capability key; completion stayed with the Employee. See
`26-Phase-1-Chat-8-Acceptance.md` for the per-item evidence table.

# AP. Final Provider/Model/Internal foundation acceptance

686. [x] Connect a test OpenAI provider connection securely.
687. [x] Validate OpenAI connection.
688. [x] Sync OpenAI model catalog.
689. [~] Connect a test Anthropic provider connection securely.
690. [~] Validate Anthropic connection.
691. [~] Sync Anthropic model catalog.
692. [x] Newly discovered model appears as DISCOVERED, not ACTIVE.
693. [x] Admin can explicitly activate/disable model.
694. [x] Provider key cannot be retrieved after save.
695. [x] Create FIXED Model Policy with one active model.
696. [x] Create PRIMARY_FALLBACK policy with ordered models.
697. [~] PRIMARY_FALLBACK can include models from different providers.
698. [x] Create Internal Agent in DRAFT.
699. [x] Assign capabilities/scopes contract to Internal Agent.
700. [x] Assign Model Policy to Internal Agent.
701. [x] Assign prompt-policy foundation/config.
702. [x] Activate Internal Agent only when required dependencies validate.
703. [x] Pause/disable blocks new execution contract/path.
704. [x] Audit records provider/model/Internal Agent configuration changes.
705. [x] Usage/execution records can attribute agent/provider/model/policy.

Evidence: live walk on 2026-08-22 with a real OpenAI key supplied by the developer; driver in
`apps/api/.chat8/ap/`, records in `.chat8/ap-artifacts.json`. A first sync created 124 models, all
`DISCOVERED`, none `ACTIVE`. The stored key was not retrievable from any admin read path and does
not appear in any audit row. 689–691 and 697 are `[~]` for one reason only: **no Anthropic test key
was supplied**, so the Anthropic adapter, its secret storage and cross-provider fallback are covered
by unit tests (`anthropic.adapter.test.ts`, `ai-model-sync.service.test.ts`,
`ai-model-policy.rules.test.ts`) but not by a live provider call. 705 is `[x]` for the Chat 11
`AiExecution` contract: the row can attribute actor, External/Internal Agent, provider connection,
model, Model Policy, capability, channel and correlation. Live External Agent protocol rows fill
actor/agent/capability/channel/correlation; provider/model/policy stay null until a model
invocation records them. No Internal Agent model-call loop exists in Phase 1.

# AQ. Final architecture review

706. [x] No External Agent controller contains direct domain Prisma writes.
707. [x] No MCP tool adapter contains direct domain Prisma writes.
708. [x] REST and MCP share the same authentication/policy/capability/domain path.
709. [x] External Agent and Internal Agent use the same normalized Actor/Policy/Capability concepts.
710. [x] Provider/Model selection is separated from Agent identity and permissions.
711. [x] Model changes do not alter domain grants.
712. [x] Prompt configuration does not grant permissions.
713. [x] Customer-facing safety is enforceable outside prompt text.
714. [x] Secrets remain excluded from AI context and audit.
715. [x] Existing human authorization is not replaced/broken.
716. [x] Cleanup Register reflects every remaining known gap.
717. [x] Phase 1 non-goals remain absent.
718. [x] Final security review confirms deny-by-default behavior.
719. [x] Final architecture review confirms future employee AI chat can reuse the foundation without redesign.
720. [x] Final architecture review confirms future Messenger AI can reuse the foundation without redesign.
721. [x] Final architecture review confirms future Documents/CRM/Analytics AI can reuse the foundation without redesign.

Review evidence: `rest/` and `mcp/` contain no `PrismaService` import and no `prisma.` call; both
enter `AgentProtocolInvoker` → `AgentCapabilityGateway`, and the gateway's only Prisma writes are to
`ExternalAgentIdempotencyRecord` (an AI-platform-owned table) while every domain mutation goes
through `TasksService` / `TaskDiscussionService` / the Drive handler. `ACTOR_TYPES` and
`ACTOR_CHANNELS` in `packages/shared/src/actor/` are the single actor vocabulary for `USER`,
`EXTERNAL_AGENT`, `INTERNAL_AI`, `SYSTEM` and `AUTOMATION`, with `messenger` already a channel and
`onBehalfOf` already modelled — that, plus one capability registry shared by both agent kinds, is
what makes 719–721 answerable without a second identity system. `promptPolicyId` is an opaque
column that no policy path reads. 713 is `[x]`: safety is enforced outside prompt text (risk class,
data classification, `REQUIRE_APPROVAL`, distinct draft/send grants, DRAFT_ONLY /
APPROVAL_REQUIRED / AUTO_SEND_ALLOWED, conversation/customer isolation). Production Messenger
auto-send remains absent (530).

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
