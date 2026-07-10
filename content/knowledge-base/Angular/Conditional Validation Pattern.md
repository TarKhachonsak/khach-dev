# Conditional Validation Pattern

## What It Is

การ validate form เฉพาะเมื่อเงื่อนไข workflow บางอย่างเป็นจริง แทนที่จะ validate ทุกกรณีเสมอ

## Pattern

```typescript
validate(): boolean {
  const checks: boolean[] = [];

  if (this.approveValue === 'A') {
    checks.push(!!this.someRequiredField);
    checks.push(!!this.anotherField);
  }

  // checks อื่นที่ต้องทำเสมอ
  checks.push(!!this.alwaysRequired);

  return checks.every(c => c);
}
```

## Why It Matters

- ลด false positive — ไม่บังคับ user กรอกข้อมูลในกรณีที่ไม่จำเป็น
- รองรับ workflow หลายสถานะ เช่น approve / reject / draft
- ง่ายต่อการอ่านและขยาย — เห็นชัดว่า field ไหน required ในสถานะไหน

## When to Use

- Form ที่มีหลาย workflow state (approve, reject, draft, pending)
- validation rule ต่างกันตาม role หรือ permission
- Field บางตัว required เฉพาะเมื่อ user เลือก option บางอย่าง

## Anti-pattern

```typescript
// ❌ validate ทุก field เสมอแม้ไม่จำเป็น
validate(): boolean {
  return !!this.someField && !!this.approveSpecificField;
  // approveSpecificField ถูก check แม้ approveValue ไม่ใช่ 'A'
}
```

## Real Example (BMA ROD Project)

บน `Form19OfficerTaskComponent` — field บางตัวต้อง required เฉพาะเมื่อเจ้าหน้าที่เลือก approve (`approveValue === 'A'`) ไม่ใช่ตอน reject

อีกตัวอย่างใน shared validate helper (`helper-form-inspection-location.ts`, `case "FLOW_05_TASK_306"`): บังคับกรอกวันที่ขยายเวลา (`PHINAI5_SUM_DATE`) เฉพาะตอน `formValue === 'A'` เท่านั้น — ก่อนหน้านี้ field ถูกซ่อน/แสดงด้วย `*ngIf` แต่ไม่มี validation รองรับ ทำให้ยืนยันข้ามไปได้ทั้งที่ยังไม่กรอกวันที่ (ดู [[Approve Value Scoped to Wrong Task]])

Related: [[Conditional Validation]], [[FormData Overwritten by Double Assignment]], [[Approve Value Scoped to Wrong Task]]
