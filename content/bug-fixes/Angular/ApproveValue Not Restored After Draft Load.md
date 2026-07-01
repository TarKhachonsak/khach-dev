# ApproveValue Not Restored After Draft Load

## What happened?

โหลด draft แล้ว section ที่ขึ้นกับ approval state หาย เพราะ state ใน component ยังไม่ได้ restore

## Root Cause

component set `approveValue` จาก form event เท่านั้น แต่การ hydrate draft จาก backend ไม่ guaranteed ว่าจะ trigger event นั้น

## Fix

restore `approveValue` จาก saved form data หลัง load data สำเร็จ

```typescript
const approveKey = `${this._taskFormCode.toLocaleLowerCase()}_approve`;
this.approveValue = this._formData?.[approveKey] ?? this._formDataio?.[approveKey];
```

## Prevention

- แยก function restore state สำคัญหลัง load data
- อย่าพึ่ง UI event เป็นแหล่งข้อมูลเดียวหลัง hydrate
- test case load draft ต้องครอบคลุม state A, B และ undefined

Related: [[Restore UI State After Load Data]], [[Boolean Condition Truth Table]]
