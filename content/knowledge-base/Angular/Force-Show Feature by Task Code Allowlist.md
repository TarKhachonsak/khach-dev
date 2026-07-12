# Force-Show Feature by Task Code Allowlist

## What It Is

Pattern สำหรับควบคุมว่า feature ย่อยใน shared component (เช่น ปุ่ม/ช่อง input หนึ่งอัน) ควรแสดงหรือไม่ โดยอิงจาก `taskFormCode`/flow code ของผู้เรียกใช้ แทนที่จะอิงจากข้อมูลที่มีอยู่แล้ว (เช่น "มีพิกัดอยู่แล้วหรือยัง")

## The Problem

`CrimeSceneLocationRedesignComponent` (`app-crime-scene-location-redesign`) ถูกเรียกใช้จาก 5 host component ครอบคลุมหลาย flow_task เดิม `showCoordinatePicker` getter เขียนว่า:

```typescript
get showCoordinatePicker(): boolean {
  return this.forceShowCoordinatePicker || !!(this.formData?.INVESTIGATION_ADDR_LATITUDE && this.formData?.INVESTIGATION_ADDR_LONGITUDE);
}
```

ปุ่มโชว์เฉพาะ flow ที่ bind `forceShowCoordinatePicker=true` เข้ามา (มีแค่ form-104 เดียว) หรือ record มีพิกัดอยู่แล้วเท่านั้น — flow อื่นที่ยังไม่เคยมีพิกัดมาก่อนเลยไม่มีทางเห็นปุ่มนี้ ทั้งที่ทุก flow ควรมีสิทธิ์ใช้งานเหมือนกัน

## Two Competing Fixes (เกิดขึ้นจริงในโปรเจกต์นี้)

**แนวทาง A — Unconditional (เลือกใช้ก่อน, 2026-07-07):**

```typescript
get showCoordinatePicker(): boolean {
  return true;
}
```

ใช้เมื่อ **ทุก consumer ที่มีอยู่จริง** (เช็คจาก grep การเรียกใช้ selector) ต้องการ behavior เดียวกันหมด — ไม่ต้องมี list ให้ maintain เลย เป็นทางเลือกที่ maintain ง่ายที่สุดถ้า requirement ครอบคลุมทุกที่จริงๆ

**แนวทาง B — Allowlist ต่อ flow code (มาทีหลัง, override ทับ A ในวันที่ 2026-07-08 โดย TarKhachonsak เอง — ไม่ใช่เพื่อนร่วมทีมตามที่เข้าใจผิดไว้เดิม):**

```typescript
private static readonly FORCE_SHOW_COORDINATE_FLOW_CODES = [
  'FLOW_01_TASK_104', 'FLOW_02_TASK_104', 'FLOW_02_TASK_375',
  'FLOW_02_TASK_376', 'FLOW_02_TASK_063', 'FLOW_04_TASK_061'
];

get showCoordinatePicker(): boolean {
  const forced = this.forceShowCoordinatePicker
    || CrimeSceneLocationRedesignComponent.FORCE_SHOW_COORDINATE_FLOW_CODES.includes(this.taskFormCode);
  return forced || this.hasCoordinates;
}
```

ใช้เมื่อมี flow บางกลุ่มที่ **ไม่ควร** เห็น feature นี้ (เช่น flow ที่ workflow ยังไม่ถึงขั้นตอนกรอกพิกัด) — ต้องแลกกับการดูแล list ทุกครั้งที่มี flow ใหม่มาใช้ component

## Why It Matters

- ถ้า requirement จริงคือ "ทุก consumer ต้องการเหมือนกัน" การเขียน allowlist เป็นการเพิ่ม abstraction ที่ไม่จำเป็น (ผิด "ไม่ต้องออกแบบเผื่ออนาคตที่ยังไม่เกิด")
- แต่ถ้ามี consumer บางตัวที่ต้องการ behavior ต่างออกไปจริง allowlist คือทางเดียวที่ถูกต้อง — การเขียน `return true` แบบไม่เช็คให้ครบจะไปเปิด feature ผิดที่โดยไม่ตั้งใจ
- **บทเรียนสำคัญ**: ก่อนเลือกแนวทาง ต้องยืนยัน scope กับผู้ที่รู้ business requirement จริง (ไม่ใช่เดาจาก use case ที่เห็น ณ ตอนนั้น) เพราะสองการตัดสินใจ (07-07 vs 07-08) ของคนเดียวกันตอบคำถามนี้ไม่ตรงกัน ทำให้เกิดการ override ทับตัวเองเป็น churn ภายใน 1 วัน — สะท้อนว่าตอนตัดสินใจ A ยังไม่ได้ grep/ยืนยัน requirement ให้ครบก่อนเขียนโค้ด

## Anti-pattern

```typescript
// ❌ เขียน unconditional true ทั้งที่ยังไม่ confirm ว่าทุก consumer ต้องการจริง
get showFeature(): boolean { return true; }

// ❌ เขียน allowlist ทั้งที่ requirement บอกว่า "ทุกที่ต้องการเหมือนกัน" — เพิ่ม maintenance โดยไม่จำเป็น
private static readonly ALLOWED_CODES = [...];
```

Related: [[Cross-Task Decision via Dynamic Flow Key]], [[Check Recent Commits Before Fixing Shared Component]]

Source: [[2026-07-07]], [[2026-07-08]]
