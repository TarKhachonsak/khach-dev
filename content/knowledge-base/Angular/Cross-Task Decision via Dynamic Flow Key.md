# Cross-Task Decision via Dynamic Flow Key

## What It Is

Pattern สำหรับอ่านผลการตัดสินใจ (approve/reject) ของ **task ก่อนหน้า** ในสาย workflow เดียวกัน เมื่อ component ปัจจุบันมีตัวแปรชื่อเดียวกัน (`approveValue`) แต่ผูกกับคำถามคนละอันของ **task ตัวเอง** ไม่ใช่ของ task ที่ต้องการอ้างอิง

## The Problem

หลาย component ใน workflow เดียวกันใช้ pattern เดิมซ้ำกัน:

```typescript
onFieldChange(event: any) {
  const formKey = this._taskFormCode.toLocaleLowerCase();
  this.approveKey = `${formKey}_approve`; // เช่น flow_05_task_307_approve
  this.approveValue = this._formDataio?.[this.approveKey];
}
```

`approveValue` ของแต่ละ component คือคำตอบของ **คำถามใน task ตัวเอง** เท่านั้น ถ้า task ถัดไปต้องการรู้ผลของ task ก่อนหน้า การอ้าง `this.approveValue` ตรงๆ จะผิด เพราะเป็นคนละ key คนละความหมาย (บาง task มีตัวเลือกเดียวเสมอ เช่น `'A'` ตายตัว)

## Pattern

reconstruct key ของ task อื่นแบบ dynamic โดยใช้ **flow prefix** ร่วมกัน (เพราะ instance เดียวกันของ flow จะมี prefix เดียวกันเสมอ เช่น `flow_05`) แล้วต่อด้วย task number คงที่ที่รู้ว่าต้องการอ้างอิง:

```typescript
// _taskFormCode ของ component ปัจจุบัน เช่น "FLOW_05_TASK_307"
get task306ApproveValue(): string | undefined {
  const code = this._taskFormCode || this.taskCode || this.formConfig?.formCode || "";
  const flowPrefix = code.toLocaleLowerCase().match(/^(flow_\d+)_/)?.[1];
  if (!flowPrefix) return undefined;
  return this._formData?.[`${flowPrefix}_task_306_approve`];
}
```

ค่านี้อ่านจาก `_formData` (persisted record ผ่าน backendId เดียวกันทั้ง flow) ไม่ใช่จาก `_formDataio` (มาจาก `<formio>` ของ task ตัวเองเท่านั้น)

## Why It Matters

- component เดียวกันมักถูก share ใช้กับหลาย flow (01/03/04/05) — hardcode `flow_05_task_306_approve` ตรงๆ จะพังทันทีที่ flow อื่นเรียกใช้ component เดียวกัน
- คำนวณ prefix จาก `_taskFormCode` ของตัวเอง การันตีว่าจะ match กับ instance เดียวกันของ flow เสมอ โดยไม่ต้องรู้ล่วงหน้าว่ากำลังรันอยู่ใน flow ไหน

## Prerequisite

ค่าที่ต้องการอ่านต้องถูก **persist ไปยัง backend record เดียวกัน** ก่อน (ผ่าน backendId) ไม่ใช่แค่ส่งเป็น process variable ให้ workflow engine เท่านั้น — ถ้า params ตอน save ไม่ include field/key ที่ต้องการ (เช่น comment ทิ้งไว้ `//...this._formDataio`) ปลายทางจะอ่านไม่เจอค่าเลย

## Anti-pattern

```typescript
// ❌ ใช้ approveValue ของ component ปัจจุบันแทนของ task ที่ต้องการจริง
if (this.approveValue === 'A') { ... } // approveValue นี้คือคำถามของ task ตัวเอง ไม่ใช่ task ก่อนหน้า

// ❌ hardcode flow เดียว ใช้ไม่ได้กับ flow อื่นที่ share component
this._formData?.['flow_05_task_306_approve']
```

## Real Example (BMA ROD Project)

`Form06OfficerTaskComponent` (FLOW_05_TASK_307/308) ต้องแสดง radio ผลการพิจารณาตามที่เลือกไว้ใน `Form07OfficerTaskComponent` (task 306) ก่อนหน้า — ทั้งสอง component share กันข้าม flow_01/03/04/05 จึงต้องคำนวณ key แบบ dynamic แทน hardcode

Related: [[ApproveValue Not Restored After Draft Load]], [[Approve Value Scoped to Wrong Task]], [[Restore UI State After Load Data]]

Source: [[2026-07-03]]

## Update 2026-07-10 — Generalize เป็น shared helper เมื่อต้องอ้างหลาย task พร้อมกัน

`Form06OfficerTaskComponent` ต้องการอ่านผลของ **สอง** task ก่อนหน้า (`task_306_approve` และ `task_006_approve` — คนละ task number กันคนละ flow variant) โค้ดเดิมมี getter แยก 2 ตัวที่ copy-paste `flowPrefix` computation ซ้ำกันทุกบรรทัด ต่างกันแค่ suffix สุดท้าย ดึงออกเป็น helper รับ parameter:

```typescript
private getFlowApproveValue(suffix: string): string | undefined {
  const code = this._taskFormCode || this.taskCode || this.formConfig?.formCode || "";
  const flowPrefix = code.toLocaleLowerCase().match(/^(flow_\d+)_/)?.[1];
  if (!flowPrefix) return undefined;
  return this._formData?.[`${flowPrefix}_${suffix}`];
}

get task306ApproveValue(): string | undefined {
  return this.getFlowApproveValue('task_306_approve');
}

get task006ApproveValue(): string | undefined {
  return this.getFlowApproveValue('task_006_approve');
}
```

ทำให้ pattern นี้ scale ไปอ้างอิง task ก่อนหน้าเพิ่มได้ในอนาคตโดยไม่ต้อง copy logic คำนวณ `flowPrefix` ซ้ำอีก — เพิ่มแค่ getter บรรทัดเดียวต่อ task ที่ต้องการ

**ข้อควรระวังหลัง migrate:** เมื่อสร้าง getter ใหม่แทนตัวแปรเก่า (`approveValue`) ต้องกวาดทุกจุดที่เคยใช้ตัวแปรเก่าให้ครบ — เจอ instance ที่ตกหล่นจริงระหว่าง refactor นี้ ดู [[Approve Value Scoped to Wrong Task]] (Update 2026-07-10)

Source เพิ่มเติม: [[2026-07-10]]
