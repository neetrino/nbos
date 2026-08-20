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

1. [ ] Read `00-AI-Platform-Overview.md`.
2. [ ] Read `01-AI-Actors-Identity-and-Access.md`.
3. [ ] Read `02-AI-Capability-and-Action-Layer.md`.
4. [ ] Read `03-External-Agent-Access.md`.
5. [ ] Read `04-Internal-AI-Runtime.md`.
6. [ ] Read `05-AI-Data-Security-and-Audit.md`.
7. [ ] Read `06-AI-Providers-Models-and-Routing.md`.
8. [ ] Read `07-AI-Admin-and-Connections-UX.md`.
9. [ ] Read `08-External-Agent-Protocols-REST-and-MCP.md`.
10. [ ] Read `09-External-Agent-API-and-MCP-Contract.md`.
11. [ ] Read `11-Internal-Agent-Lifecycle-and-Assignments.md`.
12. [ ] Read `12-AI-Prompts-Context-Memory-and-Knowledge.md`.
13. [ ] Read `13-AI-Risk-and-Approval-Policy.md`.
14. [ ] Read `14-AI-Evaluation-Usage-Cost-and-Observability.md`.
15. [ ] Read `15-Customer-Facing-AI-Policy.md`.
16. [ ] Read `99-AI-Cleanup-Register.md`.
17. [ ] Read `00-Technical-Decisions-By-Module.md` global technical rules.
18. [ ] Read Platform Access Foundation canon/runtime.
19. [ ] Read Tasks canon and Task cleanup register.
20. [ ] Read Drive canon relevant to Task artifacts.
21. [ ] Read Audit runtime and schema.
22. [ ] Read existing authentication/RBAC runtime.
23. [ ] Read current integration/provider patterns without conflating them with AI Agent identities.
24. [ ] Compare current `TaskStatusEnum` runtime with current Tasks canon.
25. [ ] Confirm runtime semantics for Start Task.
26. [ ] Confirm runtime semantics for Submit Review.
27. [ ] Confirm canonical task discussion/comment storage.
28. [ ] Confirm canonical task attachment/Drive linking flow.
29. [ ] Confirm Work Space Product/Extension/Project relationship semantics.
30. [ ] Confirm current API response/error/pagination conventions.
31. [ ] Confirm current secret storage/encryption mechanisms usable for provider credentials.
32. [ ] Confirm current BullMQ/worker propagation patterns for ActorContext/correlation data.
33. [ ] Document all canon/runtime conflicts found before implementing around them.
34. [ ] Classify each conflict as OK/PARTIAL/MISSING/STALE/BUSINESS DECISION.
35. [ ] Produce a touched-module map for Phase 1.

# B. Phase 1 scope lock

36. [ ] Lock Phase 1 as shared AI foundation + External Workspace Agent + provider/model/internal-agent foundation.
37. [ ] Confirm External Agent may receive `tasks.create` only via explicit grant.
38. [ ] Confirm External Agent may receive `tasks.update` only via explicit grant.
39. [ ] Define exact allowlisted fields for `tasks.update` from current Tasks domain rules.
40. [ ] Confirm External Agent has no `tasks.delete` capability in Phase 1.
41. [ ] Confirm External Agent has no unrestricted arbitrary status mutation capability.
42. [ ] Confirm External Agent cannot force final task completion when human review is required.
43. [ ] Confirm REST and MCP are both Phase 1 deliverables.
44. [ ] Confirm OpenAI provider connection foundation is Phase 1.
45. [ ] Confirm Anthropic provider connection foundation is Phase 1.
46. [ ] Confirm model-catalog synchronization is Phase 1.
47. [ ] Confirm FIXED model policy is Phase 1.
48. [ ] Confirm PRIMARY_FALLBACK model policy is Phase 1.
49. [ ] Confirm Internal Agent entity/lifecycle foundation is Phase 1.
50. [ ] Confirm full internal employee AI chat runtime is NOT Phase 1.
51. [ ] Confirm production Messenger auto-reply runtime is NOT Phase 1.
52. [ ] Confirm production RAG/vector infrastructure is NOT Phase 1.
53. [ ] Confirm adaptive/learned model routing is NOT Phase 1.
54. [ ] Confirm automatic activation of newly discovered models is forbidden.
55. [ ] Confirm customer-facing autonomous high-risk actions are NOT Phase 1.

# C. Actor foundation

56. [ ] Define normalized `ActorType` contract.
57. [ ] Support `USER` actor.
58. [ ] Support `EXTERNAL_AGENT` actor.
59. [ ] Support `INTERNAL_AI` actor.
60. [ ] Support `SYSTEM` actor where appropriate.
61. [ ] Support `AUTOMATION` actor where appropriate.
62. [ ] Define normalized `ActorContext` shared by policy/audit/capabilities.
63. [ ] Include stable actor id/type/display identity.
64. [ ] Include organization/tenant context where applicable.
65. [ ] Add `onBehalfOf` support.
66. [ ] Add channel/source metadata support.
67. [ ] Add correlation/request id support.
68. [ ] Ensure machine actors are never represented as fake Employees.
69. [ ] Preserve employee actor behavior without widening existing access.
70. [ ] Add actor normalization unit tests.

# D. Audit actor migration

71. [ ] Design backward-compatible AuditLog evolution.
72. [ ] Preserve all existing audit history.
73. [ ] Add actor type/id fields or equivalent normalized structure.
74. [ ] Keep legacy `userId` compatibility where required.
75. [ ] Allow AuditLog creation for non-Employee actors.
76. [ ] Update AuditService logging interface to accept ActorContext.
77. [ ] Update actor display resolution for Employee and AI actors.
78. [ ] Add `onBehalfOf` audit fields/context.
79. [ ] Add channel/protocol/source audit metadata where useful.
80. [ ] Add correlation/execution id fields/context.
81. [ ] Add safe credential/client metadata only where useful.
82. [ ] Prevent raw bearer tokens from audit.
83. [ ] Prevent provider API keys from audit.
84. [ ] Prevent full sensitive prompt/context persistence by default.
85. [ ] Audit External Agent lifecycle changes.
86. [ ] Audit provider connection lifecycle changes.
87. [ ] Audit model activation/deactivation.
88. [ ] Audit model policy changes.
89. [ ] Audit Internal Agent lifecycle changes.
90. [ ] Audit capability/scope changes.
91. [ ] Audit approval lifecycle.
92. [ ] Add migration tests using representative historical AuditLog rows.
93. [ ] Add human audit regression tests.
94. [ ] Add External Agent audit tests.
95. [ ] Add Internal AI audit contract tests.

# E. External Agent persistence

96. [ ] Add External Agent model/entity.
97. [ ] Add stable id.
98. [ ] Add human-readable name.
99. [ ] Add description/purpose.
100.  [ ] Add owner/creator Employee relation.
101.  [ ] Add ACTIVE/DISABLED/REVOKED/EXPIRED semantics.
102.  [ ] Add optional agent expiry.
103.  [ ] Add lastUsedAt.
104.  [ ] Add safe last-client/IP metadata only if useful.
105.  [ ] Add createdAt/updatedAt.
106.  [ ] Add appropriate indexes.
107.  [ ] Ensure agent identity remains stable through credential rotation.
108.  [ ] Add persistence tests.

# F. External Agent credentials

109. [ ] Create separate External Agent Credential model.
110. [ ] Generate cryptographically strong opaque tokens.
111. [ ] Store only secure token hash/derived verifier.
112. [ ] Store safe prefix/key id for lookup/display.
113. [ ] Show raw token only once on issuance.
114. [ ] Show raw token only once on rotation.
115. [ ] Support credential expiry.
116. [ ] Support immediate credential revoke.
117. [ ] Support credential rotation.
118. [ ] Support temporary overlap during controlled rotation if implemented.
119. [ ] Agent disable/revoke invalidates all credentials immediately.
120. [ ] Never log Authorization token.
121. [ ] Never expose token hash in API/UI.
122. [ ] Implement safe token verification.
123. [ ] Add invalid token tests.
124. [ ] Add revoked token tests.
125. [ ] Add expired token tests.
126. [ ] Add rotation tests.

# G. External Agent authentication boundary

127. [ ] Implement dedicated External Agent authentication guard/middleware.
128. [ ] Keep employee JWT/session authentication separate.
129. [ ] Build ActorContext from authenticated External Agent.
130. [ ] Reject disabled agent.
131. [ ] Reject revoked agent.
132. [ ] Reject expired agent/credential.
133. [ ] Use stable machine-readable auth errors.
134. [ ] Avoid record existence leakage through auth errors.
135. [ ] Require TLS production assumption.
136. [ ] Accept token in Authorization header.
137. [ ] Do not require query-string token.
138. [ ] Redact Authorization values from logs/errors.
139. [ ] Add auth observability without secrets.
140. [ ] Add Employee-vs-Agent boundary tests.

# H. Capability registry

141. [ ] Define stable capability key format.
142. [ ] Define capability version strategy.
143. [ ] Define owning module.
144. [ ] Define read/write classification.
145. [ ] Define risk class.
146. [ ] Define allowed scope types.
147. [ ] Define input schema metadata.
148. [ ] Define output/projection schema metadata.
149. [ ] Define idempotency requirement metadata.
150. [ ] Define audit behavior metadata.
151. [ ] Define approval requirement metadata.
152. [ ] Define rate-limit class metadata.
153. [ ] Prevent unknown capability grants.
154. [ ] Register Phase 1 Work Space/Task/Drive capabilities deterministically.
155. [ ] Register `tasks.create` separately.
156. [ ] Register `tasks.update` separately.
157. [ ] Do not register `tasks.delete` for External Agent Phase 1.
158. [ ] Do not register generic `tasks.set_status(anyStatus)`.
159. [ ] Add capability-registry tests.

# I. Capability grants and resource scopes

160. [ ] Add External Agent capability grant persistence.
161. [ ] Add resource scope persistence.
162. [ ] Support Work Space scope.
163. [ ] Keep Project scope structurally possible.
164. [ ] Keep Product scope structurally possible.
165. [ ] Keep explicit resource scope structurally possible.
166. [ ] Keep organization scope structurally possible but do not grant broadly by default.
167. [ ] Support grant revoke.
168. [ ] Support optional grant expiry if useful.
169. [ ] Capability grant must not imply all resources.
170. [ ] Resource scope must not imply all actions.
171. [ ] Add indexes for actor/capability/scope evaluation.
172. [ ] Audit grant create/change/revoke.
173. [ ] Add grant-evaluation tests.
174. [ ] Add cross-Workspace denial tests.
175. [ ] Add revoked-grant denial tests.

# J. Policy evaluator

176. [ ] Implement one reusable Policy Evaluator.
177. [ ] Default to DENY.
178. [ ] Evaluate actor state.
179. [ ] Evaluate credential state where applicable.
180. [ ] Evaluate capability grant.
181. [ ] Evaluate resource scope.
182. [ ] Evaluate module-specific restrictions.
183. [ ] Evaluate data classification/restrictions.
184. [ ] Evaluate action risk.
185. [ ] Evaluate approval requirement.
186. [ ] Evaluate usage/rate limits.
187. [ ] Support ALLOW.
188. [ ] Support DENY.
189. [ ] Support REQUIRE_APPROVAL.
190. [ ] Return structured internal denial reasons.
191. [ ] Map safe external errors without existence leakage.
192. [ ] Make prompt/document/message content unable to alter policy result.
193. [ ] Add policy unit tests.
194. [ ] Add deny-by-default tests.
195. [ ] Add scope traversal/isolation tests.

# K. Domain Action Gateway

196. [ ] Create shared AI/agent capability invocation boundary.
197. [ ] Prohibit direct Prisma domain writes from REST agent controllers.
198. [ ] Prohibit direct Prisma domain writes from MCP tool adapters.
199. [ ] Prohibit direct Prisma domain writes from future Internal AI tool adapters.
200. [ ] Route Task actions through Tasks application/domain services.
201. [ ] Route Drive operations through Drive services.
202. [ ] Preserve ActorContext through invocation.
203. [ ] Preserve correlation id through invocation.
204. [ ] Validate capability input schemas.
205. [ ] Validate output projection schemas.
206. [ ] Re-check target scope server-side.
207. [ ] Audit successful material mutations after domain commit.
208. [ ] Audit failures/denials where policy requires.
209. [ ] Preserve transaction boundaries.
210. [ ] Add gateway integration tests.

# L. Work Space discovery and isolation

211. [ ] Implement authorized Work Space list/discovery.
212. [ ] Implement authorized Work Space detail projection.
213. [ ] Return only granted/derived authorized Work Spaces.
214. [ ] Hide unauthorized names/counts.
215. [ ] Resolve Product/Extension Work Space semantics canonically.
216. [ ] Never trust client-provided Project/Product relationships as authority.
217. [ ] Re-resolve scope server-side on every action.
218. [ ] Test agent Work Space A cannot discover Work Space B.
219. [ ] Test guessed Work Space B id fails safely.
220. [ ] Test shared Project does not automatically widen Work Space scope.
221. [ ] Test disabled agent loses discovery.

# M. Task read capabilities

222. [ ] Implement `tasks.list`.
223. [ ] Scope `tasks.list` to authorized Work Space.
224. [ ] Implement `tasks.read`.
225. [ ] Use purpose-built Task projection.
226. [ ] Include id/code/title.
227. [ ] Include description safely.
228. [ ] Include status.
229. [ ] Include priority.
230. [ ] Include due date.
231. [ ] Include permitted Work Space/Sprint context.
232. [ ] Include permitted checklist state where needed.
233. [ ] Include permitted links only.
234. [ ] Exclude unrelated Finance data.
235. [ ] Exclude Credentials/secrets.
236. [ ] Exclude unrelated customer/private data.
237. [ ] Add bounded pagination.
238. [ ] Add stable agent-useful filters/sorting.
239. [ ] Add unauthorized task read tests.
240. [ ] Add payload-minimization tests.

# N. Task discussion/context read

241. [ ] Confirm canonical discussion source.
242. [ ] Implement `tasks.read_discussion`.
243. [ ] Apply Task/Work Space access check first.
244. [ ] Limit discussion history/page size.
245. [ ] Preserve author/source metadata.
246. [ ] Preserve AI/human provenance.
247. [ ] Treat discussion text as untrusted content.
248. [ ] Exclude hidden/private content according to Tasks rules.
249. [ ] Add discussion access tests.

# O. Drive artifact reads

250. [ ] Implement linked Task artifact metadata read.
251. [ ] Verify Task/Work Space link before artifact access.
252. [ ] Apply Drive policy in addition to Agent scope.
253. [ ] Block forbidden secret artifacts.
254. [ ] Avoid exposing arbitrary bucket paths.
255. [ ] Use safe/short-lived download mechanism.
256. [ ] Apply read size/type constraints where relevant.
257. [ ] Add cross-Task artifact isolation tests.
258. [ ] Add cross-Work Space artifact isolation tests.

# P. Task create capability

259. [ ] Implement `tasks.create` as separately grantable capability.
260. [ ] Require authorized target Work Space.
261. [ ] Define strict Task create input DTO/schema.
262. [ ] Apply normal Tasks defaults/business validation.
263. [ ] Prevent unrelated Project/Product/entity guessed-id linking.
264. [ ] Apply assignment/reviewer rules from Tasks domain.
265. [ ] Apply priority/due-date validation.
266. [ ] Apply idempotency to create.
267. [ ] Preserve External Agent as creator/source provenance without fake Employee impersonation.
268. [ ] Audit Task creation.
269. [ ] Test create allowed when capability granted.
270. [ ] Test create denied without capability.
271. [ ] Test create denied outside Work Space scope.
272. [ ] Test duplicate retry does not duplicate Task.

# Q. Task update capability

273. [ ] Implement separately grantable `tasks.update`.
274. [ ] Define explicit editable-field allowlist.
275. [ ] Reject unknown/non-allowlisted fields.
276. [ ] Reject deletion through update.
277. [ ] Reject arbitrary status assignment through update.
278. [ ] Reject direct final-completion bypass.
279. [ ] Reject unauthorized Work Space reassignment.
280. [ ] Reject audit/system/security-field mutation.
281. [ ] Use Tasks domain services/commands.
282. [ ] Add optimistic precondition/version/updatedAt check where needed.
283. [ ] Avoid silently overwriting materially newer human changes.
284. [ ] Audit material Task updates.
285. [ ] Test allowed-field updates.
286. [ ] Test denied-field updates.
287. [ ] Test stale update conflict.
288. [ ] Test update denied without capability.

# R. Semantic Task workflow actions

289. [ ] Implement `tasks.start`.
290. [ ] Map `tasks.start` to current Tasks lifecycle.
291. [ ] Reject invalid Start transition deterministically.
292. [ ] Implement `tasks.comment`.
293. [ ] Preserve External Agent authorship/source on comment.
294. [ ] Implement `tasks.submit_review`.
295. [ ] Map submit-review to current Tasks lifecycle.
296. [ ] Reject invalid submit-review transition.
297. [ ] Ensure External Agent cannot force Completed.
298. [ ] Ensure External Agent cannot delete Task.
299. [ ] Ensure returned-from-review Task can be read/reworked normally.
300. [ ] Audit semantic Task actions.
301. [ ] Add valid-transition tests.
302. [ ] Add invalid-transition tests.

# S. Artifact writes

303. [ ] Implement generated artifact upload through Drive.
304. [ ] Create Drive File Asset using existing ownership rules.
305. [ ] Link artifact to authorized Task/Work Space.
306. [ ] Store agent/source provenance.
307. [ ] Validate file size.
308. [ ] Validate file type.
309. [ ] Apply established unsafe/executable-file policy.
310. [ ] Prevent arbitrary unrelated entity links.
311. [ ] Apply idempotency to artifact link creation where necessary.
312. [ ] Add upload/link tests.

# T. Idempotency

313. [ ] Define common External Agent idempotency contract.
314. [ ] Support `Idempotency-Key` for REST mutations.
315. [ ] Support equivalent `clientOperationId` for MCP tools.
316. [ ] Scope idempotency to actor/capability appropriately.
317. [ ] Store operation identity/result safely.
318. [ ] Return original compatible result for safe duplicate retry.
319. [ ] Prevent duplicate Task create.
320. [ ] Prevent duplicate comments.
321. [ ] Prevent duplicate artifact links.
322. [ ] Prevent duplicate semantic transitions.
323. [ ] Add duplicate/retry tests.

# U. Rate limits and abuse controls

324. [ ] Define per-External-Agent request limits.
325. [ ] Define per-capability limits for expensive/mutating actions.
326. [ ] Define payload size limits.
327. [ ] Define optional concurrency limits.
328. [ ] Return stable rate-limit error/retry metadata.
329. [ ] Ensure abusive Agent cannot consume employee API capacity globally.
330. [ ] Add rate-limit tests.

# V. REST machine API

331. [ ] Implement dedicated `/api/v1/agent` namespace.
332. [ ] Implement `GET /agent/me` or equivalent identity endpoint.
333. [ ] Implement Work Space discovery endpoints.
334. [ ] Implement Task read/list endpoints.
335. [ ] Implement Task create endpoint.
336. [ ] Implement Task allowlisted update endpoint.
337. [ ] Implement semantic start endpoint.
338. [ ] Implement comment endpoint.
339. [ ] Implement submit-review endpoint.
340. [ ] Implement discussion read endpoint.
341. [ ] Implement artifact list/read endpoint.
342. [ ] Implement artifact attach/upload endpoint.
343. [ ] Do not expose Task delete endpoint for Agent Phase 1.
344. [ ] Use consistent JSON error envelope.
345. [ ] Use stable error codes from `09` contract.
346. [ ] Add pagination contract.
347. [ ] Add idempotency documentation.
348. [ ] Generate/update OpenAPI contracts.
349. [ ] Add REST contract tests.

# W. MCP server/adapter

350. [ ] Implement remote MCP endpoint/server supported by stack.
351. [ ] Authenticate MCP through the same External Agent credential system.
352. [ ] Build same ActorContext as REST.
353. [ ] Implement `nbos_get_identity`.
354. [ ] Implement `nbos_list_workspaces`.
355. [ ] Implement `nbos_get_workspace`.
356. [ ] Implement `nbos_list_tasks`.
357. [ ] Implement `nbos_get_task`.
358. [ ] Implement `nbos_create_task`.
359. [ ] Implement `nbos_update_task`.
360. [ ] Implement `nbos_start_task`.
361. [ ] Implement `nbos_get_task_discussion`.
362. [ ] Implement `nbos_add_task_comment`.
363. [ ] Implement `nbos_list_task_artifacts`.
364. [ ] Implement `nbos_get_task_artifact`.
365. [ ] Implement `nbos_attach_task_artifact`.
366. [ ] Implement `nbos_submit_task_review`.
367. [ ] Do not expose delete tool in Phase 1.
368. [ ] Use structured input/output schemas.
369. [ ] Ensure MCP tools invoke same capabilities/domain services as REST.
370. [ ] Ensure MCP authorization decisions match REST.
371. [ ] Propagate correlation id/protocol metadata.
372. [ ] Add MCP contract tests.
373. [ ] Add REST-vs-MCP parity tests.

# X. External client setup and acceptance

374. [ ] Document generic REST setup.
375. [ ] Document Cursor MCP setup pattern.
376. [ ] Document Codex MCP/API setup pattern where supported.
377. [ ] Document Claude Code MCP/API setup pattern where supported.
378. [ ] Ensure setup requires only NBOS URL + External Agent token.
379. [ ] Ensure setup never requires DB credentials.
380. [ ] Ensure setup never requires SSH.
381. [ ] Ensure setup never requires Employee admin JWT/session.
382. [ ] Ensure setup never requires OpenAI/Anthropic provider keys.

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
