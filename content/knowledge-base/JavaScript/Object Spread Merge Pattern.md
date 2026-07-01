# Object Spread Merge Pattern

## What It Is

การรวม property ของ object หลายตัวเข้าด้วยกันโดยใช้ spread operator (`...`) โดยไม่ mutate object ต้นฉบับ

## Basic Syntax

```typescript
const merged = { ...base, ...override };
```

- property ใน `override` จะทับ property ที่ชื่อเดียวกันใน `base`
- ลำดับ spread มีผล — วางไว้ด้านขวาคือ override

## When to Use

- รวมข้อมูลจาก API หลาย endpoint ก่อนส่งให้ form
- merge default config กับ user config
- สร้าง form initial state จากหลาย source

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Assignment ซ้ำสองครั้งบนตัวแปรเดิม | ใช้ spread merge ใน expression เดียว |
| สลับลำดับ spread ผิดทำให้ field สำคัญถูก override | คิดก่อนว่า field ไหนควร "ชนะ" แล้ววางทีหลัง |
| Merge แบบ shallow ทั้งที่ต้องการ deep merge | ใช้ `structuredClone()` หรือ library สำหรับ nested object |

## Real Example (BMA ROD Project)

```typescript
// ❌ ก่อน: ข้อมูล CSI หายไปเพราะถูกทับ
this._formData = res.data.ROD_FIR_TXN_FORM_CSI;
this._formData = res.data.ROD_FIR_TXN_PHINAI_HISTORY[0];

// ✅ หลัง: merge ทั้งสอง source
this._formData = {
  ...res.data.ROD_FIR_TXN_FORM_CSI,
  ...res.data.ROD_FIR_TXN_PHINAI_HISTORY[0],
};
```

## Note on Nested Objects

Spread merge ทำแค่ **shallow copy** — ถ้า property เป็น nested object จะ share reference

```typescript
const a = { x: { y: 1 } };
const b = { x: { z: 2 } };
const merged = { ...a, ...b };
// merged.x === { z: 2 } — nested x จาก a หายไป!
```

Related: [[FormData Overwritten by Double Assignment]], [[Angular Input Object Reference]]
