---
tags: [angular, lifecycle, async, pattern]
date: 2026-06-30
---

# Fix Function Called in Wrong Lifecycle Phase

## ปัญหา

เรียกฟังก์ชันที่ depend on async data ใน `setTimeout` ร่วมกับ function ที่ load data — ข้อมูลยังไม่มาตอนเรียก

```typescript
// ❌ ผิด — onLoadNewAllegation รันทันที แต่ _formData ยังว่างอยู่
setTimeout(() => {
    this.LoadDataCitizenSQL();   // async
    this.onLoadNewAllegation();  // data ยังไม่มา!
}, 1000);
```

## วิธีแก้

ย้ายการเรียกเข้า subscribe callback หลัง data ถูก set แล้ว

```typescript
// ✅ ถูก
LoadDataCitizenSQL() {
    this.service.Get(id).subscribe((_) => {
        this._formData = { ...maxFlagRow };  // set ข้อมูลก่อน
        this.onLoadNewAllegation();          // เรียกหลัง set แล้ว ✓
    });
}
```

## หลักการ

**"Depend on data → call inside the callback that produces that data"**

อย่าสมมติว่า `setTimeout` delay นานพอ — async callback เป็นที่เดียวที่การันตีได้ว่าข้อมูลพร้อม

## Interview Question

> Why is using setTimeout to wait for async data considered an anti-pattern?

setTimeout ไม่การันตี timing — ถ้า network ช้า หรือ load หนัก อาจทำงานก่อนข้อมูลมา ทางที่ถูกคือเรียกใน `.subscribe()` หรือ `.then()` โดยตรง

## Related

- [[Angular Lifecycle Hooks — @ViewChild Timing]]
- [[Function Reference Without Parentheses]]
- [[Angular and DevExtreme Interview Questions]]
- [[2026-06-30]]
