---
tags: [angular, javascript, bug, common-mistake]
date: 2026-06-30
---

# Function Reference Without Parentheses

## สิ่งที่เกิดขึ้น

เรียกฟังก์ชันใน `setTimeout` แต่ขาด `()` ทำให้ฟังก์ชันไม่ถูก execute

```typescript
// ❌ ผิด — อ้างอิง function object แต่ไม่เรียก
setTimeout(() => {
    this.LoadDataCitizenSQL();
    this.onLoadNewAllegation   // ← ขาด ()
}, 1000);

// ✅ ถูก
setTimeout(() => {
    this.LoadDataCitizenSQL();
    this.onLoadNewAllegation();
}, 1000);
```

## Root Cause

JavaScript ถือ `this.onLoadNewAllegation` เป็น expression ที่ evaluate ค่าเป็น function reference แล้วทิ้งไป ไม่มี side effect ไม่มี error ไม่มี warning

## วิธีป้องกัน

- TypeScript ไม่ warn กรณีนี้เพราะ expression ยังถูก syntax
- ถ้าไม่ log ให้ตรวจก่อนว่าฟังก์ชันถูก **เรียก** จริงหรือแค่ **อ้างอิง**

## Interview Question

> What is the difference between `fn` and `fn()` in JavaScript?

`fn` คือ reference ไปยัง function object, `fn()` คือการ invoke function นั้น — การเขียน `fn` โดยไม่มี `()` ใน statement จะไม่เกิดผลอะไร

Related: [[Fix Function Called in Wrong Lifecycle Phase]], [[Angular and DevExtreme Interview Questions]], [[2026-06-30]]
