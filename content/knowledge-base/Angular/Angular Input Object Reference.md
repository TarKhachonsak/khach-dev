# Angular Input Object Reference

## What happened?

Angular child component ที่รับ object ผ่าน `@Input()` สามารถแก้ property แล้ว parent เห็นค่าที่เปลี่ยนโดยไม่ต้อง `@Output()`

## Why did it happen?

JavaScript object ถูกส่งด้วย reference ไม่ใช่ clone ดังนั้น parent และ child จึงชี้ไปยัง object เดียวกันใน memory

## How was it fixed?

ใช้ shared mutable form model อย่างตั้งใจใน form component และให้ child update field ใน object เดิม

```typescript
@Input() formData: any;

onOfficerChanged = (e: any) => {
  this.formData.RECORDER_ID = e.value;
};
```

## ⚠️ Anti-Pattern: Spread ใน @Input property ตัด Reference

```typescript
// ❌ Bug: สร้าง object ใหม่ → ตัด reference จาก parent
private setDefaultRole() {
  this.formData = { ...this.formData, OFFICER_ROLE_ID: roleId };
  // หลังจากนี้ this.formData ≠ parent's _formData
  // DevExtreme bind ไปที่ object ใหม่ → parent ไม่เห็นค่าที่เลือก
}

// ✅ Fix: mutate property ตรงๆ
private setDefaultRole() {
  this.formData.OFFICER_ROLE_ID = roleId;
}
```

**Symptom:** field ที่ user กรอกใน child form ถูก save เป็น 0 หรือ null

## ⚠️ Anti-Pattern: ใช้ `@Input()` ที่ bind ครั้งเดียวเป็นค่า "ล่าสุด"

```typescript
// Template: bind ครั้งเดียวตอน component init เท่านั้น
// <formio [submission]="formioSubmission" (change)="onFieldChange($event)"></formio>

@Input() formioSubmission: any;   // ไม่เคยถูก reassign ที่ไหนในไฟล์เลย
_formDataio: any;                 // ค่าจริงที่ user แก้ไข อัปเดตผ่าน event

onFieldChange(event: any) {
  this._formDataio = { ...event.data };   // ค่าล่าสุดอยู่ตรงนี้
}

// ❌ Bug: ใช้ @Input() (stale snapshot) แทนค่าที่ user แก้จริง
const params = {
  formioForm: this.formioSubmission,   // ค่านิ่งตั้งแต่ตอน init
};

// ✅ Fix: ใช้ field ที่อัปเดตผ่าน event แทน
const params = {
  ...this._formDataio,
};
```

**Symptom:** ข้อมูลที่ user แก้ไขใน sub-form (formio/child widget) หายไปตอน save แม้ UI แสดงค่าถูกต้อง เพราะ payload อ่านจาก `@Input()` ที่ไม่มีใคร reassign แทนที่จะอ่านจาก field ที่ event handler อัปเดตอยู่จริง

**วิธีเช็ค:** grep หาทุกจุด assignment (`this.xxx =`) ของ `@Input()` ตัวนั้นในไฟล์ ถ้าไม่เจอเลยนอกจาก decorator แปลว่ามันเป็นค่านิ่งตลอด lifetime ของ component — ห้ามใช้เป็น source of truth ของ "ค่าปัจจุบัน"

Related: [[Stale Input Snapshot vs Live Change-Tracked State]]

## เมื่อไหรควรใช้ Spread (New Ref)

| สถานการณ์ | วิธีที่ควรใช้ |
|---|---|
| child แก้ค่า → parent save โดยตรง | mutate ตรงๆ |
| child มี local form (dialog/modal) | spread + `@Output()` emit กลับ |
| parent ใช้ OnPush | spread + `@Output()` |
| ต้องการ snapshot ก่อน edit | spread เก็บเป็น backup |

## How can it be prevented?

- ถ้าต้องการ one-way data flow ให้ clone object หรือ emit event กลับ parent
- ถ้าตั้งใจแชร์ mutable form model ให้ document contract ของ component
- ระวัง [[Change Detection]] โดยเฉพาะกรณีเปลี่ยน nested property
- **ห้าม reassign `this.inputProp = {...this.inputProp}` ใน child** เว้นแต่มี @Output

## Engineering Principle

Reference sharing เป็นเครื่องมือได้ถ้า component boundary ชัดเจน แต่จะกลายเป็น bug ถ้า child mutate data โดย parent ไม่รู้ contract

## Interview Question

**English Question:** When an Angular child component mutates an object received through `@Input()`, why can the parent see the change without `@Output()`?

**English Answer:** Because JavaScript objects are passed by reference. Both parent and child reference the same object, so mutating a property changes the shared object.

**Thai Explanation:** `@Input()` ไม่ได้ clone object ให้อัตโนมัติ ถ้า child แก้ property ของ object เดิม parent จึงเห็นค่าเปลี่ยนตามไปด้วย

Related: [[DevExtreme Callback Context]], [[Restore UI State After Load Data]], [[Over-Mapping All Fields to TEMP Suffix]], [[Stale Input Snapshot vs Live Change-Tracked State]]

อ้างอิงจาก: [[2026-07-09]]
