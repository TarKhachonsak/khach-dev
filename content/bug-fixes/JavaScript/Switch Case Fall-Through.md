# Switch Case Fall-Through

## What happened?

validate function `getDetailPhinai5` ถูกเรียกใน case `FLOW_04_TASK_007` ทั้งที่ไม่ได้ config ไว้

## Why did it happen?

JavaScript switch-case มี **fall-through** โดย default — ถ้าไม่มี `break` หรือ `return` จะวิ่งต่อไปยัง case ถัดไป

case นี้มี if-else เช็ค `formValue === 'A'` และ `formValue === 'B'` ซึ่งแต่ละ branch มี `return` แต่เมื่อ `formValue` เป็นค่าอื่น (เช่น `undefined`) จะไม่ hit branch ไหนเลย และ fall-through ไปยัง case ถัดไปที่เรียก `getDetailPhinai5`

```typescript
case "FLOW_04_TASK_007": {
  if (formValue === 'A') {
    return ...;
  } else if (formValue === 'B') {
    return ...;
  }
  // ← ไม่มี return ที่นี่ → fall-through!
}
case "FLOW_01_TASK_008": // เรียก getDetailPhinai5
```

## How was it fixed?

เพิ่ม `return { ok: true }` เป็น fallback หลัง if-else

```typescript
case "FLOW_04_TASK_007": {
  if (formValue === 'A') {
    return ...;
  } else if (formValue === 'B') {
    return ...;
  }
  return { ok: true }; // ← กัน fall-through
}
```

## How to prevent?

- เมื่อ case block มี if-else ที่ไม่ครอบคลุมทุก value ให้เพิ่ม `return` หรือ `break` ปิดท้ายเสมอ
- ใช้ linting rule `no-fallthrough` (ESLint) เพื่อ detect อัตโนมัติ

## Engineering Principle

> ทุก execution path ใน switch-case ต้องมี explicit exit (`return` / `break`) ไม่ควรพึ่ง implicit fall-through โดยไม่ตั้งใจ

Related: [[Boolean Condition Truth Table]], [[Angular and DevExtreme Interview Questions]]