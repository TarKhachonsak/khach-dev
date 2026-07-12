# Bug: Array.isArray() Guard เช็คตัวแปรผิดตัว ทำให้ส่ง Array ว่างเงียบๆ

## What Happened?

`Form37OfficerTaskComponent` — เมื่อกด "ยืนยันส่งขั้นตอนถัดไป" ค่าที่ user แก้ไข (เช่นจำนวนวันชำระค่าปรับ) หายไปจาก submission ทุกครั้ง แม้ save draft ก่อนหน้าจะสำเร็จและมีค่าถูกต้อง

## Root Cause

Component มีตัวแปร 2 ตัวชื่อคล้ายกันมาก แต่ type ต่างกัน:

```typescript
_dsROD_FIR_TXN_ALLEGATION_GROUP: any[] = [];        // array — โหลดครั้งเดียวตอน ngOnInit
_formData_ROD_FIR_TXN_ALLEGATION_GROUP: any = {};   // object — rebuild ใหม่ทุกครั้งใน onSave()
```

`Sentflow()` build submission โดยเช็ค `Array.isArray()` บนตัวที่เป็น **object เสมอ**:

```typescript
// ❌ Bug: เช็คตัวแปรผิดตัว
const submission = {
    ...
    _dsROD_FIR_TXN_ALLEGATION_GROUP: Array.isArray(this._formData_ROD_FIR_TXN_ALLEGATION_GROUP)
        ? [...this._formData_ROD_FIR_TXN_ALLEGATION_GROUP]
        : [],   // ← branch นี้ถูกเลือกทุกครั้ง เพราะ _formData_ROD_FIR_TXN_ALLEGATION_GROUP
                //    ถูก assign เป็น `{ ... }` เสมอ ไม่เคยเป็น array
};
```

`_formData_ROD_FIR_TXN_ALLEGATION_GROUP` ถูก assign เป็น plain object ทุกจุดในไฟล์ (ทั้งใน `bindPenaltyPanelData()` และ `onSave()`) — `Array.isArray()` จึงคืน `false` เสมอ ไม่มี error ไม่มี warning เงียบสนิท เพราะ TypeScript type คือ `any`

**ซ้ำร้าย:** ตัวแปร array ตัวจริง (`_dsROD_FIR_TXN_ALLEGATION_GROUP`) ก็ใช้แทนตรงๆ ไม่ได้ เพราะมันถูก set ครั้งเดียวตอนโหลดข้อมูล (`ngOnInit`) แล้วไม่เคยถูกอัปเดตอีกเลยหลัง user แก้ไขฟอร์ม — ใช้แล้วจะได้ค่าเก่าจาก backend แทนค่าที่เพิ่งแก้

## Fix

ใช้ object ที่ถูก rebuild สดจาก `_formData` ทุกครั้งก่อน save (มีค่าล่าสุดจริง) wrap เป็น array แทนการเช็ค `Array.isArray()`:

```typescript
// ✅ Fix
const submission = {
    ...
    _dsROD_FIR_TXN_ALLEGATION_GROUP: [this._formData_ROD_FIR_TXN_ALLEGATION_GROUP],
};
```

## How to Prevent

- ตั้งชื่อตัวแปรที่มี **type ต่างกัน** (array vs object) ให้ต่างกันชัดเจนกว่าการต่อ prefix เดียวกัน (`_ds...` = array, `_formData_...` = object เป็น convention ที่ดีอยู่แล้ว — บั๊กนี้เกิดเพราะสลับไปเช็คผิดตัว ไม่ใช่ชื่อไม่ชัด)
- เวลาเห็น `Array.isArray(x) ? [...x] : []` ที่ branch `false` ถูกเรียกเสมอ ให้สงสัยว่า `x` ไม่เคยเป็น array ตั้งแต่ต้น — เช็คทุกจุด assignment ของ `x` ก่อน ไม่ใช่แค่จุดที่ใช้
- เขียน unit test หรือ log ค่าที่ submission ส่งจริงเทียบกับที่ user กรอก แทนการเชื่อว่า guard condition ทำงานถูกจากการอ่านโค้ดอย่างเดียว

## Engineering Principle

> Guard condition ที่ผูกกับตัวแปรผิดตัว (แต่ syntax ถูกต้อง) จะไม่มี compile error หรือ runtime error ให้เห็น — มันแค่เลือก branch ที่ "ปลอดภัยแต่ผิด" (`[]`) อย่างเงียบๆ ทุกครั้ง วิธีจับบั๊กแบบนี้คือ trace ว่าตัวแปรที่ถูกเช็คมี type ตรงกับที่ condition คาดหวังจริงหรือไม่ ไม่ใช่แค่อ่านว่า syntax ของ ternary ถูกหรือเปล่า

## Interview Question

**English Question:** A ternary guarded by `Array.isArray(x)` always falls into the `else` branch and silently sends an empty array, with no error anywhere. How do you debug this class of bug?

**English Answer:** Since there's no exception or type error (the variable is typed `any`), grep every assignment site of `x`, not just its usage. If `x` is always assigned a plain object literal, `Array.isArray(x)` will always be `false` regardless of the data actually available — the bug is a variable-identity mismatch, not a logic error in the condition itself. Compare the variable name in the condition against a similarly-named sibling variable that might be the intended one.

**Thai Question:** เจอ ternary ที่เช็คด้วย `Array.isArray(x)` แล้ว branch `else` ถูกเลือกทุกครั้ง ส่ง array ว่างไปเงียบๆ โดยไม่มี error เลย จะ debug ยังไง?

**Thai Answer:** เพราะตัวแปรเป็น type `any` จึงไม่มี compile error หรือ exception ให้เห็น ต้อง grep หาทุกจุด assignment ของ `x` (ไม่ใช่แค่จุดใช้งาน) ถ้า `x` ถูก assign เป็น plain object เสมอ `Array.isArray(x)` จะเป็น `false` ตลอดไม่ว่าข้อมูลจริงจะมีอะไรก็ตาม — บั๊กนี้คือการอ้างตัวแปรผิดตัว (variable-identity mismatch) ไม่ใช่ logic ผิดใน condition เอง ให้เทียบชื่อตัวแปรในเงื่อนไขกับตัวแปรพี่น้องที่ชื่อคล้ายกันว่าตัวไหนคือตัวที่ควรใช้จริง

**Thai Explanation:** บั๊กประเภทนี้อันตรายเพราะโค้ด "ดูถูกต้อง" — syntax ของ ternary ไม่มีปัญหา TypeScript ไม่ error เพราะ `any` ปิดบัง type mismatch ทั้งหมด ทางเดียวที่จับได้คือ trace runtime value จริงหรือ grep หาจุด assign เทียบกับจุดที่ใช้

Related: [[Child Array Not Synced to Parent on Save]], [[Angular Input Object Reference]]

อ้างอิงจาก: [[2026-07-09]]
