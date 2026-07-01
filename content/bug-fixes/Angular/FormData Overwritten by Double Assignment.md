# Bug: formData ถูกเขียนทับเพราะ Assignment สองครั้งติดกัน

## What Happened?

ใน `Form19OfficerTaskComponent` มีการ assign `this._formData` สองครั้งติดต่อกัน — ครั้งแรกจาก `ROD_FIR_TXN_FORM_CSI` แล้วครั้งที่สองจาก `ROD_FIR_TXN_PHINAI_HISTORY[0]` ทำให้ข้อมูลจากแหล่งแรกหายไป

## Root Cause

```typescript
// ❌ ก่อนแก้: ข้อมูลชุดแรกถูกทับโดยชุดที่สอง
this._formData = res.data.ROD_FIR_TXN_FORM_CSI;
this._formData = res.data.ROD_FIR_TXN_PHINAI_HISTORY[0];
```

โค้ดมองไม่เห็น assignment แรก เพราะบรรทัดถัดไปเขียนทับทันที

## Fix

```typescript
// ✅ หลังแก้: merge ทั้งสอง source เข้าด้วยกัน
this._formData = {
  ...res.data.ROD_FIR_TXN_FORM_CSI,
  ...res.data.ROD_FIR_TXN_PHINAI_HISTORY[0],
};
```

## How to Prevent

- ห้ามใช้ assignment ซ้ำกับ property เดิมในบล็อกเดียวกัน
- ถ้ามีข้อมูลจากหลาย source ให้ใช้ `{ ...a, ...b }` เสมอ
- field ที่ต้องการให้ใช้จาก source ใด ให้วางทีหลังใน spread (ด้าน override)

## Engineering Principle

> Keep data transformation explicit and predictable.  
> เมื่อมี source มากกว่าหนึ่ง ให้ build ชัดเจนว่าใครมาก่อนและใครมา override

Related: [[Object Spread Merge Pattern]], [[Angular Input Object Reference]]
