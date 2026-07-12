# Approve Value Scoped to Wrong Task

## What happened?

หน้า task ถัดไปใน workflow (form-06) แสดง radio "ผลการพิจารณา" ผิด — ไม่ตรงกับที่เลือกไว้ใน task ก่อนหน้า (form-07) แม้จะผูก property ชื่อ `approveValue` เหมือนกันทั้งสอง component

## Root Cause

`approveValue` ของแต่ละ component คำนวณจาก `<formio>` ของ **task ตัวเอง** (`${this._taskFormCode}_approve`) เสมอ ไม่ใช่ผลของ task อื่น แม้ชื่อตัวแปรจะเหมือนกัน — form-06 (task 307/308) มี radio คำถามคนละอันกับ form-07 (task 306) และ task 307/308 มีตัวเลือกเดียวเท่านั้น ทำให้ `approveValue` เป็น `'A'` เสมอไม่ว่า task 306 จะเลือกอะไรมา

พอ patch ต่อด้วยการ derive ค่าแทนจาก `_formData.PHINAI5_SUM_DATE` (มี/ไม่มีค่า) ก็ยังเจอ bug ต่อเนื่อง: ช่องวันที่ถูกเปิดให้แสดงทั้งตอนเลือก A และ B (`*ngIf="approveValue === 'A' || approveValue === 'B'"`) ทำให้ค่าจากการเลือกรอบก่อนหน้าไม่ถูกเคลียร์ตอนเปลี่ยนใจเลือกใหม่ — ค่าเก่าเลย persist ทับผลจริง

## Fix

1. อ่านผลของ task 306 โดยตรงจาก `_formData` ด้วย key ที่คำนวณแบบ dynamic (ดู [[Cross-Task Decision via Dynamic Flow Key]]) แทนการอ้าง `approveValue` ของ component ตัวเอง หรือ derive จาก field อื่นทางอ้อม
2. แก้ต้นตอที่ form-07: คืน `*ngIf` ของช่องวันที่กลับไปเป็น `approveValue === 'A'` เท่านั้น (ตัดเงื่อนไข `|| 'B'` ที่ทำให้ field โชว์และมีค่าค้างตอนเลือก B ออก)
3. เพิ่ม validation จริงใน shared validate helper: บังคับกรอกวันที่เฉพาะตอน `formValue === 'A'` — ปิดช่องโหว่ที่ทำให้ยืนยันไปได้ทั้งที่ข้อมูลไม่ครบ

## Prevention

- component ที่ใช้ property ชื่อเดียวกัน (`approveValue`) ซ้ำกันหลายไฟล์ ต้องเช็คก่อนเสมอว่าผูกกับคำถามของ **task ไหน** ไม่ใช่สมมติว่าเหมือนกันเพราะชื่อเหมือน
- ฟิลด์ที่ซ่อนด้วย `*ngIf` ต้องเคลียร์ค่าด้วยตัวเองถ้าไม่ต้องการให้ค่าเก่าหลุดไปกับการ save ครั้งถัดไป (ดู [[Restore UI State After Load Data]])
- แก้ root cause (เงื่อนไข render + validation ที่ถูกต้อง) ก่อนเสมอ อย่ารีบ patch ปลายทางด้วยการเคลียร์ค่า defensive หลายจุดซึ่งไม่ครอบคลุมทุก path

Related: [[ApproveValue Not Restored After Draft Load]], [[Cross-Task Decision via Dynamic Flow Key]], [[Conditional Validation Pattern]]

Source: [[2026-07-03]]

## Update 2026-07-07 — เพิ่ม validate ให้ flow ใหม่

ฟิลด์ `PHINAI5_SUM_DATE` เดิมมีปัญหาแค่เรื่อง `*ngIf` render (ดูด้านบน) แต่ยังไม่เคยมี validate บังคับกรอกสำหรับ `FLOW_04_TASK_006` เลย — เพิ่ม case ใน `validateAllFormBetweenFlow()`: ถ้า `formValue === "B"` ต้อง fail ถ้าไม่มี `PHINAI5_SUM_DATE` ตอกย้ำหลักการเดิมของ note นี้ (fix root cause ที่ render + validation ให้ตรงกับ business rule ต่อ flow ไม่ใช่ patch เฉพาะจุด) กับ flow ใหม่ที่ share field เดียวกัน

Source เพิ่มเติม: [[2026-07-07]]
