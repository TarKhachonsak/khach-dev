# Service Endpoint Mismatch Blocks Field From Persisting

## What happened?

ใน `form-10-flow4-officer-task.component.ts` ฟิลด์ `RESULT_EXPLAIN_FLAG` ถูกใส่ค่าและส่งออกไปใน payload ตอนกดบันทึกได้ปกติ (เห็นค่าจริงใน `console.log`/network payload) แต่ข้อมูลไม่ถูกบันทึกลง DB จริง — ดึงไปออก report ไม่ได้

## Root Cause

FE ไม่ได้เป็นจุดที่ทำค่าหาย: grep ทุกจุดที่ set field นี้ (`onSave()`, `_buildParams()`, `Sentflow()`) เจอว่า set ค่าเป็น `this.approveValue` ครบทุกจุด และ service layer (`req(...).body(param).post()`) ก็ไม่มีจุดไหน strip/whitelist field ทิ้ง

ตัวปัญหาจริงคือ **เรียกผิด service/endpoint**: `onSaveDraft()` เดิมยิงไปที่ `FormInspectionLocaltion6Service.Updateform()` (`form-inspection-location6/updateform`) ซึ่งเป็น endpoint/ตารางคนละชุดกับที่ backend ใช้ generate report ของ flow นี้ ("พินัย 5") — แม้ field จะอยู่ใน body ที่ส่งไป แต่ endpoint 6 ไม่ map field นี้เข้า DB column ที่ report อ่าน

## Fix

เปลี่ยน service ทั้งฝั่ง Get และ Save จาก `FormInspectionLocaltion6Service` เป็น `FormInspectionLocaltion5Service` (`.Get()` / `.Put()`) พร้อมเพิ่ม `RESULT_EXPLAIN_FLAG: this.approveValue` ในทั้ง 3 จุดที่ build payload — การเพิ่ม field อย่างเดียวไม่พอ ต้องแก้ที่ endpoint ปลายทางด้วย

## Prevention

- เมื่อฟิลด์ "ส่งออกไปได้แต่ไม่ถูกบันทึก" อย่ารีบสรุปว่าเป็น bug ฝั่ง backend เฉยๆ — ให้ตรวจก่อนว่า **endpoint/service ที่เรียกถูกต้องหรือไม่** โดยเฉพาะเมื่อมี service หลายเวอร์ชันคล้ายกัน (location5, location6, ...) ในโปรเจกต์เดียวกัน ชื่อคล้ายกันมากทำให้เลือกผิดง่าย
- Debug order ที่ควรทำ: (1) grep ทุกจุดที่ set field เพื่อ confirm ว่าฝั่ง FE ใส่ค่าจริง (2) เช็ค service call ว่ายิงไป endpoint ไหน ก่อน (3) ค่อยสงสัย backend DTO/mapping ถ้า endpoint ถูกต้องแล้วแต่ยังไม่ persist
- เมื่อโปรเจกต์มี service หลายเวอร์ชันคล้ายกันสำหรับฟอร์มที่คล้ายกัน (พินัย 5 vs 6) ควรตั้งชื่อ/comment ให้ชัดว่า flow ไหนต้องใช้ service ไหน ป้องกัน copy-paste service ผิดตัว

## Engineering Principle

อาการ "ค่าส่งออกไปได้แต่ไม่ persist" มีสาเหตุที่เป็นไปได้อย่างน้อย 3 ชั้น: (1) FE ไม่ได้ใส่ค่าจริง (2) FE ใส่ค่าถูกแต่ยิงผิด endpoint/service (3) endpoint ถูกแล้วแต่ backend DTO ไม่ map field — ต้องแยกให้ออกทีละชั้นด้วยการตรวจโค้ดจริง ไม่ใช่เดาข้ามไปที่ backend ทันที

Related: [[Approve Value Scoped to Wrong Task]], [[Force-Show Feature by Task Code Allowlist]]

Source: [[2026-07-07]]
