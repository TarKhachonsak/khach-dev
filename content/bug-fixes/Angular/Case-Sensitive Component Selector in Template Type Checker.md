# Case-Sensitive Component Selector in Template Type Checker

## What happened?

หลังเพิ่ม typed two-way binding (`[(approveValue)]="approveValue"`) ให้ component ที่ใช้งานอยู่แล้วในโปรเจกต์มานาน `ng build` พัง ด้วย error:

```
Error: ... error TS2322: Type 'Event' is not assignable to type 'string'.
<app-person-crime-form-V3 ... [(approveValue)]="approveValue" ...>
```

ทั้งที่ component ตัวเดียวกันเพิ่งใช้ `[(approveValue)]` สำเร็จในอีก branch เดียวกันของไฟล์เดียวกัน

## Root Cause

Tag ที่พังเขียนว่า `<app-person-crime-form-V3>` (ตัว **V3 พิมพ์ใหญ่**) แต่ selector จริงของ component คือ `app-person-crime-form-v3` (ตัวเล็กทั้งหมด) — เป็น typo เคสตัวอักษรที่มีอยู่แล้วในโค้ดมาก่อน

- ตอนก่อนหน้านี้ binding เป็นแบบ one-way ธรรมดา (`[approveValue]="approveValue"`) **ไม่ error** เพราะตอน render จริงใน browser, HTML custom element tag จะถูก lowercase โดยอัตโนมัติเสมอ (`app-person-crime-form-V3` → `app-person-crime-form-v3`) ทำให้ runtime resolve component ถูกต้องอยู่ดี
- แต่ `ngtsc` (Angular AOT template type checker ที่ทำงานตอน `ng build`) เช็ค selector แบบ **case-sensitive** ตรงจากตัวอักษรใน source template ไม่ได้ lowercase ก่อนเทียบ — พอเจอ `V3` ตัวใหญ่ก็หา component ที่ selector ตรงกันไม่เจอ
- เมื่อ type checker "ไม่รู้จัก" element นี้ว่าเป็น Angular component มันจึง fallback ไปตีความ `(approveValueChange)` เป็น **native DOM custom event listener** แทน ซึ่ง native event handler มี `$event` เป็น type `Event` เสมอ → พอ auto-generate `this.approveValue = $event` จาก two-way binding sugar เลย type ไม่ตรง (`Event` ≠ `string`)

พูดง่าย ๆ: bug เดิมซ่อนอยู่เงียบ ๆ เพราะ browser ใจดีกว่า compiler — พอเปลี่ยนมาใช้ฟีเจอร์ที่ต้อง type-check เข้มขึ้น (two-way binding) ถึงโผล่เป็น hard error

## Fix

แก้ tag ให้ตรงกับ selector จริงทุกตัวอักษร (lowercase ทั้งหมด):

```html
<!-- ❌ ผิด: case ไม่ตรงกับ selector -->
<app-person-crime-form-V3 [(approveValue)]="approveValue"></app-person-crime-form-V3>

<!-- ✅ ถูก: ตรงกับ @Component({ selector: 'app-person-crime-form-v3' }) เป๊ะ -->
<app-person-crime-form-v3 [(approveValue)]="approveValue"></app-person-crime-form-v3>
```

## Prevention

- เขียน custom element tag name ให้ตรงกับ `selector` ใน `@Component()` **ทุกตัวอักษรเป๊ะ** แม้ browser จะ tolerant เรื่อง case ก็ตาม
- ถ้าเจอ `TS2322: Type 'Event' is not assignable to type 'X'` บน binding ของ custom component ที่ควรจะมี Output type ตรงอยู่แล้ว ให้สงสัยว่า **selector สะกด/case ไม่ตรง** เป็นอันดับแรก ก่อนไปแก้ type ของ Output
- อย่าเชื่อว่า "component เดิม render ปกติมาตลอด" แปลว่า tag name เขียนถูก — ต้อง verify กับ `selector:` ในไฟล์ `.component.ts` จริง โดยเฉพาะก่อนเพิ่ม typed binding ใหม่

## Engineering Principle

Browser DOM parsing กับ Angular AOT template type checker ใช้กติกาเรื่อง case ไม่เหมือนกัน — runtime ที่ "ทำงานได้" ไม่ได้แปลว่า source ถูกต้องตาม contract จริง บาง bug จะไม่โผล่จนกว่าจะมีเครื่องมือที่เข้มงวดกว่า (เช่น strict type checking) มาเจอเข้า

## Interview Question

**English Question:** A component tag with a case mismatch (`<app-foo-V3>` vs selector `app-foo-v3`) renders fine at runtime but fails Angular's AOT build with a type error. Why does it render but not compile?

**English Answer:** Browsers lowercase custom element tag names during HTML parsing, so the runtime DOM always resolves to the correct component regardless of the case used in the template source. Angular's AOT template type checker (`ngtsc`), however, matches selectors against the literal source text and is case-sensitive — if the case doesn't match, it can't find the component, so it falls back to treating the binding as a native DOM event (typed `Event`), causing a type mismatch against the component's actual typed `@Output()`.

**Thai Question:** tag ของ component ที่สะกดตัวพิมพ์ไม่ตรงกับ selector (`<app-foo-V3>` vs selector `app-foo-v3`) render ได้ปกติตอนรันจริง แต่ `ng build` (AOT) กลับ error เรื่อง type ทำไมถึงเป็นแบบนั้น

**Thai Answer:** Browser lowercase ชื่อ custom element tag เองเสมอตอน parse HTML runtime เลย resolve component ถูกต้องไม่ว่า source จะเขียนตัวพิมพ์แบบไหน แต่ `ngtsc` (ตัว type checker ตอน build) เทียบ selector จากตัวอักษรใน source ตรง ๆ แบบ case-sensitive พอไม่ตรงก็หา component ไม่เจอ แล้ว fallback ไปตีความ binding เป็น native DOM event (type `Event`) แทน ทำให้ type ไม่ตรงกับ Output จริงที่ควรจะเป็น

**Thai Explanation:** เป็นตัวอย่างที่ดีของ "runtime ไม่ error ไม่ได้แปลว่า source ถูก" — compiler ที่เข้มงวดกว่า (strict type-checked binding) จะจับ bug ที่ browser มองข้ามได้

Related: [[Output Not Wired Across Nested Component Chain]], [[Duplicate Component Registration Checklist]]

Source: [[2026-07-06]]
