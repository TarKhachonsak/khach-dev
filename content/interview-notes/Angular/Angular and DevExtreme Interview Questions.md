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
