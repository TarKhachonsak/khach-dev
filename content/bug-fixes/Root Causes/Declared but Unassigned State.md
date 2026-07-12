# Declared but Unassigned State

## What happened?

เพิ่ม feature ใหม่ (guard ห้ามเปลี่ยนหน้าถ้ายังไม่เลือก `approveValue`) ใน component ที่ copy มาจากไฟล์อื่น แล้ว guard นั้น block ทุกครั้งไม่ว่าจะเลือกค่าอะไรก็ตาม

## Root Cause

`_taskFormCode` และ `approveKey`/`approveValue` ถูก **ประกาศ field ไว้ แต่ไม่เคย assign ค่าที่ไหนเลย** ใน component (เหลือเป็น `undefined` เสมอ) โค้ดส่วนอื่นที่ "ใช้" ตัวแปรเหล่านี้ (เช่น `onPreview`) ก็ไม่เคยทำงานถูกมาก่อนเช่นกัน แต่ไม่มีใครสังเกตเพราะไม่ throw error — จนกระทั่งมี logic ใหม่ (page guard) ที่ต้องพึ่งพาค่านี้จริงจัง bug ที่ซ่อนอยู่จึงเห็นผลชัดเจน

โค้ดแบบนี้มักเกิดจากการ copy component ทั้งไฟล์เป็น template สำหรับ task ใหม่ (form-395 → form-398 ในอีกเคสหนึ่ง) แล้ว method ที่ควร assign ค่า (`loadFormioByFormKey`, `onFieldChange`) ถูกตัดทอนหรือ refactor แบบไม่ครบระหว่างทาง

## How was it fixed?

ไล่ตาม chain ของตัวแปรทั้งหมดที่ logic ใหม่ต้องพึ่งพา ก่อนเขียน logic นั้น:

```typescript
// 1. set _taskFormCode ตอนโหลด formio สำเร็จ
if (res?.IsSuccess && res?.Value?.length) {
  this._taskFormCode = res.Value[0].formCode;
  this.formio = JSON.parse(res.Value[0].formJson ?? '{}');
}

// 2. set approveKey/approveValue ทุกครั้งที่ formio data เปลี่ยน
onFieldChange(event: any) {
  if (event && event.data) {
    this._formDataio = { ...event.data };
    if (this._taskFormCode) {
      const formKey = this._taskFormCode.toLocaleLowerCase();
      this.approveKey = `${formKey}_approve`;
      this.approveValue = this._formDataio?.[this.approveKey];
    }
  }
}
```

## Prevention

- ก่อนเพิ่ม logic ที่ "เชื่อ" ว่า field หนึ่งมีค่า ให้ grep หาทุกจุดที่ assign ค่าให้ field นั้นในไฟล์ก่อนเสมอ — ถ้าไม่เจอจุด assign เลย แปลว่ามี bug ซ่อนอยู่แล้ว
- field ที่ประกาศ type ไว้ (`x: string`) แต่ไม่มี default value และไม่เคย assign คือสัญญาณเตือนที่ตรวจสอบได้ด้วย grep ก่อน review
- เวลา copy component ทั้งไฟล์เป็นต้นแบบ (duplicate-to-extend) ต้อง diff กับไฟล์ต้นทาง (365 vs 395 ในเคสนี้) เพื่อหา method ที่ตกหล่นระหว่างทาง

## Engineering Principle

> Bug ที่ไม่ throw error (state เงียบๆ เป็น `undefined`) จะไม่ถูกจับจนกว่าจะมี logic ใหม่ไปพึ่งพามัน — เวลา debug logic ใหม่ที่ "ไม่ทำงานเลย" ให้สงสัย state ที่มันอ่านค่าก่อน ไม่ใช่ logic ที่เพิ่งเขียน

Related: [[ApproveValue Not Restored After Draft Load]], [[Restore UI State After Load Data]], [[Multi-Page Form Stepper Pattern]], [[Property Used but Never Declared]]

อ้างอิงจาก: [[2026-07-02]]
