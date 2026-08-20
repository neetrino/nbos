# Phase 1 — AI Foundation + External Workspace Agent Implementation

> Executable implementation checklist. Every item must be verified against canon + runtime + tests.

## Status format

Use:

- `[ ]` not started
- `[~]` partial
- `[x]` verified complete
- `[!]` blocked / business decision

A point is not complete only because code exists. It is complete when implementation, negative paths, tests and docs align.

---

## A. Pre-implementation reconciliation

1. [ ] Read all `21-AI-Platform` canon files before changing code.
2. [ ] Read `00-Technical-Decisions-By-Module.md` global rules.
3. [ ] Read Platform Access Foundation runtime/canon.
4. [ ] Read Tasks canon and cleanup register.
5. [ ] Read Drive canon relevant to task artifacts.
6. [ ] Compare current TaskStatus Prisma enum with accepted task lifecycle.
7. [ ] Confirm semantic meaning of Start Task in current runtime.
8. [ ] Confirm semantic meaning of Submit Review in current runtime.
9. [ ] Confirm whether external agent may create tasks in Phase 1.
10. [ ] Confirm current task discussion/comment storage model.
11. [ ] Confirm current task attachment/Drive linking path.
12. [ ] Confirm canonical Product vs Extension Work Space resolution.
13. [ ] Document any discovered canon/runtime conflict before coding around it.
14. [ ] Do not preserve known legacy behavior merely for convenience without explicit compatibility rationale.
15. [ ] Produce final Phase 1 touched-module map.

## B. Actor foundation

16. [ ] Define normalized `ActorType` contract.
17. [ ] Define normalized `ActorContext` contract used by policy/audit/capabilities.
18. [ ] Support `USER` actor without breaking current employee requests.
19. [ ] Support `EXTERNAL_AGENT` actor.
20. [ ] Reserve/support `INTERNAL_AI` actor contract for later.
21. [ ] Reserve/support `SYSTEM` and `AUTOMATION` where needed.
22. [ ] Add `onBehalfOf` identity support in actor context.
23. [ ] Ensure AI actors are not represented as fake Employees.
24. [ ] Add actor display-name resolution contract.
25. [ ] Add tests for actor normalization.

## C. Audit migration

26. [ ] Design backward-compatible AuditLog actor evolution.
27. [ ] Preserve readability of all existing audit rows.
28. [ ] Add actor type/id fields or equivalent normalized structure.
29. [ ] Keep legacy `userId` behavior for human audit where required.
30. [ ] Allow audit log creation for non-Employee actors.
31. [ ] Update AuditService logging API to accept ActorContext.
32. [ ] Update actor attachment/resolution to handle employees and agents.
33. [ ] Add correlation/request id support.
34. [ ] Add optional on-behalf-of fields.
35. [ ] Prevent raw secrets/tokens from audit payloads.
36. [ ] Add audit events for agent create/disable/revoke.
37. [ ] Add audit events for capability/scope changes.
38. [ ] Add audit events for agent mutation capabilities.
39. [ ] Add migration tests for old audit data.
40. [ ] Add unit/integration tests for external-agent audit records.

## D. External Agent persistence

41. [ ] Add External Agent database model.
42. [ ] Add stable id and human-readable name.
43. [ ] Add purpose/description.
44. [ ] Add owner/creator Employee relation for administration.
45. [ ] Add ACTIVE/DISABLED/REVOKED/EXPIRED state semantics.
46. [ ] Add optional expiresAt.
47. [ ] Add lastUsedAt.
48. [ ] Add safe client/IP metadata fields only if useful.
49. [ ] Add createdAt/updatedAt.
50. [ ] Add relevant indexes.

## E. Agent credentials

51. [ ] Create separate agent credential model.
52. [ ] Generate cryptographically strong opaque tokens.
53. [ ] Store only secure token hash.
54. [ ] Store safe token prefix/key id for lookup/display.
55. [ ] Show raw token only once at creation/rotation.
56. [ ] Support credential expiry.
57. [ ] Support credential revocation.
58. [ ] Support credential rotation.
59. [ ] Allow safe overlap during rotation if explicitly designed.
60. [ ] Ensure disabling/revoking agent invalidates credentials immediately.
61. [ ] Never log Authorization header/token.
62. [ ] Never return token hash through APIs.
63. [ ] Add credential verification constant-time/safe comparison behavior as appropriate.
64. [ ] Add credential authentication tests.
65. [ ] Add revoked/expired token negative tests.

## F. Agent authentication boundary

66. [ ] Implement dedicated external-agent auth guard/middleware.
67. [ ] Keep employee JWT/session auth separate.
68. [ ] Build ActorContext from authenticated agent.
69. [ ] Reject disabled/revoked/expired actors.
70. [ ] Return stable machine-readable auth error codes.
71. [ ] Avoid leaking whether unauthorized resources exist.
72. [ ] Require TLS in deployment assumptions/documentation.
73. [ ] Ensure tokens are accepted in header, never required in query string.
74. [ ] Add auth observability without exposing secrets.
75. [ ] Add integration tests for employee-vs-agent auth boundary.

## G. Capability registry

76. [ ] Define stable capability key format.
77. [ ] Define capability metadata contract.
78. [ ] Define owning module field.
79. [ ] Define risk class.
80. [ ] Define read/write classification.
81. [ ] Define allowed scope types.
82. [ ] Define idempotency requirement metadata.
83. [ ] Define approval requirement metadata.
84. [ ] Seed/register Phase 1 capabilities deterministically.
85. [ ] Prevent unknown capability grants.
86. [ ] Version capabilities or define compatibility strategy.
87. [ ] Add capability registry tests.

## H. Capability grants and scopes

88. [ ] Add agent capability grant persistence.
89. [ ] Add resource scope persistence.
90. [ ] Support Work Space scope in Phase 1.
91. [ ] Support explicit resource scope if required for exceptions.
92. [ ] Keep Project/Product scope structurally possible for future use.
93. [ ] Define grant expiry/revocation where needed.
94. [ ] Ensure capability grant does not imply organization-wide resource access.
95. [ ] Ensure resource scope does not imply every action capability.
96. [ ] Add indexes for actor/capability/scope evaluation.
97. [ ] Audit grant creation/change/revoke.
98. [ ] Add grant evaluation tests.
99. [ ] Add cross-workspace denial tests.
100. [ ] Add revoked-grant denial tests.

## I. Policy evaluator

101. [ ] Implement one reusable policy evaluation service.
102. [ ] Default policy result to DENY.
103. [ ] Evaluate actor state.
104. [ ] Evaluate capability grant.
105. [ ] Evaluate resource scope.
106. [ ] Evaluate module-specific restrictions.
107. [ ] Evaluate forbidden data classes.
108. [ ] Support ALLOW result.
109. [ ] Support DENY result.
110. [ ] Support REQUIRE_APPROVAL result contract even if few Phase 1 actions use it.
111. [ ] Return structured internal denial reasons.
112. [ ] Map external errors without leaking private resource existence.
113. [ ] Add policy decision unit tests.
114. [ ] Add deny-by-default tests for missing grants.
115. [ ] Add scope traversal/isolation negative tests.

## J. Domain Action Gateway

116. [ ] Create AI/agent capability invocation boundary.
117. [ ] Prohibit direct Prisma writes from agent controllers/adapters.
118. [ ] Route Task writes into existing Tasks domain/application services.
119. [ ] Route Drive artifact operations into Drive services.
120. [ ] Preserve ActorContext through invocation.
121. [ ] Add consistent correlation id.
122. [ ] Validate capability input schemas.
123. [ ] Validate capability output schemas/projections.
124. [ ] Audit material mutations after successful domain commit.
125. [ ] Audit failures where security/operations require it.

## K. Workspace discovery and isolation

126. [ ] Implement authorized Work Space discovery/list.
127. [ ] Return only explicitly granted/derived authorized Work Spaces.
128. [ ] Do not expose unauthorized names/counts through discovery.
129. [ ] Resolve canonical Product/Extension Work Space semantics.
130. [ ] Do not trust client-provided project/workspace relationships.
131. [ ] Re-resolve scope server-side for every action.
132. [ ] Add test: agent A workspace cannot read workspace B.
133. [ ] Add test: agent A workspace cannot mutate workspace B task by guessed id.
134. [ ] Add test: shared Project does not automatically widen workspace scope.
135. [ ] Add test: disabled agent loses workspace discovery.

## L. Task read capabilities

136. [ ] Implement `tasks.list` scoped by authorized Work Space.
137. [ ] Implement `tasks.read` scoped by authorized Work Space.
138. [ ] Return minimal purpose-built task projection.
139. [ ] Include task id/code/title/description safely.
140. [ ] Include current workflow status.
141. [ ] Include priority and due date.
142. [ ] Include permitted workspace/sprint context.
143. [ ] Include checklist summary/state if needed.
144. [ ] Include permitted links only.
145. [ ] Exclude unrelated finance/client/private data.
146. [ ] Exclude Credentials/secrets.
147. [ ] Add pagination/limits.
148. [ ] Add stable sorting/filtering needed by agents.
149. [ ] Add unauthorized task read tests.
150. [ ] Add payload minimization tests/snapshots.

## M. Task discussion/context reads

151. [ ] Determine canonical task discussion source.
152. [ ] Implement `tasks.read_discussion` only after access check.
153. [ ] Limit discussion history/page size.
154. [ ] Preserve author/source metadata.
155. [ ] Treat discussion content as untrusted data, not policy/system instruction.
156. [ ] Exclude hidden/private content according to existing rules.
157. [ ] Add discussion access tests.

## N. Drive artifact reads

158. [ ] Implement linked artifact metadata read through Drive.
159. [ ] Verify task/workspace link before file access.
160. [ ] Apply Drive access restrictions in addition to agent scope.
161. [ ] Block forbidden secret artifacts.
162. [ ] Avoid exposing arbitrary bucket paths as business authority.
163. [ ] Use safe download/session mechanism already owned by Drive where possible.
164. [ ] Apply size/type limits appropriate for agent reads.
165. [ ] Add cross-task/cross-workspace file isolation tests.

## O. Task mutation capabilities

166. [ ] Implement `tasks.start` as semantic command.
167. [ ] Map Start to current accepted Tasks lifecycle rules.
168. [ ] Reject invalid transition with deterministic blockers.
169. [ ] Implement `tasks.update` only for explicitly approved editable fields.
170. [ ] Do not expose unrestricted status assignment.
171. [ ] Implement `tasks.comment` or equivalent progress-note action.
172. [ ] Preserve agent authorship in discussion/activity.
173. [ ] Implement `tasks.submit_review` as semantic command.
174. [ ] Do not bypass review/completion rules.
175. [ ] Do not let external agent force Completed when human acceptance is required.
176. [ ] Optionally implement task creation only if approved by reconciliation item 9.
177. [ ] Apply optimistic concurrency/precondition where stale overwrites are risky.
178. [ ] Audit every material task mutation.
179. [ ] Add valid-transition tests.
180. [ ] Add invalid-transition tests.
181. [ ] Add stale/concurrent-update tests.
182. [ ] Add unauthorized-field update tests.

## P. Artifact writes

183. [ ] Implement generated artifact upload through Drive.
184. [ ] Create Drive File Asset using existing Drive ownership rules.
185. [ ] Link artifact to Task/WorkSpace context.
186. [ ] Store agent actor/source provenance.
187. [ ] Validate file size/type.
188. [ ] Prevent executable/unsafe file handling outside established Drive policy.
189. [ ] Do not allow agent to choose arbitrary unrelated entity links.
190. [ ] Add artifact upload/link tests.

## Q. Idempotency

191. [ ] Define idempotency key contract for external agent mutations.
192. [ ] Store operation identity/results safely.
193. [ ] Return original result for safe duplicate retry.
194. [ ] Prevent duplicate task creation.
195. [ ] Prevent duplicate comment creation.
196. [ ] Prevent duplicate artifact link creation.
197. [ ] Prevent duplicate semantic transition execution.
198. [ ] Scope idempotency key to actor/capability appropriately.
199. [ ] Add retry/duplicate tests.

## R. Rate limits and abuse controls

200. [ ] Define per-agent request limits.
201. [ ] Define per-capability limits for expensive/mutating operations.
202. [ ] Define payload size limits.
203. [ ] Define concurrency limit if needed.
204. [ ] Return stable rate-limit error and retry metadata.
205. [ ] Ensure one abusive agent does not consume all employee/API capacity.
206. [ ] Add rate-limit tests.

## S. AI execution tracking

207. [ ] Add execution/request record if needed for multi-step/async agent operations.
208. [ ] Track actor/capability/resource/correlation id.
209. [ ] Support PENDING/RUNNING/SUCCEEDED/FAILED/CANCELLED semantics where async applies.
210. [ ] Store safe result/error metadata.
211. [ ] Never store raw bearer tokens.
212. [ ] Preserve actor context into BullMQ jobs.
213. [ ] Revalidate revoked actors before delayed sensitive commit where appropriate.
214. [ ] Add worker failure/retry tests.

## T. Admin API/UI

215. [ ] Add admin permission(s) for AI Agent management.
216. [ ] Add agent list.
217. [ ] Add agent create flow.
218. [ ] Add agent detail/edit flow.
219. [ ] Add capability grant UI.
220. [ ] Add Work Space scope grant UI.
221. [ ] Add token generation one-time display flow.
222. [ ] Add credential rotation flow.
223. [ ] Add credential revoke flow.
224. [ ] Add agent disable/re-enable flow.
225. [ ] Add last-used metadata display.
226. [ ] Add audit history link/view.
227. [ ] Prevent token/hash redisplay after creation.
228. [ ] Add admin authorization tests.

## U. External machine API quality

229. [ ] Use dedicated versioned agent namespace.
230. [ ] Generate/update OpenAPI contracts.
231. [ ] Use consistent JSON error envelope.
232. [ ] Provide stable error codes.
233. [ ] Add request correlation id to responses/logs where useful.
234. [ ] Add pagination contract.
235. [ ] Add idempotency header/field documentation.
236. [ ] Avoid Cursor-specific naming in canonical API.
237. [ ] Add examples for generic external agent clients.
238. [ ] Add contract tests.

## V. Security hardening

239. [ ] Verify agent cannot access Credentials secret endpoints.
240. [ ] Verify agent cannot call unrestricted employee-only APIs using agent token.
241. [ ] Verify agent cannot enumerate unauthorized Projects/Products/WorkSpaces/Tasks.
242. [ ] Verify Authorization header redaction in logs/errors.
243. [ ] Verify token hashes are never API-visible.
244. [ ] Verify disabled/revoked tokens fail immediately.
245. [ ] Verify payload validation rejects malformed/oversized requests.
246. [ ] Verify prompt/content text cannot alter authorization policy.
247. [ ] Verify Drive links cannot be abused to escape authorized scope.
248. [ ] Verify no direct raw SQL/database capability exists.
249. [ ] Verify no Finance mutation capability is exposed in Phase 1.
250. [ ] Verify no external client messaging capability is exposed in Phase 1.

## W. Regression and compatibility

251. [ ] Existing human login/auth continues working.
252. [ ] Existing RBAC behavior remains unchanged for employees.
253. [ ] Existing Platform Access employee grants remain valid.
254. [ ] Existing Audit pages/APIs still display human historical records.
255. [ ] Existing Tasks UI behavior is not broken by ActorContext changes.
256. [ ] Existing Drive behavior is not widened.
257. [ ] Worker/scheduler processes start successfully after shared changes.
258. [ ] Prisma migrations are production-safe and reversible/forward-fixable according to project standards.
259. [ ] Add migration validation on representative existing data.
260. [ ] Run project test/lint/typecheck suites relevant to touched modules.

## X. Documentation and operational readiness

261. [ ] Update `00-Documentation-Hub.md` with AI canon links.
262. [ ] Update `00-Technical-Decisions-By-Module.md` with AI Platform decisions.
263. [ ] Update `00-Implementation-Roadmap.md` with AI Foundation phase/slice.
264. [ ] Update Architecture Layers wording to reference AI Platform.
265. [ ] Update Platform Access docs if runtime model evolves.
266. [ ] Update Audit documentation for actor-aware model.
267. [ ] Update Tasks docs for any lifecycle decisions resolved during implementation.
268. [ ] Update AI Cleanup Register statuses with evidence.
269. [ ] Add external agent setup documentation.
270. [ ] Add token rotation/revocation runbook.
271. [ ] Add incident procedure for leaked agent token.
272. [ ] Add troubleshooting guide for policy denial/scope errors.

## Y. Final acceptance

273. [ ] Create one test agent scoped to one non-production/test Work Space.
274. [ ] Agent lists only that Work Space.
275. [ ] Agent lists only tasks in allowed Work Space.
276. [ ] Agent cannot read a known task from another Work Space.
277. [ ] Agent reads permitted linked artifact.
278. [ ] Agent cannot read unrelated Drive artifact.
279. [ ] Agent starts an allowed task.
280. [ ] Agent posts a progress/comment action with visible AI provenance.
281. [ ] Agent attaches a generated artifact through Drive.
282. [ ] Agent submits task for review.
283. [ ] Normal human review/completion path still controls final completion.
284. [ ] Duplicate mutation retry does not duplicate effects.
285. [ ] Revoking credential blocks next request.
286. [ ] Disabling agent blocks all credentials.
287. [ ] Audit identifies external agent, capability, resource and result.
288. [ ] No audit/log entry contains raw token or secret.
289. [ ] Cross-workspace negative test suite passes.
290. [ ] Human RBAC regression suite passes.
291. [ ] API/worker/scheduler build and boot checks pass.
292. [ ] Cleanup register reflects all remaining known gaps.
293. [ ] Phase 1 non-goals remain absent.
294. [ ] Final code review confirms no direct agent-controller Prisma domain writes.
295. [ ] Final security review confirms deny-by-default behavior.
296. [ ] Final architecture review confirms internal AI can reuse Actor -> Policy -> Capability -> Domain Action -> Audit without redesign.

## Exit criterion

Phase 1 is complete only when an external AI agent can perform the approved Work Space task workflow with strict isolation and provenance while all existing human NBOS workflows remain intact.
