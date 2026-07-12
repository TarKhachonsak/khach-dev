# Bug: ใช้ @Input Snapshot ที่นิ่งแทนค่าที่ user แก้ไขจริง

## What Happened?

`Form52OfficerTaskComponent` — payload ที่ส่งไป backend ตอนกด "บันทึก" (SD) หรือ "ยืนยัน" (AP) ไม่มีข้อมูลจากฟอร์มย่อย (formio) ที่ user เพิ่งแก้ไข ทั้งที่ UI แสดงค่าถูกต้อง

## Root Cause

Component มีข้อมูลเดียวกันในทางความหมาย แต่เก็บอยู่ 2 ที่ ด้วย 2 กลไกคนละแบบ:

```typescript
@Input() formioSubmission: any;   // ① bind ครั้งเดียวตอน parent ส่งเข้ามา
_formDataio: any;                 // ② อัปเดตทุกครั้งที่ user แก้ไข ผ่าน event
```

```html
<!-- [submission] ผูกครั้งแรกตอน render — ไม่ใช่ two-way binding -->
<formio #formRef [form]="formio" [submission]="formioSubmission"
        (change)="onFieldChange($event)"></formio>
```

```typescript
onFieldChange(event: any) {
  this._formDataio = { ...event.data };  // ← ค่าล่าสุดจริง ๆ อยู่ตรงนี้
}
```

โค้ด build payload ใช้ตัวที่ ① (`formioSubmission`) ซึ่งไม่เคยถูก reassign เลยในไฟล์ทั้งไฟล์ (grep `this.formioSubmission =` ไม่เจอ) — เป็นแค่ค่าตั้งต้นตอน component ถูกสร้าง ส่วนตัวที่ ② (`_formDataio`) ที่มีค่าจริงกลับถูก comment ทิ้งไว้ไม่ได้ใช้:

```typescript
const params: any = {
    ...this._formData,
    //...this._formDataio,        // ❌ comment ทิ้งไว้ — ค่าจริงหายไป
    formioForm: this.formioSubmission,  // ❌ ค่านิ่งตั้งแต่ init
    ...
};
```

## Fix

```typescript
const params: any = {
    ...this._formData,
    ...this._formDataio,          // ✅ ใช้ค่าล่าสุดจาก event แทน
    formioForm: this.formioSubmission,
    ...
};
```

## How to Prevent

- ถ้า component รับข้อมูลผ่าน `@Input()` แบบ one-time bind (ไม่ใช่ reactive form) **ห้ามถือว่ามันคือ "ค่าปัจจุบัน"** — มันคือค่า ณ ตอน render เท่านั้น
- ก่อนใช้ field ไหนเป็น source of truth ให้ grep หาทุกจุด assignment (`this.field =`) ของ field นั้นก่อนเสมอ ถ้าไม่เจอเลยนอกจาก `@Input()` decorator แปลว่ามันไม่เคยถูกอัปเดต
- ถ้ามี field คู่กัน (`@Input()` snapshot + event-tracked field) ให้ตั้งชื่อให้ต่างกันชัดเจน และ comment กำกับว่าตัวไหนคือ source of truth

## Engineering Principle

> `@Input()` ที่ bind แบบ one-time (เช่น `[submission]` ของ third-party form widget) เป็นค่า ณ เวลา render ไม่ใช่ live reference — ค่าที่ user แก้ไขจริงต้องตามหาจาก event handler ที่ widget ยิงออกมา ไม่ใช่จาก `@Input()` เดิม

Related: [[Angular Input Object Reference]], [[Restore UI State After Load Data]]

อ้างอิงจาก: [[2026-07-09]]
