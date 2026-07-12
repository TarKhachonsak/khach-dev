# Missing Input Binding Causes Undefined Crash

## What happened?

`AccuserFormViewComponent` (`app-accuser-form-view`) ใช้ `formData.CONTACT_FLAG` ตรงๆ ในหลายจุดของ template (ไม่มี `?.`) แต่เมื่อเรียกใช้จาก `form-58-officer-task.component.html` กลับไม่ bind `[formData]` เข้าไปเลย (bind แค่ `[dataSource]`) ทำให้เกิด:

```
TypeError: can't access property "CONTACT_FLAG", ctx_r22.formData is undefined
```

## Why did it happen?

```typescript
@Input() formData: any; // ไม่มีค่า default
```

component ตัวนี้ถูกใช้ซ้ำจากหลาย parent (`form-16`, `form-58`, `form-63`, `form-108`) โดยแต่ละที่ bind input ไม่เหมือนกัน — `form-63` bind `[formData]="_formData"` ครบ แต่ `form-58`/`form-16`/`form-108` ไม่ได้ bind เลย เพราะจุดใช้งานเดิมตั้งใจให้เป็น read-only list (ใช้แค่ `dataSource` แสดง grid) แต่ template ภายในถูกออกแบบมาสำหรับทั้ง grid + edit form (ที่ต้องพึ่ง `formData`) พร้อมกัน — ไม่มีการแยก responsibility ให้ชัดว่า component นี้ "ใช้แสดง list อย่างเดียวได้" หรือ "ต้องมี formData เสมอ"

## How was it fixed?

1. ระบุ pattern ที่ถูกต้องจาก sibling component (`app-accuser-form`) ในไฟล์เดียวกัน ซึ่งมี `(editAccuser)="onEditAccuser($event)"` bind คู่กับ `[formData]="selectedAccuser"` อยู่แล้ว — `onEditAccuser(data)` ฝั่ง parent เซ็ต `this.selectedAccuser = { ...data }` ตอนกดปุ่ม edit ใน grid
2. เพิ่ม `[formData]="selectedAccuser"` ให้ `app-accuser-form-view` ทั้ง 2 จุดที่ขาด — ให้ตรงกับตัวแปรที่ `onEditAccuser()` set ค่าจริง (ไม่ใช่ `_formData` ของทั้งฟอร์ม ซึ่งเป็นความผิดพลาดรอบแรกที่ bind ผิดตัวแปร)

```html
<!-- ❌ ไม่ bind formData เลย -->
<app-accuser-form-view [Viewmode]="Viewmode" [dataSource]="_dsROD_FIR_TXN_PERSON_REPORT"
  (editAccuser)="onEditAccuser($event)"></app-accuser-form-view>

<!-- ✅ bind กับตัวแปรที่ onEditAccuser() set ค่าจริง -->
<app-accuser-form-view [formData]="selectedAccuser" [Viewmode]="Viewmode"
  [dataSource]="_dsROD_FIR_TXN_PERSON_REPORT" (editAccuser)="onEditAccuser($event)"></app-accuser-form-view>
```

## How can it be prevented?

- ถ้า `@Input()` ถูกใช้ตรงๆ ใน template โดยไม่มี safe-navigation (`?.`) ต้องใส่ default value กันพัง: `@Input() formData: any = {};`
- เมื่อ component ถูกเรียกใช้จากหลาย parent ให้ grep หา selector ทุกจุดที่ใช้งานจริง (`grep -rn "app-xxx"`) แล้วเทียบว่า input ที่ template ต้องการถูก bind ครบทุกจุดหรือไม่ — อย่าเชื่อว่า parent ล่าสุดที่แก้ถูกต้องแล้ว parent อื่นก็ต้องถูกด้วย
- ถ้า component มี 2 โหมดในตัวเอง (list-only vs list+edit) ให้แยก `@Input()` ที่จำเป็นเฉพาะแต่ละโหมดออกจากกัน หรือ throw/console.warn เมื่อโหมด edit ถูกเปิดใช้โดยไม่มี `formData`

## Engineering Principle

`@Input()` ที่ไม่มี default value คือสัญญา (contract) implicit ว่า "parent ทุกตัวต้อง bind ค่านี้เสมอ" — เมื่อ component ถูก reuse ข้าม parent หลายตัว สัญญานี้ยิ่งเสี่ยงหลุดง่าย เพราะไม่มี compiler บังคับ (TypeScript `strict` ก็ไม่เช็ค template binding ข้าม component) ต้องอาศัยการ grep เทียบทุก call site แทน

## Interview Question

**English Question:** An Angular child component works fine when used by one parent but throws `undefined` errors when reused by another parent. What's the likely cause and how do you prevent it?

**English Answer:** The child likely accesses an `@Input()` property directly in the template without a safe-navigation operator or default value. If a new parent forgets to bind that input, Angular doesn't error at compile time — it silently passes `undefined`, and the template crashes at runtime. Prevent it by giving the `@Input()` a default value (e.g. `= {}`), using `?.` in the template, or auditing every call site when a shared component is reused.

**Thai Explanation:** Angular ไม่บังคับให้ parent bind `@Input()` ทุกตัว (ไม่มี required input แบบ compile-time check ใน Angular 16) ถ้า child เข้าถึง property ของ input นั้นตรงๆ โดยไม่มี default หรือ `?.` แล้ว parent ที่ reuse component ลืม bind จะพังทันทีตอน runtime — ต้องป้องกันด้วย default value หรือ safe-navigation และเช็คทุกจุดที่เรียกใช้ component ซ้ำ

Related: [[Angular Input Object Reference]], [[DevExtreme dx-form Rendering Rules]]

Source: [[2026-07-08]]
