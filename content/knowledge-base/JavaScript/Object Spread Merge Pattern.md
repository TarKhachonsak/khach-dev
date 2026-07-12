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

## Note on Timing — Spread คัดลอกค่า ณ เวลานั้น ไม่ track การเปลี่ยนแปลงทีหลัง

```typescript
const params = { ...this._formData };   // copy ค่า PAYMENT_DUE_DAY = 20 ตอนนี้
await someAsyncDialog();                // ระหว่างรอ dialog มีโค้ดอื่นไป set
                                         // this._formData.PAYMENT_DUE_DAY = 15
// params.PAYMENT_DUE_DAY ยังคงเป็น 20 — primitive ถูก copy ไปแล้ว ไม่ผูกกับ source อีก
```

มีประโยชน์ตอน debug อาการ "ค่าที่ log ตอน build payload ถูก แต่ค่าที่ยิงจริงผิด" — ถ้า payload ถูก spread ไว้ก่อนจุดที่ค่าอาจเปลี่ยน (เช่นก่อน `await` dialog) primitive fields จะ "ล็อก" ค่าไว้แล้ว ไม่ใช่สาเหตุที่ค่าเพี้ยน ต้องหาสาเหตุจากจุดอื่น (เช่นตัวแปรที่ใช้ผิดตัว ไม่ใช่ timing ของ spread)

## Note on Nested Objects

Spread merge ทำแค่ **shallow copy** — ถ้า property เป็น nested object จะ share reference

```typescript
const a = { x: { y: 1 } };
const b = { x: { z: 2 } };
const merged = { ...a, ...b };
// merged.x === { z: 2 } — nested x จาก a หายไป!
```

Related: [[FormData Overwritten by Double Assignment]], [[Angular Input Object Reference]], [[Array.isArray Guard on Wrong Variable Silently Drops Data]]

อ้างอิงจาก: [[2026-07-09]]
