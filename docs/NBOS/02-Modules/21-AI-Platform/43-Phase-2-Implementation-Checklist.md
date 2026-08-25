# Phase 2 — Project Intelligence and Draft Assistant Implementation Checklist

> Status: **PLANNED — BLOCKED BY AI PRODUCT ENTRY GATE**
>
> Canon-linked executable checklist for
> `42-Phase-2-Project-Intelligence-and-Draft-Assistant-Architecture.md`.

## Status format

- `[ ]` not started
- `[~]` partial
- `[x]` verified complete
- `[!]` blocked / required decision

A point is complete only when implementation, negative paths, tests and documentation agree. No
authorization, isolation, privacy, lifecycle or external-send item may remain partial at final
acceptance.

---

# A. Entry gate and current-state reconciliation

1. [x] Confirm Phase 1 official final verdict is `PHASE 1 CLOSEABLE`.
2. [x] Confirm the three post-Phase-1 remediation workstreams are closed `PASS WITH DEBTS`.
3. [x] Confirm Product Entry Gate Workstream 1 production reconciliation is `PASS WITH DEBTS`.
4. [ ] Verify separate Product Entry Gate Workstream 2 completed fail-closed Internal AI Drive authorization.
5. [ ] Verify Workstream 2 received independent PASS with no authorization debt.
6. [ ] Verify separate Product Entry Gate Workstream 3 completed Drive compatibility lifecycle consistency.
7. [ ] Verify Workstream 3 received an independent acceptable verdict.
8. [ ] Verify the separate Product Entry Gate focused cross-regression completed.
9. [ ] Confirm `41-AI-Product-Entry-Gate-Final-Acceptance.md` exists.
10. [ ] Require final gate verdict `READY` with zero authorization/isolation/lifecycle debt.
11. [ ] Re-read active AI Platform canon `00`–`15`, `25`, `31`, `37`–`42` and `99`.
12. [ ] Re-read Projects/Product, Platform Access, Clients/Contact, Messenger, Drive and Documents canon.
13. [ ] Inventory actual Phase 1 runtime and migrations rather than trusting handoff claims.
14. [ ] Confirm provider adapters still only validate/list models before adding invocation.
15. [ ] Confirm Context Assembler still accepts only one bound ALLOW decision before redesign.
16. [ ] Confirm persistent memory/knowledge runtime remains disabled before enabling it.
17. [ ] Confirm current External Messenger/WhatsApp persistence and delivery ownership.
18. [ ] Reconcile Project/Product WhatsApp ownership to one Product -> one group.
19. [ ] Classify all canon/runtime differences as OK/PARTIAL/MISSING/STALE/DECISION.
20. [ ] Record reconciliation evidence in the first Phase 2 handoff before product code.

# B. Scope lock and required decisions

21. [ ] Lock Phase 2 as Internal AI Runtime + Project Intelligence + `DRAFT_ONLY` customer draft.
22. [ ] Lock Project as the required knowledge root.
23. [ ] Lock Product as an optional narrowing/overlay.
24. [ ] Lock Work Space as a live/internal source, not customer-knowledge owner.
25. [ ] Lock tagged memory subject: Project + Contact when known, otherwise non-personalized exact Conversation.
26. [ ] Require exact Product/Conversation narrowing when present.
27. [ ] Lock PostgreSQL FTS as retrieval v1.
28. [ ] Confirm no vector/search dependency is added in Phase 2.
29. [ ] Confirm model-derived memory creates candidates, not trusted facts.
30. [ ] Confirm customer-draft context excludes `INTERNAL_ONLY` sources before generation.
31. [ ] Confirm AI Platform has no production `messenger.reply_send` handler in Phase 2.
32. [ ] Confirm actual send remains an Employee Messenger action.
33. [ ] Confirm Finance, Payroll, Credentials, private Mail and broad Drive are excluded.
34. [ ] Confirm no arbitrary business-domain writes are in scope.
35. [!] Approve exact memory/session/execution/source retention policies before production activation.
36. [!] Approve context/tool/output/provider timeout and retry limits before production activation.
37. [!] Approve pilot Projects/Products/Employees and cost ceilings.
38. [!] Approve multilingual quality thresholds and minimum pilot evidence.
39. [!] Freeze the operation-level AI capability + human RBAC/participation matrix before schema/API work.
40. [!] Decide customer-visible AI disclosure wording; internal provenance remains mandatory regardless.

# C. Module ownership and touched-module map

41. [ ] Produce the exact touched-module/file/schema/API/UI map.
42. [ ] Keep AI identity, execution, memory, knowledge and model routing owned by AI Platform.
43. [ ] Keep Project/Product business truth owned by Projects Hub.
44. [ ] Keep Contact/Company/Deal truth owned by Clients/CRM.
45. [ ] Keep Conversation/Message/Draft/send/delivery owned by Messenger.
46. [ ] Keep WhatsApp transport owned by External Channel Adapter/WhatsApp Gateway.
47. [ ] Keep files and source file authorization owned by Drive.
48. [ ] Keep native document content/permissions owned by Documents.
49. [ ] Keep Task/Work Space projections owned by Tasks.
50. [ ] Prohibit direct AI Prisma reads/writes to owning-module tables from orchestration adapters.
51. [ ] Define public application/projection ports for every cross-module dependency.
52. [ ] Add architecture tests preventing provider/Messenger/Gateway boundary bypass.

# D. Project AI Profile and scope model

53. [ ] Define `ProjectAiProfile` target schema and ownership.
54. [ ] Bind each profile to one Project and enforce at most one active profile per Project/deployment.
55. [ ] Bind one Internal Agent plus separate Project Rules; do not duplicate the agent-owned Prompt Policy.
56. [ ] Bind profile to one Project base Knowledge Space.
57. [ ] Support optional Product/surface overlays with deterministic uniqueness and fail-closed collision handling.
58. [ ] Store enabled surfaces, rollout state, escalation owner and additive Project budget-scope reference.
59. [ ] Store allowed source kinds and maximum classifications.
60. [ ] Default new profiles to disabled/draft.
61. [ ] Prevent profile activation when `Project.trashedAt` is set; Project has no separate lifecycle status.
62. [ ] Prevent Product overlay use outside its parent Project.
63. [ ] Resolve Product -> Project relationship server-side.
64. [ ] Resolve Work Space -> Product/Project relationship server-side for live context.
65. [ ] Validate assigned agent scopes cover the profile target.
66. [ ] Validate active model/prompt dependencies before profile activation.
67. [ ] Audit create/update/activate/pause/disable/profile assignment changes.
68. [ ] Add Project A/Product A vs Project A/Product B vs Project B isolation tests.

# E. Internal AI execution runtime

69. [ ] Define root Internal Agent execution plus Project Assistant session/turn contracts.
70. [ ] Require authenticated initiating Employee for employee/admin-test surfaces.
71. [ ] Build ActorContext with `INTERNAL_AI` actor and mandatory Employee `onBehalfOf`.
72. [ ] Resolve active Internal Agent and assigned surface.
73. [ ] Resolve published prompt/rules and Model Policy versions.
74. [ ] Resolve exact Project/Product/Conversation/Contact execution target.
75. [ ] Evaluate profile activation and feature flags before creating a provider call.
76. [ ] Persist root execution and applicable session/turn before background processing.
77. [ ] Add execution lifecycle supporting queued/running/succeeded/failed/cancelled/expired semantics.
78. [ ] Persist safe request purpose and target metadata, not raw secret-bearing payloads.
79. [ ] Persist exact agent/model/prompt/rules/profile versions used.
80. [ ] Preserve correlation and session/turn ordering through queue, model calls, tools, draft and audit.
81. [ ] Support cancellation before provider invocation.
82. [ ] Treat cancellation during provider call as best effort and discard late output safely.
83. [ ] Refuse new execution for paused/disabled/archived agents.
84. [ ] Refuse execution for a disabled Project profile or disabled exact Product overlay.
85. [ ] Revalidate actor, Employee, profile and target in the worker.
86. [ ] Revalidate grants/flags/target/source tombstones before each projection/tool and final result/memory/draft commit.
87. [ ] Bound total runtime and tool iterations with named configuration.
88. [ ] Validate all model structured outputs before any persistence or draft creation.
89. [ ] Never persist hidden chain-of-thought/reasoning traces.
90. [ ] Add lifecycle, session ordering/concurrency, cancellation, revocation and configuration-version tests.

# F. Provider generation and Model Policy routing

91. [ ] Add a provider-independent model invocation port.
92. [ ] Keep provider SDK/HTTP details and provider model ids behind OpenAI/Anthropic adapters.
93. [ ] Support normalized system/user/context messages.
94. [ ] Support declared structured-output schemas.
95. [ ] Support allowlisted tool definitions when a milestone enables tools.
96. [ ] Normalize provider timeout, cancellation, usage and error metadata.
97. [ ] Define/version per-connection classification/PII/purpose/retention/no-training/region data-policy evidence.
98. [ ] Resolve only ACTIVE connections/models/policies whose current data policy permits the execution.
99. [ ] Implement FIXED execution using the policy snapshot/version.
100.  [ ] Implement PRIMARY_FALLBACK ordered attempts.
101.  [ ] Fall back only for named transient/availability reasons and independently data-policy-eligible candidates.
102.  [ ] Never let an unavailable fallback hide a healthy primary.
103.  [ ] Stop fallback after a policy/output-safety failure that another model must not bypass.
104.  [ ] Enforce per-attempt and total execution timeout.
105.  [ ] Enforce input/output and provider request size limits.
106.  [ ] Record stable NBOS/provider model ids, attempt latency, usage and fallback reason.
107.  [ ] Redact provider request/response logging.
108.  [ ] Test malformed output, timeout, 429, 5xx, cancellation and all-provider failure.
109.  [ ] Live-test at least one approved provider in non-production.
110.  [ ] Require live cross-provider proof before enabling a cross-provider fallback profile in production.

# G. Durability, queue, idempotency and budgets

111. [ ] Define an AI execution BullMQ queue and worker registration for the worker process only.
112. [ ] Use deterministic job id derived from execution id.
113. [ ] Persist queued execution before enqueueing.
114. [ ] Add a reconciler for durable queued rows missing a queue job.
115. [ ] Make duplicate enqueue/worker retry converge on one execution/turn result.
116. [ ] Add worker claim/lease plus per-session turn ordering/concurrency protection.
117. [ ] Make terminal execution/turn immutable except safe operational annotations.
118. [ ] Record provider attempts separately enough to diagnose fallback/retry.
119. [ ] Record every capability/tool invocation with safe input/output digests.
120. [ ] Reauthorize resumed/deferred execution using current grants and Employee rights.
121. [ ] Ensure revocation between enqueue and run fails closed.
122. [ ] Ensure source revocation during execution prevents later source/tool use.
123. [ ] Add PROJECT budget scope/resolution additively and enforce it before each provider invocation.
124. [ ] Make hard-stop budget failure happen outside business-domain transactions.
125. [ ] Rate-limit by Employee, Internal Agent, Project and Conversation where applicable.
126. [ ] Prevent duplicate generation commands/jobs from creating duplicate executions/drafts.
127. [ ] Add worker-crash, queue-unavailable, duplicate-job and out-of-order tests.
128. [ ] Add operational metrics for queue depth, aged executions, retry/failure and reconciliation.

# H. Project and Product AI Rules

129. [ ] Reuse versioned Prompt Policy foundation for platform/agent instructions.
130. [ ] Define scoped Project rules and optional Product/channel overlays.
131. [ ] Support DRAFT/TESTING/PUBLISHED/RETIRED lifecycle.
132. [ ] Require explicit publish for production behavior.
133. [ ] Record immutable published version/digest.
134. [ ] Support safe rollback by publishing a new version from an older one.
135. [ ] Enforce precedence from platform safety down to untrusted user content.
136. [ ] Prevent Project/Product rules from granting capabilities/scopes.
137. [ ] Represent tone/language, disclosure, escalation and forbidden commitments structurally where useful.
138. [ ] Treat rules as internal controls, never customer facts/citations or text to disclose.
139. [ ] Validate rule/profile/agent compatibility before activation.
140. [ ] Preview/test draft rules without changing production assignment.
141. [ ] Audit draft/publish/retire/rollback/assignment changes without secret prompt bodies.
142. [ ] Attribute every execution to exact published versions.
143. [ ] Add precedence, unpublished-version and prompt-injection tests.

# I. Project Knowledge persistence and lifecycle

144. [ ] Define `AiKnowledgeSpace` with required Project and optional Product applicability.
145. [ ] Prevent a standalone/unscoped Knowledge Space in Phase 2.
146. [ ] Define source, source version and derived retrieval-record models.
147. [ ] Support manual curated source.
148. [ ] Support selected native Document safe-text source.
149. [ ] Support selected Drive source only through an approved extraction projection.
150. [ ] Store owning source type/id and never replace owning-module truth.
151. [ ] Store source version, digest, reviewed language, classification and customer visibility.
152. [ ] Store creator/publisher, created/updated/published/indexed timestamps.
153. [ ] Support DRAFT/IN_REVIEW/PUBLISHED/RETIRED/REVOKED/QUARANTINED/REMOVED_TOMBSTONE source lifecycle.
154. [ ] Support PENDING/INDEXING/READY/STALE/FAILED/TOMBSTONED index lifecycle.
155. [ ] Default new source to unpublished and `INTERNAL_ONLY`.
156. [ ] Require explicit `CUSTOMER_VISIBLE` approval for customer draft retrieval.
157. [ ] Treat Drive `Client Visible` as necessary source metadata, never automatic AI publication.
158. [ ] Reject Credentials, environment files, key/certificate files and secret exports.
159. [ ] Use `activeReadyVersionId`; atomically swap only after new version READY and preserve old provenance.
160. [ ] Make source revoke block retrieval synchronously.
161. [ ] Make source delete/revocation schedule derived-row cleanup safely.
162. [ ] Preserve tombstone/audit metadata required for diagnostics and retention.
163. [ ] Add uniqueness/index constraints for Project/Product/source/version identities.
164. [ ] Test concurrent publish, failed/quarantined v2 retaining v1, atomic swap, revoke and cross-scope lifecycle.

# J. Knowledge ingestion, indexing and retrieval

165. [ ] Validate/normalize Unicode and reviewed HY/RU/EN/OTHER language on every supported source.
166. [ ] Define supported Document/Drive MIME/content/size allowlists.
167. [ ] Reject unsupported source honestly rather than storing an empty READY index.
168. [ ] Treat extracted text and metadata as untrusted content.
169. [ ] Apply bounded parsing/extraction in worker infrastructure.
170. [ ] Prevent path traversal, arbitrary URL fetch and private-network SSRF.
171. [ ] Apply content-level secret/quarantine checks as defense in depth.
172. [ ] Never treat secret scanning as a substitute for source authorization.
173. [ ] Store deterministic content digest for dedupe/rebuild.
174. [ ] Build language-aware PostgreSQL FTS chunks/config selection with relational scope metadata and `simple` fallback.
175. [ ] Apply Project/Product/status/classification filters inside retrieval query.
176. [ ] Never retrieve broad top-k and filter unauthorized results only afterward.
177. [ ] Prefer Project base plus exact Product overlay; exclude sibling overlays.
178. [ ] Return source/version/citation/freshness with every result.
179. [ ] Re-check owning source access and lifecycle at retrieval time.
180. [ ] Exclude stale derived rows for revoked/retired/deleted source versions.
181. [ ] Support deterministic reindex on published source update.
182. [ ] Support failed-index retry without duplicate rows.
183. [ ] Record indexing error codes without leaking source content.
184. [ ] Add query/result/token/fragment bounds.
185. [ ] Add zero-result behavior that produces uncertainty, not invention.
186. [ ] Test source removal between search and assembly.
187. [ ] Benchmark scoped HY/RU/EN and mixed-language retrieval/zero-result behavior on representative data.
188. [ ] Prove no new vector/search service or extension is required for Phase 2 acceptance.

# K. Customer, Contact and Conversation identity boundary

189. [ ] Use tagged `CONTACT` with canonical `Contact.id` or non-personalized `CONVERSATION` subject.
190. [ ] Resolve Project/Product relationship before resolving customer memory.
191. [ ] Resolve exact external Conversation/provider mapping server-side.
192. [ ] Require persisted inbound message/provider identity, not raw untrusted webhook payload.
193. [ ] Define participant/provider-identity -> Contact mapping contract.
194. [ ] Treat confirmed-external but unmapped sender as conversation-only with `IDENTITY_UNRESOLVED` warning.
195. [ ] Forbid Contact memory read/write when identity is ambiguous.
196. [ ] Forbid personalized live projections when identity is ambiguous.
197. [ ] Keep same Contact memory separate across Projects.
198. [ ] Keep Contact memory optionally separate across Product/Conversation narrowing.
199. [ ] Prevent guessed Contact/Conversation/source ids from widening scope.
200. [ ] Handle Contact trash/deactivation according to Clients canon.
201. [ ] Define Contact merge behavior before adding memory foreign keys.
202. [ ] Remap/reconcile or quarantine conflicting memory during Contact merge.
203. [ ] Add employee/self/bot/unknown sender, group-private-memory, wrong group, cross-Project and merge tests.
204. [ ] Audit identity mapping/correction changes without provider secrets.

# L. Customer and conversation memory lifecycle

205. [ ] Define allowlisted initial memory categories from the Phase 2 architecture.
206. [ ] Define orthogonal verification state and lifecycle status persistence.
207. [ ] Require Project + tagged CONTACT/CONVERSATION subject scope on every record.
208. [ ] Require channel account/Conversation for CONVERSATION subject; support exact Product narrowing.
209. [ ] Store normalized typed payload rather than unbounded arbitrary text where practical.
210. [ ] Store provenance, source watermark, execution id, semantic key, digest and idempotency identity.
211. [ ] Store PROPOSED/VERIFIED/DISPUTED/REJECTED verification separately from audience/egress.
212. [ ] Store lifecycle, classification, INTERNAL_ONLY/CUSTOMER_VISIBLE audience, retention and expiry.
213. [ ] Support verification transitions PROPOSED -> VERIFIED/REJECTED and VERIFIED <-> DISPUTED resolution.
214. [ ] Support ACTIVE -> SUPERSEDED/EXPIRED/DELETED lifecycle; retrieve only ACTIVE + VERIFIED + eligible audience.
215. [ ] Produce candidates only from explicit Employee execution and require human review; no inbound background extraction.
216. [ ] Allow validated direct human entry; AUTHORIZED_COMMITMENT still requires eligible actor/domain provenance.
217. [ ] Make correction create a new/superseding record rather than silently rewriting history.
218. [ ] Move contradictory active memory to DISPUTED and require explicit resolution.
219. [ ] Exclude every Contact-private memory from group drafts; use conversation/group memory only.
220. [ ] Prevent every message from being duplicated into memory.
221. [ ] Reject secret-shaped and secret-classified payloads.
222. [ ] Keep canonical module fields authoritative over memory.
223. [ ] Expire/delete records from future retrieval immediately.
224. [ ] Provide inspection, verify/dispute/reject, correction, supersession, audience-change and delete services.
225. [ ] Audit lifecycle changes without storing unnecessary sensitive bodies.
226. [ ] Test extraction retry/dedupe/watermark, commitment rejection, audience, restart, dispute, expiry and isolation.
227. [ ] Add retention cleanup/reconciliation with dry-run/metrics before destructive deletion.

# M. Multi-source Context Plan and Context Assembler

228. [ ] Define server-only Context Plan contract.
229. [ ] Require one fresh authorization result per independent source/capability.
230. [ ] Bind every decision to Internal Agent, Employee, capability, exact scope and target.
231. [ ] Prevent browser/model supplied decisions or projections from being trusted.
232. [ ] Re-evaluate queued Context Plans rather than persisting reusable ALLOW authority.
233. [ ] Add purpose-built loader port for each owning module projection.
234. [ ] Keep truth/verification, data classification and INTERNAL_ONLY/CUSTOMER_VISIBLE egress as separate fields.
235. [ ] Reject SECRET and source-ineligible fragments before model invocation.
236. [ ] Exclude INTERNAL_ONLY fragments entirely from customer draft Context Plans.
237. [ ] Treat memory, knowledge, messages, documents, files and model outputs as untrusted.
238. [ ] Apply field allowlists and recursive secret-shaped-field rejection/redaction.
239. [ ] Apply freshness rules per source rather than one global age.
240. [ ] Apply deterministic source/record/character/token budgets.
241. [ ] Preserve required platform/rules context before lower-priority content when truncating.
242. [ ] Record omitted source id/type/reason safely.
243. [ ] Preserve citation, source version, retrieval time and access basis.
244. [ ] Use fact-type-aware authority; rules are not facts and newer customer conflict creates dispute/uncertainty.
245. [ ] Surface missing/stale required context to response policy.
246. [ ] Prevent prompt text from changing source selection or capability set.
247. [ ] Add mixed-capability, revoke-during-build, truncation and injection tests.

# N. Live module projections and freshness

248. [ ] Define exact first release projection catalog before implementation.
249. [ ] Add Projects-owned customer-safe Project summary projection.
250. [ ] Add Projects-owned customer-safe Product/delivery summary projection.
251. [ ] Add Tasks-owned approved Work Space/task aggregate or selected-task projection.
252. [ ] Exclude private task comments/blockers/internal titles from customer context by default.
253. [ ] Add Clients-owned Contact/Company communication profile projection.
254. [ ] Add CRM-owned selected linked Deal context only when relationship is exact.
255. [ ] Add Messenger-owned exact conversation mapping and bounded recent-message projection.
256. [ ] Add Documents/Drive-owned published-source text/citation projections.
257. [ ] Register/freeze capability key/version/scope resolver for root, knowledge, memory, draft and every projection.
258. [ ] Define allowed scope types, field allowlists and max classification for each.
259. [ ] Intersect Internal Agent grant with initiating Employee module/record access.
260. [ ] Validate resource relationship server-side before returning projection.
261. [ ] Return sourceUpdatedAt/retrievedAt/max-age metadata.
262. [ ] Return honest unavailable/not-authorized/not-linked states.
263. [ ] Prevent record existence leakage through detailed unauthorized errors.
264. [ ] Keep operational state live; do not copy it into Knowledge/Memory as truth.
265. [ ] Add module service tests for allowed fields and forbidden fields.
266. [ ] Add cross-Project/Product/Contact/Conversation negative integration tests.
267. [ ] Add stale memory/knowledge vs newer live-state precedence test.
268. [ ] Add owning-module regression tests for normal human API behavior.
269. [ ] Document every shipped projection in the owning module canon.
270. [ ] Defer Finance/Mail/Credentials projections explicitly.

# O. Response generation, grounding, citations and escalation

271. [ ] Define structured assistant response schema.
272. [ ] Separate answer/draft text, citations, uncertainty, omissions and escalation metadata.
273. [ ] Require source ids/claims to refer only to the supplied Context Plan manifest.
274. [ ] Reject hallucinated/fabricated citation identifiers.
275. [ ] Validate output size, encoding and safe Markdown.
276. [ ] Sanitize rendered output; prohibit unsafe raw HTML/scripts/links.
277. [ ] Prevent model output from directly invoking domain services.
278. [ ] Treat proposed tool calls as untrusted requests requiring validation and policy.
279. [ ] Escalate when required live data is missing/stale/conflicting.
280. [ ] Escalate pricing, refund, legal, security, identity and contractual commitments.
281. [ ] Refuse claims of successful identity verification without module evidence.
282. [ ] Produce no definitive operational answer when authoritative source is unavailable.
283. [ ] Preserve agent/model/prompt/rules/context manifest attribution.
284. [ ] Commit idempotent memory candidates only after output validation and final current authorization recheck.
285. [ ] Ensure fallback models receive the same authorized context/tool ceiling.
286. [ ] Add prompt-injection cases in message, memory, knowledge, document and file content.
287. [ ] Add unsupported-question and insufficient-context behavior tests.
288. [ ] Add citation correctness and stale-source golden tests.
289. [ ] Add HY/RU/EN evaluation cases according to approved pilot policy.
290. [ ] Never use a model-based grader as sole high-risk acceptance evidence.

# P. Employee Project Assistant API and UX

291. [ ] Define employee-authenticated Project Assistant session/create-turn REST contract.
292. [ ] Require exact Project and optional Product target at session creation.
293. [ ] Reauthorize Employee target and cited-source access on every session/result list/read/create/cancel request.
294. [ ] Prevent one Employee from reading another's private assistant session by id guessing.
295. [ ] Suppress/redact historical result body after target/source revoke/delete while retaining digest-only audit evidence.
296. [ ] Provide safe cancellation.
297. [ ] Provide optional Socket.io status completion without making Socket source of truth.
298. [ ] Keep token streaming optional/non-blocking for Phase 2 exit.
299. [ ] Render answer, citations, freshness, omitted/truncated and error state.
300. [ ] Provide explicit Project/Product context indicator and switching guard.
301. [ ] Warn before leaving context when a draft/session has unsaved state.
302. [ ] Provide empty, loading, queued, running, cancelled, failed and partial states.
303. [ ] Provide feedback/escalation signals without silently changing model policy.
304. [ ] Respect global/project/agent kill switches immediately.
305. [ ] Hide/disable unavailable AI without breaking normal Project/Product UI.
306. [ ] Add responsive/accessibility/component tests for critical states.
307. [ ] Add browser E2E for grounded question, denial, cancellation and feature-off behavior.

# Q. Messenger/WhatsApp read and `DRAFT_ONLY` integration

308. [ ] Require canonical channel account + external Conversation/Message/provider identity before integration.
309. [ ] Require exact channel account + Conversation -> Product -> Project relationship.
310. [ ] Require exact sender participant and explicit participant -> Contact mapping for personalized context.
311. [ ] Authenticate/rotate Gateway credentials, bind channel account, reject replay/forgery and persist normalized event idempotently.
312. [ ] Require explicit Employee generation over confirmed external inbound text; employee/self/bot/system/outbound is ineligible.
313. [ ] Define Messenger-owned external Draft aggregate, immutable revisions and service.
314. [ ] Keep draft separate from outbound Message/Delivery until Employee send.
315. [ ] Require `messenger.reply_draft` capability and exact RESOURCE scope.
316. [ ] Intersect draft capability with Employee conversation read/send eligibility.
317. [ ] Generate draft only from `CUSTOMER_VISIBLE` Context Plan.
318. [ ] Link draft to Internal Agent, execution and source manifest.
319. [ ] Store draft body digest and AI-generation provenance.
320. [ ] Preserve AI provenance after Employee edit and create a new current draft revision.
321. [ ] Make duplicate request/worker retry return the same draft.
322. [ ] Mark draft stale on inbound/human/target/source/rules/profile change or max age; stale send is blocked until new revision.
323. [ ] Ensure generation never sends; only an authorized Employee Messenger command may select current revision.
324. [ ] Atomically create one idempotent outbound operation + outbox with Employee actor and AI-assistance attribution.
325. [ ] Keep Gateway/WAHA behind Messenger; ambiguous post-submit timeout becomes `OUTCOME_UNKNOWN`, never blind retry.
326. [ ] Test webhook auth/replay/rotation, duplicate generation/send, all stale causes, takeover, isolation and outcome-unknown.

# R. Administration, Project, Product and memory UX

327. [ ] Extend central AI & Agents overview with Phase 2 runtime readiness.
328. [ ] Add provider invocation health without revealing keys.
329. [ ] Add Internal Agent execution configuration and kill-switch state.
330. [ ] Add Project AI Profile list/detail/status.
331. [ ] Add Project base Knowledge and Product overlay management.
332. [ ] Add rules draft/test/publish/retire/rollback UI.
333. [ ] Add source classification/publish/index/revoke/retry UI.
334. [ ] Add exact effective-access and dependency/readiness summary.
335. [ ] Add admin test console using real production authorization semantics.
336. [ ] Add budget/usage/evaluation/activity diagnostics.
337. [ ] Add Project/Product contextual AI settings projection.
338. [ ] Add Contact/Conversation scoped memory list and candidate queue.
339. [ ] Add memory inspect/correct/reject/supersede/delete controls by permission.
340. [ ] Show provenance, status, scope, freshness and retention on each memory item.
341. [ ] Never show one cross-Project global Contact memory view.
342. [ ] Add high-impact confirmations for publish/revoke/disable/delete operations.
343. [ ] Show dependencies before disabling a used source/profile/agent/policy.
344. [ ] Ensure saved provider secrets/prompt-sensitive data never appear in UI payloads.
345. [ ] Add API authorization and browser regression tests for all admin/contextual surfaces.

# S. Audit, usage, cost, budgets and evaluation

346. [ ] Extend audit entity/action catalog for profile/knowledge/memory/execution/draft lifecycle.
347. [ ] Record Internal Agent actor and Employee on-behalf-of separately.
348. [ ] Record exact target/capability/channel/surface/correlation/result.
349. [ ] Record configuration/source ids/digests, not secret/full context bodies.
350. [ ] Extend usage records for every provider attempt and final route outcome.
351. [ ] Track input/output/cached/reasoning units when provider reports them.
352. [ ] Track historical cost using pricing version/effective date.
353. [ ] Track queue time, model latency, tool latency, fallback, failure and cancellation.
354. [ ] Track answer accepted/edited/escalated and draft edit/send outcomes where permitted.
355. [ ] Enforce configured Project/Internal Agent/provider budgets.
356. [ ] Alert on cost spikes, high failure/fallback, aged queue and repeated denials.
357. [ ] Create versioned Project Intelligence evaluation suite/dataset.
358. [ ] Include factual, citation, isolation, injection, refusal and multilingual cases.
359. [ ] Separate deterministic, human and model-based grading.
360. [ ] Record model/policy/prompt/rules/dataset versions for evaluation runs.
361. [ ] Define approved quality/safety/cost/latency activation thresholds.
362. [ ] Prevent automatic model/prompt/profile promotion from evaluation results.
363. [ ] Add admin dashboards that use safe metadata only.
364. [ ] Add audit/log secret and PII leakage tests.

# T. Security and privacy hardening

365. [ ] Threat-model employee, customer, malicious source, provider and compromised-agent paths.
366. [ ] Prove Project/Product/Contact/Conversation object-level authorization.
367. [ ] Prove initiating Employee rights always intersect agent grants.
368. [ ] Prove admin test mode has no hidden bypass.
369. [ ] Prove revoked/expired agent/grant/scope/profile/source fails closed.
370. [ ] Prove prompt injection cannot alter capabilities, targets, classification or approval/send mode.
371. [ ] Prove customer draft sees no INTERNAL_ONLY/SENSITIVE-forbidden/SECRET fragments.
372. [ ] Prove Credentials/provider tokens/agent tokens are unreachable.
373. [ ] Prove source id guessing and retrieval timing do not reveal unauthorized records materially.
374. [ ] Validate file type by content and bound extraction size/time.
375. [ ] Prevent SSRF, path traversal, archive bombs and active-content execution.
376. [ ] Sanitize Markdown/links and apply safe browser headers/CSP behavior.
377. [ ] Redact authorization, secrets, full prompts/contexts and unnecessary PII from logs.
378. [ ] Apply rate limits and concurrency limits before expensive model/Argon work.
379. [ ] Prevent memory poisoning through unreviewed model candidates.
380. [ ] Prevent stale index access after revoke/delete.
381. [ ] Prevent duplicate/replay/loop-induced drafts and provider spend.
382. [ ] Validate retention, export/correction/delete and Contact merge behavior.
383. [ ] Run the repository security-review workflow and record evidence/findings.
384. [ ] Require independent security verifier PASS before rollout milestone.

# U. Migration, compatibility, flags and rollback

385. [ ] Use additive expand-and-contract Prisma/SQL migrations.
386. [ ] Preserve all Phase 1 AI/audit/provider/execution rows.
387. [ ] Avoid required backfill for new disabled-by-default profile/knowledge/memory tables.
388. [ ] Add foreign keys/indexes/partial uniqueness with migration-safe ordering.
389. [ ] Keep Contact merge migration/service transactionally consistent with memory references.
390. [ ] Validate migrations from representative pre-Phase-2 schema/data.
391. [ ] Validate Prisma schema/client generation.
392. [ ] Separate dev-migrated, staging-migrated and production-migrated status in docs.
393. [ ] Do not apply production migrations during implementation chats.
394. [ ] Add global/runtime/provider-route/projection/project/product/agent/channel/conversation/knowledge/memory/draft switches.
395. [ ] Default all Phase 2 profiles/sources/features to disabled/unpublished.
396. [ ] Make API/worker/scheduler/web mixed-version behavior safe.
397. [ ] Deploy migrations before new writers/readers.
398. [ ] Keep old code safe when new tables exist but features are disabled.
399. [ ] Define forward-fix rollback; do not immediately drop new data/tables.
400. [ ] Add queue/index/memory cleanup dry-run and operator metrics.
401. [ ] Document environment/config additions without secrets.
402. [ ] Add readiness/health behavior for provider/queue dependencies.

# V. Regression, performance and abuse validation

403. [ ] Run targeted AI Platform unit/integration tests per milestone.
404. [ ] Run real-DB tests for constraints, concurrency, lifecycle and isolation.
405. [ ] Run HTTP tests for Employee/admin authorization and object access.
406. [ ] Run worker tests for retry/cancel/reconcile/revocation.
407. [ ] Run browser tests for Project Assistant/admin/memory/draft critical flows.
408. [ ] Re-run External Agent REST/MCP parity and live smoke in non-production.
409. [ ] Re-run human Tasks/Drive/Projects/CRM/Messenger regressions.
410. [ ] Re-run AI Admin provider/model/prompt/approval/usage regressions.
411. [ ] Test large context/source/conversation bounds and deterministic truncation.
412. [ ] Test concurrent identical/different executions and draft generation.
413. [ ] Test cost-abuse, spam and repeated injection probes within safe non-production limits.
414. [ ] Benchmark scoped FTS retrieval and context assembly.
415. [ ] Verify DB query plans/index usage for Project/Product/customer filters.
416. [ ] Verify queue concurrency does not exhaust DB/provider limits.
417. [ ] Run lint, typecheck and affected/full production builds.
418. [ ] Run full test/regression suites before final acceptance.

# W. Documentation synchronization

419. [ ] Keep architecture `42`, checklist `43`, strategy `44` and acceptance `45` aligned.
420. [ ] Update active AI canon for only behavior actually implemented.
421. [ ] Update Projects/Product canon for profile/rules/contextual UX.
422. [ ] Update Clients/Contact canon for memory and Contact merge behavior.
423. [ ] Update Messenger/WhatsApp canon for external mapping/draft ownership actually implemented.
424. [ ] Update Drive/Documents canon for shipped knowledge source projections.
425. [ ] Update technical decisions and implementation roadmap.
426. [ ] Update AI operations runbooks and cleanup register.
427. [ ] Keep future capability `PLANNED/IN_IMPLEMENTATION` until final acceptance.
428. [ ] Record every migration/API/event/feature flag/config/runbook introduced.
429. [ ] Record unimplemented/non-goal behavior explicitly.
430. [ ] Prepare exact future-capability canonization destinations; only Chat 12 may mark it DONE.

# X. Final Phase 2 acceptance

431. [ ] Re-walk every checklist item first-hand.
432. [ ] Confirm Product Entry Gate final acceptance remains valid.
433. [ ] Confirm no required product/security/privacy item remains `[~]` or `[!]`.
434. [ ] Confirm every milestone received independent verification.
435. [ ] Live-invoke an approved provider/model through a real Internal Agent in non-production.
436. [ ] Demonstrate grounded Project base + exact Product overlay answer with citations.
437. [ ] Demonstrate Project/Product/Contact/Conversation adversarial isolation.
438. [ ] Demonstrate persistent memory review/correction/expiry/delete across restart.
439. [ ] Demonstrate live owning-module state wins over stale memory/knowledge.
440. [ ] Demonstrate source revoke/delete blocks retrieval immediately.
441. [ ] Demonstrate queued/resumed execution fails after access revocation.
442. [ ] Demonstrate customer draft uses only customer-visible exact-scope context.
443. [ ] Demonstrate generated draft never sends automatically.
444. [ ] Demonstrate prompt injection cannot widen source/tool/action access.
445. [ ] Demonstrate provider failure/fallback/total failure and cancellation safely.
446. [ ] Demonstrate usage/cost/audit attribution without secret/full sensitive payload leakage.
447. [ ] Validate migrations on representative non-production data and record evidence.
448. [ ] Run full test, regression, lint, typecheck, builds and critical browser/API/worker flows.
449. [ ] Verify every global/runtime/provider/projection/project/product/agent/channel/conversation kill switch at commit boundary.
450. [ ] Create `57-Phase-2-Final-Acceptance.md`; only on passing verdict mark future capability DONE with destinations.

## Exit rule

Only the final independent acceptance milestone may declare Phase 2 complete. Production migration,
provider credential changes, feature activation, pilot enrollment and any future AI-send/auto-send
remain separately authorized operator/product decisions.
