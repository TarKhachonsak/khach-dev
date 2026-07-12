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
