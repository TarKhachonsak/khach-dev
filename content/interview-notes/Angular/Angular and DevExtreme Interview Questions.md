# Angular and DevExtreme Interview Questions

## 1. Angular object reference through Input

**English Question:** When an Angular child component mutates an object received via `@Input()`, why can the parent observe the changed value without an `@Output()` event?

**English Answer:** Because JavaScript objects are passed by reference. The parent and child both reference the same object, so mutating a property changes the shared object.

**Thai Explanation:** `@Input()` ไม่ได้ clone object ถ้า child แก้ property ของ object เดิม parent จะเห็นค่าที่เปลี่ยนด้วย

## 2. DevExtreme callback context

**English Question:** Why can `this` become undefined in a DevExtreme callback inside an Angular component, and how can you fix it?

**English Answer:** DevExtreme invokes callbacks with its own context. A regular method has dynamic `this`, so it may not point to the Angular component. Use an arrow function to preserve lexical `this`.

**Thai Explanation:** callback ถูกเรียกโดย widget ไม่ใช่ Angular component จึงควรใช้ arrow function เมื่อ handler ต้อง access component state

## 3. DevExtreme dx-form custom content

**English Question:** Why might custom Angular content inside `dxi-item` fail to render?

**English Answer:** DevExtreme form items use their own template system. Custom content must be placed inside the expected template slot, such as `ng-template dxTemplate="item"`.

**Thai Explanation:** `dx-form` ไม่ได้ render arbitrary Angular HTML ทุกแบบ ต้องทำตาม template contract ของ DevExtreme

## 4. Boolean UI condition

**English Question:** How do you avoid bugs when a UI section should be hidden only for one specific combination of states?

**English Answer:** Express the forbidden combination directly and negate it, for example `!(A && B)`, then validate it with a truth table.

**Thai Explanation:** ถ้า requirement คือซ่อนเฉพาะบาง case ให้เขียนจาก case ที่ต้องซ่อน ไม่ใช่เขียน condition แสดงแบบเดาสุ่ม

## 5. Restoring UI state after loading saved data

**English Question:** Why should UI state be restored after loading saved form data instead of relying only on form change events?

**English Answer:** Hydrating saved data may not trigger the same change events as user interaction. State that controls rendering must be restored deterministically from persisted data.

**Thai Explanation:** load draft ไม่ guaranteed ว่าจะยิง event เหมือน user กรอก form จึงต้อง restore state จาก saved data โดยตรง

Related: [[Angular Input Object Reference]], [[DevExtreme dx-form Rendering Rules]], [[Restore UI State After Load Data]]

## 6. JavaScript switch-case fall-through

**English Question:** In a JavaScript switch statement, what happens when a case block contains an if-else but not all code paths have a `return` or `break`?

**English Answer:** JavaScript switch-cases fall through by default. If the if-else doesn't cover all values and there's no explicit `return` or `break` at the end of the block, execution continues into the next case.

**Thai Explanation:** switch-case ใน JavaScript ไม่มี implicit `return` — ถ้า if-else ไม่ครอบทุก path และไม่มี `return`/`break` ปิดท้าย จะ fall-through ไปยัง case ถัดไปโดยอัตโนมัติ ควรเพิ่ม `return` fallback เสมอ

Related: [[Switch Case Fall-Through]]

## 7. Flexbox justify-content-between with dynamic children

**English Question:** Why does `justify-content: space-between` fail to push a single element to the right, and how do you fix it?

**English Answer:** `space-between` distributes space between multiple children. With only one child, there is nothing to distribute against, so the element stays at the start. Fix by switching to `justify-content: end` or `flex-end` when there is only one child.

**Thai Explanation:** `justify-content-between` ต้องการ 2 children ขึ้นไป — เมื่อ `*ngIf` ซ่อน element หนึ่งออก ควรเปลี่ยน justify class บน parent เป็น `justify-content-end` แทน

Related: [[Flexbox justify-content-between Single Child]]


## 8. Angular @ViewChild lifecycle timing

**English Question:** At which lifecycle hook does `@ViewChild` become available in an Angular component, and why?

**English Answer:** `@ViewChild` is available starting from `ngAfterViewInit`. Angular must render the component's template first before it can resolve the view references. In `ngOnInit`, the template has not been rendered yet, so `@ViewChild` is `undefined`.

**Thai Explanation:** `@ViewChild` ใช้ได้ตั้งแต่ `ngAfterViewInit` เป็นต้นไป เพราะ Angular ต้อง render template ก่อนถึงจะหา reference ได้ — ใน `ngOnInit` template ยังไม่ถูก render จึงเป็น `undefined` เสมอ

Related: [[Angular Lifecycle Hooks — @ViewChild Timing]]

## 9. DevExtreme dx-form — direct mutation vs updateData()

**English Question:** Why doesn't directly mutating a `formData` property cause a DevExtreme `dx-form` to re-render?

**English Answer:** DevExtreme `dx-form` manages its own rendering pipeline. It is not aware of direct JavaScript object mutations. To update a displayed value after the form is initialized, you must call `formRef.instance.updateData(fieldName, value)` which notifies the widget to re-render.

**Thai Explanation:** `dx-form` ไม่ watch JavaScript object โดยตรง การ set `formData['field'] = value` ไม่ทำให้ form re-render ต้องเรียก `instance.updateData()` เพื่อแจ้ง widget ให้อัพเดท

Related: [[DevExtreme dx-form updateData vs Direct Mutation]], [[Angular Lifecycle Hooks — @ViewChild Timing]]

## 10. Object spread merge for multi-source form data

**English Question:** When building form data from two API sources in the same method, why should you use object spread merge instead of two separate assignments?

**English Answer:** A second direct assignment (`this._formData = b`) silently overwrites the first (`this._formData = a`), causing data loss. Object spread merge (`{ ...a, ...b }`) combines both sources in a single expression, making the merge intent explicit and keeping all fields.

**Thai Explanation:** assignment สองครั้งติดกันทำให้ครั้งแรกหายไปเงียบ ๆ — ใช้ `{ ...a, ...b }` เพื่อ merge ทั้งสอง source ในบรรทัดเดียว ลำดับ spread กำหนดว่าใคร override ใคร

Related: [[Object Spread Merge Pattern]], [[FormData Overwritten by Double Assignment]]

## 11. Conditional validation based on workflow state

**English Question:** How should you design a `validate()` function when some fields are only required for certain workflow states (e.g., only when approving)?

**English Answer:** Guard the state-specific check list behind an `if` condition before adding to the checks array. This avoids false-positive validation errors, makes the required-field rules explicit per state, and keeps the function easy to extend.

**Thai Explanation:** ใส่ `if (this.approveValue === 'A')` ก่อน push checks ที่เกี่ยวกับ approve — validation จะไม่ block กรณีอื่น และโค้ดบอกชัดเจนว่า field ไหนต้องกรอกในสถานะไหน

Related: [[Conditional Validation Pattern]]

## 12. Function reference vs function call

**English Question:** In JavaScript, what is the difference between writing `this.myMethod` and `this.myMethod()` inside a callback?

**English Answer:** `this.myMethod` is a reference to the function object — it evaluates the expression but does not invoke it, producing no side effects. `this.myMethod()` actually calls the function. Writing the reference without `()` is a silent no-op: no error, no warning, nothing happens.

**Thai Explanation:** `this.myMethod` เป็นแค่การอ้างอิง function object ไม่ได้เรียก — TypeScript ไม่ warn กรณีนี้เพราะ syntax ถูกต้อง ต้องเพิ่ม `()` จึงจะ invoke ได้

Related: [[Function Reference Without Parentheses]]

## 13. Calling async-dependent functions at the right lifecycle phase

**English Question:** Why is using setTimeout to wait for async data an anti-pattern, and what is the correct approach?

**English Answer:** setTimeout delay is not guaranteed to outlast an async operation. If the network is slow or the load is heavy, the callback may run before the data arrives. The correct approach is to call any data-dependent function inside the `.subscribe()` or `.then()` callback where the data is first assigned.

**Thai Explanation:** `setTimeout` ไม่การันตี timing — ถ้า API ช้า จะทำงานก่อนข้อมูลมา วิธีที่ถูกคือเรียกฟังก์ชันภายใน subscribe callback โดยตรง

Related: [[Fix Function Called in Wrong Lifecycle Phase]]

## 14. Patching a third-party JSON schema dynamically

**English Question:** When a third-party component (like Formio) doesn't support disabling individual options at the API level, how can you control rendering without modifying the source JSON?

**English Answer:** Create a pure function that performs a recursive tree walk over the schema. The function copies each node immutably (object spread) and, when it finds the target component, returns a modified copy. The result is a new schema object that you bind to the component instead of the original.

**Thai Explanation:** ทำ recursive walk ที่สร้าง object ใหม่ทุกชั้น ไม่แตะต้อง original schema — เมื่อ bind schema ใหม่ component จะ re-render ตามค่าที่แก้ไข

Related: [[Patch Formio Schema Dynamically]]

## 15. Duplicate template names inside dx-form

**English Question:** What happens in DevExtreme `dx-form` if two `dxi-item` elements register a `cellTemplate` with the same name, and how do you avoid it?

**English Answer:** `dx-form` template names must be unique within the form. If two items share a name, DevExtreme resolves to the first-registered template only, so the second item silently fails to render as intended. This commonly happens when copy-pasting a button block from one wizard step to another without renaming the template.

**Thai Explanation:** ชื่อ `cellTemplate` ต้อง unique ทั่วทั้ง form ถ้าซ้ำกัน DevExtreme จะ resolve ไปยัง template แรกเท่านั้น มักเกิดตอน copy ปุ่มควบคุมจากหน้าหนึ่งไปอีกหน้าหนึ่งแล้วลืมเปลี่ยนชื่อ

Related: [[Duplicate cellTemplate Name in dx-form]]

## 16. Building a multi-step wizard on top of an existing dx-form

**English Question:** What are the minimum pieces required to turn a single-page `dx-form` into a validated multi-step wizard?

**English Answer:** Three cooperating pieces: (1) page state — a current page index, total page count, and a completed-steps array; (2) navigation methods (`onNextPage`, `onPreviousPage`, `onGoToPage`) that all funnel forward navigation through one `validateCurrentPage()` gate; (3) template structure where each page's content and per-page controls are wrapped in `*ngIf="_currentFormPage === N"`. Missing any one piece produces a wizard that looks like it works but silently breaks (e.g., content shows on every page, or navigation isn't actually validated).

**Thai Explanation:** ต้องมี state (หน้า/จำนวนหน้า/สถานะ complete), method navigation ที่ forward ทุกทิศไปข้างหน้าผ่าน `validateCurrentPage()` จุดเดียว, และเนื้อหาต้องผูก `*ngIf` ตามเลขหน้าจริง — ขาดส่วนใดส่วนหนึ่งจะดู "ทำงานได้" แต่พังเงียบๆ

Related: [[Multi-Page Form Stepper Pattern]]

## 17. Debugging a "field is always undefined" bug

**English Question:** A component field like `approveValue` is always `undefined` even though the code reads it in several places. Where do you look first?

**English Answer:** Grep for every assignment (`=`) to that field across the file, not just its usages. A field that's declared with a type but has no default value and no assignment anywhere is a strong signal the wiring was never completed — often because the component was copy-duplicated from another file and an assignment step (e.g., inside a data-load callback) was dropped along the way.

**Thai Explanation:** grep หาจุด assign (ไม่ใช่จุดใช้งาน) ของตัวแปรนั้นก่อนเสมอ — ถ้าไม่เจอจุด assign เลยทั้งไฟล์ แปลว่า wiring ขาดไปตั้งแต่ต้น มักเกิดจาก copy component มาแล้ว method ที่ควร assign ค่าตกหล่นไประหว่างทาง

Related: [[Declared but Unassigned State]]

## 18. Registering a duplicated Angular component

**English Question:** After copying an existing Angular component's files to create a new one, what else must be updated before it actually renders in place of the old one?

**English Answer:** Two separate registration layers, both required: the component must be added to its `NgModule`'s `declarations` (framework level), and it must be wired into whatever application-level mapping selects components at runtime — e.g. a task-code-to-component map in a router-like service. Copying files and updating imports alone is not enough; skipping either layer leaves the old component silently in use.

**Thai Explanation:** ต้อง wire สองชั้นเสมอ: เพิ่มเข้า `declarations` ของ `NgModule` (framework level) และแก้ mapping ระดับแอป (เช่น task-code-to-component map) — ขาดชั้นใดชั้นหนึ่ง component เก่าจะยังถูกใช้งานอยู่โดยไม่มี error เตือน

Related: [[Duplicate Component Registration Checklist]]

## 19. Sharing a decision value across sequential workflow steps

**English Question:** Two sequential steps in the same workflow both expose a property called `approveValue`, computed the same way (`${taskCode}_approve`). Step B needs to know what was chosen in step A. Why is reading `this.approveValue` in step B wrong, and how do you fix it?

**English Answer:** Each step's `approveValue` is scoped to that step's own question — the naming convention is identical but the underlying key (and possibly the set of valid answers) differs per task. Reading it directly conflates "my own answer" with "the previous step's answer". The fix is to reconstruct the *specific* upstream task's key from a shared, stable part of the identifier (e.g., a flow-instance prefix common to both steps) and read it from the persisted record both steps share (keyed by a business/case id), not from the current step's own form event data.

**Thai Explanation:** `approveValue` ของแต่ละ step คำนวณจากคำถามของ step นั้นเอง ชื่อตัวแปรเหมือนกันแต่ key/ความหมายคนละอัน อ่านตรงๆ จะผิด ต้อง reconstruct key ของ step ที่ต้องการจริงจากส่วนที่ทั้งสอง step ใช้ร่วมกัน (เช่น flow prefix) แล้วอ่านจาก record ที่ persist ร่วมกันผ่าน business id ไม่ใช่จาก form event ของ step ปัจจุบัน

Related: [[Cross-Task Decision via Dynamic Flow Key]], [[Approve Value Scoped to Wrong Task]]

## 20. Hidden form field still carrying a stale value

**English Question:** A field bound to a form library's `dataField` is hidden with `*ngIf` based on a condition. The user changes the condition so the field should no longer apply, but the old value still gets submitted. Why, and how do you prevent it?

**English Answer:** `*ngIf` removes the rendered element from the DOM, but the underlying data-bound value in the model object is untouched — the form library only reads/writes it while the element exists, it doesn't clear it on removal. If the field is irrelevant under the new condition, the code must explicitly null out that value (in the change handler and, defensively, right before submit) rather than relying on visibility alone.

**Thai Explanation:** `*ngIf` แค่ถอด element ออกจาก DOM ไม่ได้แตะค่าที่ผูกไว้ใน model object — ต้อง set ค่าเป็น `null`/`undefined` เองตอนเงื่อนไขเปลี่ยน ไม่งั้นค่าเก่าจะหลุดติดไปกับการ submit ครั้งถัดไป

Related: [[Approve Value Scoped to Wrong Task]], [[Restore UI State After Load Data]]

## 21. Designing visibility for a feature shared across many callers

**English Question:** A shared component is used by five different parent forms across many workflow variants. One boolean getter decides whether a sub-feature (e.g. a button) is shown. How do you decide between "always show it" versus "show it only for an allowlist of caller codes"?

**English Answer:** It depends entirely on the actual, confirmed requirement — not on what's easiest to code. If every current caller genuinely needs the same behavior, an unconditional `return true` is correct and has zero maintenance cost (no list to keep in sync). If only some callers should see it, an allowlist keyed by a stable identifier (like a task/flow code) is required, and that list must be revisited whenever a new caller is added. Guessing wrong in either direction causes churn — get explicit confirmation of scope from someone who knows the business requirement before choosing.

**Thai Explanation:** ต้องยืนยัน requirement จริงก่อนเลือก ถ้าทุก caller ต้องการเหมือนกัน `return true` คือคำตอบที่ maintain ง่ายที่สุด ถ้ามีบาง caller ที่ต้องการต่างออกไป ต้องทำ allowlist ตาม task/flow code และคอยอัปเดตทุกครั้งที่มี caller ใหม่ — เดาผิดทางไหนก็เสียเวลาแก้ซ้ำทั้งคู่

Related: [[Force-Show Feature by Task Code Allowlist]]

## 22. Diagnosing "value is sent but not saved"

**English Question:** A frontend confirms a field's value is included in the outgoing request payload, but the value never appears in the database afterward. What's your debugging order?

**English Answer:** Peel it back one layer at a time instead of jumping straight to "it's a backend bug": (1) confirm the frontend actually sets a real value at every point the payload is built — grep for every assignment, not just usages; (2) confirm the request is hitting the *correct* service/endpoint — projects with multiple similarly-named service versions (e.g. a "v5" and "v6" of the same form's API) make it easy to call the wrong one, where the field is present in the body but the endpoint doesn't map it to the right table/report; (3) only after ruling out both of those, suspect the backend DTO/mapping itself. Fixing this class of bug is often not "add the missing field" — it can be "call the correct endpoint."

**Thai Explanation:** อย่าข้ามไปสงสัย backend ทันที ให้ไล่เช็คทีละชั้น: (1) FE set ค่าจริงหรือไม่ (grep จุด assign ทั้งหมด) (2) เรียก endpoint/service ถูกตัวหรือไม่ — โปรเจกต์ที่มี service เวอร์ชันคล้ายกันหลายตัวทำให้เรียกผิดง่ายมาก แม้ field จะอยู่ใน body จริงก็ตาม (3) ถ้าสองข้อบนถูกหมดแล้วค่อยสงสัย backend DTO — บางครั้งทางแก้คือเปลี่ยน endpoint ที่เรียก ไม่ใช่แค่เพิ่ม field

Related: [[Service Endpoint Mismatch Blocks Field From Persisting]]

## 23. Preventing two developers from silently overwriting each other's fix

**English Question:** Two developers, working days apart, each fix the same bug in the same shared component's getter — with genuinely different (and incompatible) approaches. Neither knew the other had touched the file. Git merges cleanly with no conflict. What process step would have caught this before it happened, and why doesn't git catch it on its own?

**English Answer:** Check the file's recent commit history (`git log -- <path>`) before designing a fix for a shared/common component, and read the message and diff of anything relevant. Git's merge/conflict detection only operates at the text-line level — if two commits touch the same logical getter but not literally overlapping lines (or one fully replaces what the other changed, on different days), git will merge them without complaint. It has no concept of "these two changes represent incompatible intents." That gap has to be closed by a human habit — checking history and syncing with the team — not by tooling.

**Thai Explanation:** เช็ค `git log` ของไฟล์ก่อนแก้ shared component เสมอ แล้วอ่าน commit ที่เกี่ยวข้องก่อนออกแบบ fix ใหม่ — git ตรวจจับ conflict แค่ระดับบรรทัดข้อความเท่านั้น ถ้าสอง commit แก้ logic เดียวกันคนละแนวทางแต่ไม่ชนกันตรงบรรทัด (หรือมาแทนที่กันคนละวัน) git จะ merge ผ่านเงียบๆ โดยไม่เตือนอะไรเลย ต้องอาศัยนิสัยของคน (เช็ค log, คุยกับทีมก่อนแก้) มาปิดช่องว่างนี้แทน

Related: [[Check Recent Commits Before Fixing Shared Component]]

## 24. One-time `@Input()` binding treated as a live value

**English Question:** A component receives data via `@Input()` bound to a third-party widget's one-time submission property (e.g. `[submission]="formioSubmission"`). The widget also emits a `(change)` event into a separate tracked field. Why is building a save payload from the `@Input()` wrong, and how do you find this bug?

**English Answer:** A one-time `[prop]="value"` binding only reflects the value at the moment the widget was initialized — Angular doesn't magically keep it "current" unless something explicitly reassigns it every time the underlying data changes. If nothing reassigns the `@Input()` field after init, it is a frozen snapshot forever, while the field populated by the `(change)` event handler holds the real current value. Find it by grepping every assignment (`this.field =`) to the `@Input()` field across the file — if the only occurrence is the `@Input()` decorator itself, it's proven stale.

**Thai Question:** component รับข้อมูลผ่าน `@Input()` ที่ bind กับ property แบบ one-time ของ third-party widget (เช่น `[submission]="formioSubmission"`) และ widget เดียวกันก็ยิง `(change)` event เข้า field อีกตัวที่ track ค่าล่าสุดแยกไว้ ทำไม build payload จาก `@Input()` ถึงผิด แล้วหา bug นี้ยังไง?

**Thai Answer:** binding แบบ one-time (`[prop]="value"`) สะท้อนแค่ค่า ณ ตอน widget ถูก init เท่านั้น Angular ไม่ได้ทำให้มัน "ล่าสุดเสมอ" อัตโนมัติ เว้นแต่มีโค้ด reassign มันทุกครั้งที่ข้อมูลเปลี่ยน ถ้าไม่มีใคร reassign `@Input()` field นี้เลยหลัง init มันจะเป็นค่านิ่งตลอดไป ส่วน field ที่ `(change)` event handler set ให้ต่างหากที่มีค่าจริงล่าสุด หา bug ได้โดย grep หาทุกจุด assignment (`this.field =`) ของ `@Input()` field นั้นทั้งไฟล์ ถ้าเจอแค่ตรง decorator ก็ยืนยันได้ว่ามันเป็นค่านิ่ง

**Thai Explanation:** บั๊กนี้ต่างจาก reference-sharing ปกติของ `@Input()` object (ที่ mutate แล้ว parent เห็นด้วย) เพราะ field ตัวนี้ไม่มีใครแตะเลยหลัง init — ปัญหาไม่ใช่เรื่อง reference แต่เรื่องไม่มี assignment เกิดขึ้นอีกเลย

Related: [[Stale Input Snapshot vs Live Change-Tracked State]], [[Angular Input Object Reference]]

## 25. `Array.isArray()` guard checking the wrong sibling variable

**English Question:** A ternary `Array.isArray(x) ? [...x] : []` always evaluates to the empty-array branch, silently dropping real data from a form submission, with zero compile or runtime errors. How is this possible, and how do you debug it?

**English Answer:** It's possible when `x` is typed `any` and is assigned a plain object literal everywhere in the code — `Array.isArray()` on an object always returns `false`, so the "safe" empty-array fallback is chosen every single time regardless of what data actually exists. This is a variable-identity bug, not a logic bug: the developer likely meant to reference a similarly-named sibling variable that actually holds an array. Debug by grepping every assignment site of the checked variable (not just its usage) and comparing its declared/assigned type against what the condition assumes.

**Thai Question:** เจอ ternary แบบ `Array.isArray(x) ? [...x] : []` ที่ branch array ว่างถูกเลือกทุกครั้ง ทำให้ข้อมูลจริงหายไปจาก submission เงียบๆ โดยไม่มี compile error หรือ runtime error เลย เป็นไปได้ยังไง แล้วจะ debug ยังไง?

**Thai Answer:** เป็นไปได้เมื่อ `x` เป็น type `any` และถูก assign เป็น plain object literal ทุกจุดในโค้ด — `Array.isArray()` บน object จะคืน `false` เสมอ จึงเลือก fallback array ว่างทุกครั้งไม่ว่าข้อมูลจริงจะมีอะไร นี่คือบั๊กเรื่องอ้างตัวแปรผิดตัว ไม่ใช่ logic ผิด — ผู้เขียนน่าจะตั้งใจอ้างตัวแปรพี่น้องที่ชื่อคล้ายกันซึ่งเป็น array จริงๆ debug โดย grep หาทุกจุด assignment ของตัวแปรที่ถูกเช็ค (ไม่ใช่แค่จุดใช้งาน) แล้วเทียบ type ที่ assign จริงกับที่ condition คาดหวัง

**Thai Explanation:** `any` type คือตัวการที่ทำให้ TypeScript ไม่ช่วย catch บั๊กนี้ตอน compile — ถ้าตัวแปรมี type ที่เจาะจงกว่านี้ (เช่น `any[]` vs เป็น interface เฉพาะ) compiler จะ error ทันทีตอน assign object ให้ตัวแปรที่ควรเป็น array

Related: [[Array.isArray Guard on Wrong Variable Silently Drops Data]], [[Child Array Not Synced to Parent on Save]]

## 26. `readOnly` field's `onValueChanged` firing during data load

**English Question:** A DevExtreme form field is `readOnly: true` and has an `onValueChanged` callback that recalculates other fields. When you programmatically assign that field's value from backend data during `ngOnInit`, the callback fires and overwrites the correct backend values with a recalculated (wrong) result. Why does `readOnly` not prevent this, and what's the fix?

**English Answer:** `readOnly` only disables user keyboard/mouse interaction with the rendered widget — it has no effect on the widget's internal change-detection pipeline, which fires `onValueChanged` any time the bound `formData` property is set, regardless of who or what set it (user typing or a plain JS assignment in component code). The fix is an explicit guard flag set `true` for the duration of the data-load phase and checked at the top of the callback, so load-time assignments are distinguished from genuine user-driven changes — `readOnly`/`disabled` attributes are not a substitute for this.

**Thai Question:** field ของ DevExtreme form ตั้ง `readOnly: true` ไว้ และมี `onValueChanged` callback ที่คำนวณ field อื่นใหม่ พอเขียนโค้ด set ค่า field นี้จาก backend ตอน `ngOnInit` callback ก็ยังยิงและไปทับค่าจริงจาก backend ด้วยผลคำนวณที่ผิด ทำไม `readOnly` ถึงป้องกันไม่ได้ แล้วแก้ยังไง?

**Thai Answer:** `readOnly` ปิดแค่การโต้ตอบของ user (พิมพ์/คลิก) กับ widget ที่ render ออกมาเท่านั้น ไม่มีผลกับ change-detection pipeline ภายในของ widget ซึ่งยิง `onValueChanged` ทุกครั้งที่ property ใน `formData` ที่ผูกไว้ถูก set ไม่ว่าจะมาจาก user พิมพ์หรือโค้ด assign ตรงๆ ก็ตาม วิธีแก้คือเพิ่ม guard flag ที่ set เป็น `true` ตลอดช่วงโหลดข้อมูล แล้วเช็คที่ต้น callback เพื่อแยกการ set ค่าตอนโหลดออกจากการเปลี่ยนแปลงจริงจาก user — attribute อย่าง `readOnly`/`disabled` ใช้แทนกันไม่ได้

**Thai Explanation:** หลักการคือ widget เห็นแค่ "ค่าเปลี่ยน" ไม่รู้ว่าใครเป็นคน set จึงยิง event เดียวกันทุกกรณี ต้องแยก "load phase" ออกจาก "interaction phase" ด้วย flag ของแอปเอง

Related: [[DevExtreme onValueChanged Fires During Programmatic Data Load]], [[DevExtreme dx-form updateData vs Direct Mutation]]

## 27. Mutating state inside a template-bound getter

**English Question:** Why is it dangerous to mutate component state inside a getter that's bound to an Angular template (e.g. `*ngIf="myGetter"`)?

**English Answer:** Angular calls template-bound getters on every change detection cycle, which can fire many times per user action (any event, timer, or async callback anywhere in the app can trigger it) — not just once per intended trigger. A getter that mutates state on each call produces a value that flips unpredictably, uncorrelated with any real user interaction.

**Thai Question:** ทำไมการ mutate state ของ component ข้างใน getter ที่ผูกกับ Angular template (เช่น `*ngIf="myGetter"`) ถึงอันตราย?

**Thai Answer:** Angular เรียก getter ที่ผูกกับ template ทุกรอบ change detection ซึ่งเกิดขึ้นได้หลายครั้งต่อ 1 user action จริง ไม่ใช่แค่ครั้งเดียวตามที่ตั้งใจ ถ้า getter มี side-effect ค่าที่ได้จะเปลี่ยนไปมาแบบไม่มี pattern ที่สัมพันธ์กับ user action จริง

**Thai Explanation:** getter ที่ผูกกับ template ต้อง "pure" เสมอ — เรียกกี่ครั้งก็ต้องได้ผลลัพธ์เดิมถ้าไม่มีอะไรเปลี่ยน ถ้าต้องการ toggle state จริง ๆ ให้ย้าย logic นั้นไปอยู่ใน event handler แทน

Related: [[Getter With Side Effect Breaks Change Detection]]

## 28. `new Date()` silently failing on non-ISO strings

**English Question:** A helper function `formatTimeToHHmm(time)` accepts `Date | string | number`. It returns an empty string for a valid-looking input like `"16:11"`, but works fine for a `Date` object. What's the most likely cause?

**English Answer:** `new Date("16:11")` is not a valid ECMAScript date-time string (no date component), so `new Date()` silently produces an `Invalid Date` rather than throwing — a downstream `isNaN(d.getTime())` check then discards it. This happens when the same field can arrive as either a live `Date` object (from a UI picker) or an already-formatted string (loaded from a backend) — the function needs to detect the already-correct-format case and short-circuit instead of re-parsing it.

**Thai Question:** helper function `formatTimeToHHmm(time)` รับ type `Date | string | number` แต่คืนค่าว่างสำหรับ input ที่ดู valid เช่น `"16:11"` ทั้งที่ทำงานถูกต้องกับ `Date` object ปกติ สาเหตุที่เป็นไปได้มากที่สุดคืออะไร?

**Thai Answer:** `new Date("16:11")` ไม่ใช่รูปแบบ date-time string ที่ ECMAScript รองรับ (ไม่มีส่วนวันที่) จึงได้ `Invalid Date` แบบเงียบ ๆ ไม่ throw error แล้วถูกเช็ค `isNaN(d.getTime())` ทิ้งไป เกิดขึ้นเมื่อฟิลด์เดียวกันมาได้สองแบบ (จาก UI picker เป็น `Date` object สด ๆ หรือจาก backend ที่ format เป็น string ไว้แล้ว) — function ต้องเช็คกรณี "format ถูกอยู่แล้ว" แล้ว short-circuit แทนที่จะ parse ซ้ำ

**Thai Explanation:** `new Date()` เป็นฟังก์ชันที่ fail แบบเงียบ ไม่มี exception ให้เห็น ต่างจากภาษาอื่นที่มักจะ throw — ต้องเช็ค `isNaN(d.getTime())` เองเสมอเมื่อ parse จาก string ที่ไม่รู้แหล่งที่มาแน่ชัด

Related: [[new Date() Returns Invalid Date for Non-ISO Time Strings]]

## 29. Compile error vs silent undefined for the same class of missing wiring

**English Question:** Two bugs share the same root cause — a property referenced across `.ts` and `.html` was never fully wired up — but one causes a TypeScript compile error while the other silently returns `undefined` at runtime with no error at all. What determines which outcome you get?

**English Answer:** Whether the property was declared as a class member at all. If it's referenced but never declared, TypeScript flags "Property does not exist on type" at compile time. If it *was* declared (even with no default value or assignment), the reference is valid to the type checker — the value is just `undefined` at runtime, which is legal for most types unless strict initialization is enforced, so nothing errors until logic depends on it holding real data.

**Thai Question:** บั๊กสองแบบมี root cause เดียวกัน (ตัวแปรที่อ้างถึงทั้งใน `.ts`/`.html` แต่ต่อสายไม่ครบ) แต่แบบหนึ่ง compile error ทันที ส่วนอีกแบบเงียบเป็น `undefined` ตอน runtime อะไรกำหนดผลลัพธ์?

**Thai Answer:** อยู่ที่ตัวแปรถูก declare เป็น class member หรือไม่ ถ้าอ้างถึงแต่ไม่เคย declare เลย TypeScript error ทันทีตอน compile ถ้า declare ไว้แล้ว (แม้ไม่เคย assign) type checker ถือว่าถูกต้อง ค่าจะเป็น `undefined` เฉย ๆ ตอน runtime โดยไม่มี error จนกว่าจะมี logic ที่ต้องพึ่งค่าจริง

**Thai Explanation:** compiler ตรวจจับ "ไม่มีตัวตน" ได้ทันที แต่ตรวจจับ "มีตัวตนแต่ว่างเปล่า" ไม่ได้เลย ต้องอาศัยการ grep/review เอง

Related: [[Property Used but Never Declared]], [[Declared but Unassigned State]]

## 30. Duplicated payload-building logic drifting out of sync

**English Question:** A time-formatting bugfix was applied to one function that builds an API request payload. Weeks later, the same "already-fixed" bug reappears — but only through a *different* button that internally calls a second, separate function building a structurally similar payload. What's the underlying design flaw, and what's the durable fix?

**English Answer:** The two functions are copy-pasted duplicates that build conceptually the same payload but drifted out of sync — the earlier fix only touched one copy. Patching the second copy to match resolves this instance but not the next drift. The durable fix is extracting the shared payload-building logic into one method both call sites invoke, so any future fix only needs to happen once.

**Thai Question:** บั๊กเรื่อง format เวลาถูกแก้ไปแล้วในฟังก์ชันหนึ่งที่ build payload ส่งไป API แต่อีกไม่กี่สัปดาห์ต่อมา บั๊กที่ "เคยแก้แล้ว" กลับมาอีกผ่านปุ่มอีกปุ่มที่เรียกอีกฟังก์ชันที่ build payload คล้ายกันแยกต่างหาก ปัญหาการออกแบบที่แท้จริงคืออะไร แล้วทางแก้ที่ยั่งยืนคืออะไร?

**Thai Answer:** สองฟังก์ชันเป็น copy-paste ที่ build payload ความหมายเดียวกันแต่ drift ออกจากกันเพราะ fix ครั้งก่อนแตะแค่ก้อนเดียว การไปแก้ก้อนที่สองให้ตรงกันแค่แก้ปัญหาเฉพาะหน้า ทางแก้ที่ยั่งยืนคือดึง logic build payload ออกมาเป็น method เดียวที่ทั้งสองจุดเรียกใช้ร่วมกัน

**Thai Explanation:** สัญญาณเตือนคือเห็น object literal โครงสร้างคล้ายกันมากซ้ำในไฟล์เดียวกันหลายจุด — นั่นคือ DRY violation ที่รอวันสร้างบั๊กแบบนี้

Related: [[Duplicated Payload-Building Logic Drifts Out of Sync]]

## 31. NG0100 from mutating a template-bound flag inside `ngAfterViewInit`

**English Question:** A component sets `this.isVisible = true` inside `ngAfterViewInit()`, and that same flag drives `*ngIf` in its own template. Angular throws `NG0100: ExpressionChangedAfterItHasBeenCheckedError` in dev mode, and worse, code that runs synchronously afterward can't find a DOM element the flag was supposed to reveal. Why?

**English Answer:** `ngAfterViewInit` fires after Angular has already run change detection and checked the view's bindings for this cycle. Mutating a template-bound value inside it changes something Angular already "signed off on" this pass — that's exactly what NG0100 flags. The `*ngIf` won't re-evaluate until the next change detection pass, which for a synchronous flip (or even a `setTimeout(0)` scheduled within the same task) may not happen before subsequent code runs — so a DOM query for the element that `*ngIf` was supposed to reveal can fail because it hasn't been inserted yet.

**Thai Question:** component set `this.isVisible = true` ข้างใน `ngAfterViewInit()` และ flag ตัวเดียวกันนี้ควบคุม `*ngIf` ในเทมเพลตของตัวเอง Angular throw `NG0100: ExpressionChangedAfterItHasBeenCheckedError` ตอน dev mode แถมโค้ดที่รันต่อจากนั้นแบบ synchronous ก็หา DOM element ที่ flag นี้ควรจะทำให้โผล่มาไม่เจอด้วย ทำไมถึงเป็นแบบนี้?

**Thai Answer:** `ngAfterViewInit` ทำงานหลังจาก Angular check binding ของ view รอบนี้เสร็จไปแล้ว การไป mutate ค่าที่ผูกกับ template ข้างในจึงเป็นการเปลี่ยนสิ่งที่ Angular "เซ็นรับรอง" ไปแล้วในรอบเดียวกัน นั่นคือสิ่งที่ NG0100 เตือน ส่วน `*ngIf` จะไม่ re-evaluate จนกว่าจะถึงรอบ change detection ถัดไป ซึ่งถ้าเป็นการ flip แบบ synchronous หรือแม้แต่ `setTimeout(0)` ที่ตั้งไว้ใน task เดียวกัน ก็อาจไม่ทันเกิดก่อนโค้ดถัดไปจะรัน ทำให้ query หา element ที่ `*ngIf` ควรจะสร้างไม่เจอ

**Thai Explanation:** ทางแก้คือย้ายค่าที่ควบคุม visibility ไปตั้งใน lifecycle hook ที่ทำงานก่อนวิว check (เช่น `ngOnChanges`/`ngOnInit`) แทน หรือถ้าเลี่ยงไม่ได้ ให้เอา `*ngIf` ออกจาก element ที่จำเป็นต้องมีอยู่แน่นอน (ให้ parent ควบคุม visibility แทนในชั้นที่สูงกว่า)

Related: [[Leaflet Map Zoom Reset on Position Change]]

## 32. `@ViewChild({ static: true })` vs default (`static: false`)

**English Question:** You need to pass a native DOM element into a third-party JS library (e.g. Leaflet's `L.map(element)`) as early as possible, but the default `@ViewChild` behavior only resolves in `ngAfterViewInit`. How do you get it earlier, and what's the tradeoff?

**English Answer:** Set `{ static: true }` on the `@ViewChild` decorator — this resolves the reference during the first change detection pass, available as early as `ngOnInit`, because Angular guarantees it for elements that are NOT behind a structural directive (`*ngIf`/`*ngFor`) on themselves. The tradeoff: the target element must be unconditionally present in the template — if it's wrapped in its own `*ngIf`, `static: true` can't help, since the element may not exist at all in that pass.

**Thai Question:** ต้องส่ง native DOM element เข้า third-party JS library (เช่น Leaflet `L.map(element)`) ให้เร็วที่สุด แต่ `@ViewChild` แบบ default resolve แค่ตอน `ngAfterViewInit` เท่านั้น จะเอาให้เร็วขึ้นได้ยังไง แล้วต้องแลกกับอะไร?

**Thai Answer:** ใส่ `{ static: true }` ใน `@ViewChild` decorator จะ resolve ตั้งแต่รอบ change detection แรก ใช้ได้ตั้งแต่ `ngOnInit` เพราะ Angular การันตีให้กับ element ที่ไม่ได้อยู่หลัง structural directive (`*ngIf`/`*ngFor`) บนตัวมันเอง ข้อแลกคือ element เป้าหมายต้อง render อยู่เสมอไม่มีเงื่อนไข ถ้ามี `*ngIf` ครอบตัวมันเอง `static: true` ช่วยไม่ได้เพราะ element อาจไม่มีอยู่เลยในรอบนั้น

**Thai Explanation:** กฎง่ายๆ คือ ถ้า element ที่ query ไม่เคยถูกซ่อนด้วยเงื่อนไขของตัวเอง ใช้ `static: true` ได้ปลอดภัยและใช้งานได้เร็วกว่า แต่ถ้า element อาจถูกซ่อน/แสดงแบบมีเงื่อนไข ต้องใช้ `static: false` (default) แล้วรอ `ngAfterViewInit`

Related: [[Angular Lifecycle Hooks — @ViewChild Timing]]

## 33. Changing a shared component's toggle-style public API

**English Question:** A shared Angular component's `showMap()` method is called by ~25 different parent forms via an identical `onToggleMap() { flag = !flag; child.showMap(); }` pattern, relying on `showMap()` to toggle create/destroy each call. You fix an unrelated race-condition bug in `showMap()` by making it idempotent (`if (this.map) return;`) so it only ever creates, never destroys. What did you just break, and how would you have caught it before shipping?

**English Answer:** Every one of those ~25 callers loses the ability to hide the map on a second click — their toggle button still flips their own local flag, but the child no longer reacts to it (`showMap()` is now a no-op once the map exists). This is a silent regression across all consumers, discoverable only by grepping every call site of the method being changed (`showMap()`) and every template usage of the component's selector *before* changing its contract — not just the one caller that reported the bug.

**Thai Question:** shared component ตัวหนึ่งมี method `showMap()` ที่ถูกเรียกจาก parent form ประมาณ 25 ไฟล์ ผ่าน pattern เดียวกันคือ `onToggleMap() { flag = !flag; child.showMap(); }` ซึ่งพึ่งพาว่า `showMap()` จะ toggle สร้าง/ทำลายทุกครั้งที่เรียก แล้วมีคนแก้บั๊ก race condition ที่ไม่เกี่ยวกันใน `showMap()` โดยทำให้มันเป็น idempotent (`if (this.map) return;`) จนสร้างได้อย่างเดียว ไม่ทำลายอีกต่อไป พังอะไรไปบ้าง แล้วจะจับได้ยังไงก่อน ship?

**Thai Answer:** caller ทั้ง 25 ไฟล์เสียความสามารถ "ซ่อนแผนที่เมื่อกดปุ่มซ้ำ" ไปหมด เพราะปุ่ม toggle ของแต่ละที่ยังคง flip flag ของตัวเองได้ตามปกติ แต่ child ไม่ react กับมันอีกแล้ว (`showMap()` กลายเป็น no-op เมื่อ map ถูกสร้างแล้ว) เป็น regression เงียบๆ ที่กระทบทุก consumer วิธีจับก่อน ship คือ grep หาทุกจุดที่เรียก method ที่กำลังจะแก้ (`showMap()`) และทุกจุดที่ใช้ selector ของ component นั้นในเทมเพลต ก่อนเปลี่ยน contract ของมัน ไม่ใช่ดูแค่ caller ที่ report บั๊กเข้ามา

**Thai Explanation:** บทเรียนคือ ก่อนเปลี่ยนพฤติกรรมของ public method ใน shared component ต้องตอบให้ได้ก่อนว่า "มีใครเรียกใช้บ้าง" ทั้งหมด ไม่ใช่แค่ที่ตัวเองกำลังแก้ปัญหาอยู่ — grep เป็นเครื่องมือถูกที่สุดสำหรับเช็คสิ่งนี้

Related: [[Leaflet Map Zoom Reset on Position Change]], [[Check Recent Commits Before Fixing Shared Component]]

## 34. Case-sensitive property binding name silently binding to nothing

**English Question:** An Angular template writes `[taskformcode]="_taskFormCode"` (all lowercase) targeting a component with `@Input() taskFormCode` (camelCase). The app still builds with 0 errors and runs without any console warning, but the child component's `taskFormCode` is always `undefined`. Why doesn't the compiler catch this, unlike a case-mismatched component *selector* which can produce a hard type error?

**English Answer:** Whether this is caught depends on how strict the project's Angular template type-checking configuration is (`strictTemplates`/`fullTemplateTypeCheck` in `tsconfig`). Without strict checking, an unrecognized property binding on a custom element is tolerated as if it might be a native DOM property/attribute — no input on the component matches, so nothing is bound, and the child simply keeps its default/undefined value; there is no fallback event misinterpretation like there can be for two-way `[(x)]` bindings, so it fails completely silently.

**Thai Question:** เทมเพลตของ Angular เขียน `[taskformcode]="_taskFormCode"` (ตัวเล็กหมด) แต่ component มี `@Input() taskFormCode` (camelCase) แอปยัง build ผ่าน 0 error รันไม่มี warning ใน console เลย แต่ `taskFormCode` ใน child เป็น `undefined` ตลอด ทำไม compiler ไม่จับ ทั้งที่ selector ที่สะกด case ผิดเคย error มาแล้ว?

**Thai Answer:** ขึ้นอยู่กับว่า config การเช็ค template ของโปรเจกต์เข้มงวดแค่ไหน (`strictTemplates`/`fullTemplateTypeCheck` ใน `tsconfig`) ถ้าไม่เข้มงวด property binding ที่ไม่รู้จักบน custom element จะถูกมองข้ามเหมือนอาจเป็น native DOM property/attribute — ไม่มี input ไหนของ component ตรงกัน เลยไม่ bind อะไรเลย child จะใช้ค่า default/undefined ต่อไป ไม่มีการตีความผิดเป็น event แบบที่เกิดกับ two-way binding `[(x)]` เพราะงั้นจึงพังแบบเงียบสนิท

**Thai Explanation:** นี่คือเหตุผลว่าทำไมเวลาสงสัยว่า "ทำไม `@Input()` เป็น undefined" ต้องเช็คตัวสะกด binding ใน template ให้ตรงกับชื่อ property เป๊ะๆ (case-sensitive) เป็นข้อแรกๆ ก่อนไปสงสัยจุดอื่น เพราะ compiler ไม่ช่วยเตือนกรณีนี้เลย

Related: [[Case-Sensitive Component Selector in Template Type Checker]], [[Missing Input Binding Causes Undefined Crash]], [[Case-Mismatched Property Binding Silently No-ops]]

## 35. Cascading dropdown loses its selection label after a wholesale data replacement

**English Question:** A form has cascading dropdowns (province → district → subdistrict), where each level's `dataSource` array only gets populated inside the level above's `onValueChanged` handler. When an "edit" action replaces the whole form-data object at once (e.g. `this.formData = { ...existingRecord }`), the district/subdistrict fields show blank even though their IDs are present in the data. Why, and how do you fix it?

**English Answer:** `onValueChanged` fires on genuine user interaction (or on a widget's own first-value assignment during creation) — it does not fire just because you replaced the bound object wholesale, so the dependent dropdowns' `dataSource` arrays stay empty from their initial state. The SelectBox then can't resolve a display label for the ID it's bound to, even though the ID itself is intact in the data. Fix by manually replaying the same cascade handlers with the existing IDs right after loading the record, so each level's dataSource gets populated to include the persisted ID.

**Thai Question:** ฟอร์มมี cascading dropdown (จังหวัด → อำเภอ → ตำบล) ที่แต่ละระดับ `dataSource` จะถูกเติมข้อมูลแค่ตอน `onValueChanged` ของระดับบนทำงานเท่านั้น พอ action "แก้ไข" replace ทั้ง form-data object ทีเดียว (เช่น `this.formData = { ...existingRecord }`) ช่อง อำเภอ/ตำบล กลับว่างเปล่า ทั้งที่ id ยังอยู่ในข้อมูลครบ ทำไมถึงเป็นแบบนี้ แล้วแก้ยังไง?

**Thai Answer:** `onValueChanged` fire ตอน user โต้ตอบจริง (หรือตอน widget ถูก set ค่าครั้งแรกตอนสร้าง) เท่านั้น ไม่ได้ fire แค่เพราะ object ที่ผูกไว้ถูกแทนที่ทั้งก้อน — `dataSource` ของ dropdown ที่ขึ้นกับระดับบนเลยค้างว่างเปล่าตามค่าเริ่มต้น SelectBox เลย resolve label ของ id ที่ผูกอยู่ไม่ได้ ทั้งที่ id เองยังอยู่ในข้อมูลปกติ วิธีแก้คือเรียก cascade handler เดิมด้วย id ที่มีอยู่แล้วเอง ทันทีหลังโหลด record เข้ามา เพื่อเติม dataSource ของแต่ละระดับให้มี item ตรงกับ id ที่ persist ไว้

**Thai Explanation:** หลักการเดียวกับ "restore UI state จาก persisted data" — event-driven population ใช้ได้กับ user interaction เท่านั้น พอมีทางเข้าข้อมูลแบบอื่น (bulk load/edit) ต้อง replay logic เดียวกันเองเสมอ ไม่ใช่หวังพึ่ง event ที่ไม่มีทางถูกยิงในเส้นทางนั้น

Related: [[Restore UI State After Load Data]]

## 36. Verifying which backend service actually handles a request before deep-diving

**English Question:** While debugging a "data disappears after save" bug across a full stack, you assumed the request was handled by the same backend service you'd fixed earlier that same day for a different form — based on that assumption you spent time reading the wrong file. What's the reliable way to confirm which service/endpoint actually handles a given frontend action, and why is memory/context from an earlier session not enough?

**English Answer:** Check direct, current evidence: the frontend component's own import statement / injected service (e.g. `form-inspection-location10.service.ts`) and the Network tab's actual request URL — both point unambiguously at the real endpoint. Prior-session context ("this project's forms use service X") is a hypothesis, not a fact for the specific form currently being debugged, especially in a codebase with many near-identical form variants (PHINAI3 through PHINAI10) — pattern-matching from memory across different forms is a common source of wasted investigation time.

**Thai Question:** ระหว่าง debug บั๊ก "ข้อมูลหายหลังบันทึก" ข้ามทั้ง stack เคยสันนิษฐานว่า request ถูกจัดการโดย backend service เดียวกับที่เพิ่งแก้ไปเมื่อเช้าสำหรับฟอร์มอื่น แล้วเสียเวลาไปอ่านไฟล์ผิด จะยืนยันได้อย่างน่าเชื่อถือได้อย่างไรว่า service/endpoint ไหนจัดการ action นั้นจริง แล้วทำไม context จาก session ก่อนหน้าถึงไม่พอ?

**Thai Answer:** เช็คหลักฐานตรงและปัจจุบันเสมอ: import statement/service ที่ component ฝั่ง frontend ใช้จริง (เช่น `form-inspection-location10.service.ts`) กับ URL ของ request จริงใน Network tab — ทั้งสองอย่างชี้ไป endpoint จริงแบบไม่กำกวม ส่วน context จาก session ก่อนหน้า ("โปรเจกต์นี้ฟอร์มใช้ service X") เป็นแค่สมมติฐาน ไม่ใช่ข้อเท็จจริงสำหรับฟอร์มที่กำลัง debug อยู่ตอนนี้ โดยเฉพาะในโปรเจกต์ที่มีฟอร์มคล้ายกันจำนวนมาก (PHINAI3 ถึง PHINAI10) — การจับคู่ pattern จากความจำข้ามฟอร์มเป็นสาเหตุทั่วไปของการเสียเวลาสืบสวนแบบผิดทาง

**Thai Explanation:** ยิ่งโปรเจกต์มีโครงสร้างซ้ำๆ กันหลายชุด (ฟอร์มคล้ายกันหลายสิบตัว) ยิ่งต้องระวังการ "เดาจากประสบการณ์ที่คล้ายกัน" แทนการ verify จริง เพราะความคล้ายกันของ pattern ไม่ได้แปลว่าเป็น instance เดียวกัน

Related: [[Shared Sync Helper Not Wired Into Every Form Controller]]
