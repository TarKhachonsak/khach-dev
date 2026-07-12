# Bug: DevExtreme onValueChanged ยิงตอนโหลดข้อมูล ไม่ใช่แค่ user แก้ไข

## What Happened?

`Form37OfficerTaskComponent` — backend ส่งค่า `DAILY_FINE_DAY: 100000`, `FINE_AMOUNT: 102000` มาให้ตอนโหลดหน้า แต่ฟอร์มกลับแสดง `0` และ `2,000.00` แทน ทั้งที่ field เหล่านี้เป็น `readOnly: true` (user แก้ไขเองไม่ได้)

## Root Cause

Field `VIOLATION_DAY` (readOnly) ผูก `onValueChanged` callback ไว้สำหรับ "คำนวณค่าปรับใหม่เมื่อจำนวนวันเปลี่ยน":

```html
<dxi-item
    dataField="VIOLATION_DAY"
    [editorOptions]="{ readOnly: true, onValueChanged: calculateDailyFine.bind(this) }"
    editorType="dxTextBox">
</dxi-item>
```

```typescript
calculateDailyFine(e: any) {
    const fineDailyRate = this._formData.FINE_DAILY_RATE || 0;
    const violationDay = e.value || 0;
    this._formData.DAILY_FINE_DAY = fineDailyRate * violationDay;  // คำนวณใหม่ทับ
    this.calculateTotalFine();
}
```

**ความเข้าใจผิด:** คิดว่า `onValueChanged` จะยิงเฉพาะตอน user โต้ตอบกับ field เท่านั้น เพราะ field เป็น `readOnly`

**ความจริง:** DevExtreme `dx-form` ยิง `onValueChanged` ทุกครั้งที่ค่าของ field ใน `formData` ที่ผูกไว้ถูก "set" — ไม่ว่าจะมาจาก user พิมพ์ หรือมาจากโค้ดที่ set `this._formData.VIOLATION_DAY = 99` ตรงๆ ตอนโหลดข้อมูลจาก backend (`readOnly` ป้องกันแค่ user พิมพ์ไม่ได้ ไม่ได้ป้องกัน event firing)

ผลคือตอน `ngOnInit` หลัง set ค่าจริงจาก backend (`DAILY_FINE_DAY = 100000`) เสร็จ การ set `VIOLATION_DAY = 99` ในลูปเดียวกันไป trigger `calculateDailyFine()` ทันที ซึ่งคำนวณด้วย `FINE_DAILY_RATE` ที่เป็น `0` ในเคสนี้ → ได้ `DAILY_FINE_DAY = 0` ทับค่าจริงจาก backend แล้ว `calculateTotalFine()` คำนวณ `FINE_AMOUNT` ทับต่ออีกที

## Fix

เพิ่ม guard flag กัน callback ทำงานระหว่างช่วงโหลดข้อมูลเริ่มต้น:

```typescript
isSettingDefaults = false;

calculateDailyFine(e: any) {
    if (this.isSettingDefaults) return;   // ✅ skip ตอนกำลังโหลดข้อมูล
    const fineDailyRate = this._formData.FINE_DAILY_RATE || 0;
    const violationDay = e.value || 0;
    this._formData.DAILY_FINE_DAY = fineDailyRate * violationDay;
    this.calculateTotalFine();
}

// ตอนโหลดข้อมูลจาก backend
this.isSettingDefaults = true;
this._dsROD_FIR_TXN_ALLEGATION_GROUP.forEach(row => {
    this._formData.VIOLATION_DAY = row.VIOLATION_DAY;
    this._formData.DAILY_FINE_DAY = row.DAILY_FINE_DAY;
    // ...
});
setTimeout(() => { this.isSettingDefaults = false; });  // ปิด guard หลัง event queue ปัจจุบันเคลียร์
```

## How to Prevent

- `readOnly: true` ป้องกันแค่ user input ไม่ได้ป้องกัน `onValueChanged` — ถ้า field มี callback ที่ recalculate ค่าอื่น ต้องคิดเผื่อเสมอว่ามันจะยิงตอนโหลดข้อมูลด้วย
- ถ้า field มี "ค่าที่คำนวณจาก backend อยู่แล้ว" (authoritative source) กับ "callback ที่คำนวณใหม่จาก field อื่น" (derived) อยู่คู่กัน ต้องมี guard แยกช่วง "กำลังโหลด" ออกจากช่วง "user แก้ไข" เสมอ — pattern เดียวกับ `isSettingDefaults` ที่ใช้กันในโปรเจกต์นี้อยู่แล้วสำหรับ dropdown cascade
- ระวัง `setTimeout(fn)` (0ms) เป็น macrotask — ถ้า framework ยิง event ผ่าน change detection cycle คนละจังหวะ ต้องทดสอบจริงว่า guard ปิดเร็ว/ช้าเกินไปหรือไม่ อย่าเชื่อ static analysis อย่างเดียว

## Engineering Principle

> Widget/library ที่มี "own data binding pipeline" (เช่น DevExtreme `dx-form`) ไม่แยกแยะระหว่าง "โปรแกรมเมอร์ set ค่า" กับ "user พิมพ์" — มันเห็นแค่ค่าเปลี่ยน แล้วยิง callback ทุกครั้ง โค้ดที่ผูก callback ไว้กับ side-effect (recalculate, API call, validation) ต้องแยกแยะ "load phase" กับ "interaction phase" ด้วยตัวเอง ไม่ใช่พึ่งพา `readOnly`/`disabled` เป็นตัวกรอง

## Interview Question

**English Question:** A DevExtreme form field is `readOnly: true` and has an `onValueChanged` callback bound. During `ngOnInit`, you programmatically set that field's value from backend data, and the callback fires — overwriting other fields it recalculates. Why does this happen despite `readOnly`, and how do you prevent it?

**English Answer:** `readOnly` only blocks user keyboard/mouse input; it does not stop the widget's change-detection pipeline from firing `onValueChanged` when the bound `formData` property is set programmatically. Any code path that assigns to that field — including initial data hydration — triggers the same callback as user interaction. Prevent it with an explicit guard flag (e.g. `isSettingDefaults`) set `true` during the load phase and checked at the top of the callback, so load-time assignments are distinguished from real user-driven changes.

**Thai Question:** field ของ DevExtreme form ตั้ง `readOnly: true` ไว้ และมี `onValueChanged` callback ผูกอยู่ พอเขียนโค้ด set ค่าจาก backend ตอน `ngOnInit` callback นี้ก็ยังยิงและไปทับค่า field อื่นที่มันคำนวณ ทำไมถึงเป็นแบบนั้นทั้งที่ตั้ง readOnly ไว้แล้ว แล้วป้องกันยังไง?

**Thai Answer:** `readOnly` ป้องกันแค่ user พิมพ์/คลิกเท่านั้น ไม่ได้หยุด change-detection pipeline ของ widget จากการยิง `onValueChanged` เมื่อ property ใน `formData` ที่ผูกไว้ถูก set จากโค้ดโดยตรง — ไม่ว่าจะมาจากไหนก็ยิง callback เหมือนกันหมด ป้องกันด้วยการเพิ่ม guard flag (เช่น `isSettingDefaults`) set เป็น `true` ระหว่างช่วงโหลดข้อมูล แล้วเช็คที่ต้น callback เพื่อแยกแยะการ set ค่าตอนโหลดออกจากการเปลี่ยนแปลงจริงจาก user

**Thai Explanation:** หลักการคือ widget เห็นแค่ "ค่าเปลี่ยน" ไม่เห็นว่าใครเป็นคน set มันจึงยิง event เดียวกันไม่ว่าจะเป็นโปรแกรมเมอร์หรือ user การแก้ที่ถูกต้องคือแยก "load phase" กับ "interaction phase" ด้วย flag ของตัวเอง ไม่ใช่พึ่ง attribute ของ widget อย่าง `readOnly`/`disabled`

Related: [[DevExtreme dx-form updateData vs Direct Mutation]], [[DevExtreme Callback Context]], [[Restore UI State After Load Data]]

อ้างอิงจาก: [[2026-07-09]]
