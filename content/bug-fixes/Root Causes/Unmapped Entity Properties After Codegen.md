# Unmapped Entity Properties After Codegen

## เกิดอะไรขึ้น

ในโปรเจกต์ ROD Officer API เมธอด `FormProcessService.ReplacePersonReportAsync` (map JSON
submission → entity `ROD_FIR_TXN_PERSON_REPORT`) ไม่ได้ map field `PERSON_REPORT_RACE_ID`,
`PERSON_REPORT_BIRTHDAY`, `PERSON_REPORT_AGE`, `PERSON_REPORT_FAX`,
`PERSON_REPORT_OCCUPATION_ID` (และภายหลังพบเพิ่ม `CONTACT_FLAG`) ทั้งที่ property เหล่านี้
**มีอยู่แล้วจริง** ใน entity (`ROD_FIR_TXN_PERSON_REPORT.Designer.cs`)

## ทำไมถึงเกิด (Root Cause)

Entity ของโปรเจกต์นี้ถูก generate อัตโนมัติจาก Oracle schema ด้วย
`tools/XpoEntityGenerator` — เมื่อ DB มีคอลัมน์ใหม่ entity จะมี property ใหม่ทันที
**โดยไม่ต้องมีคนเขียนโค้ดเพิ่ม** แต่เมธอด mapping ระดับ business logic (เช่น
`ReplacePersonReportAsync`) เป็นโค้ดที่เขียนมือและต้อง sync เอง — ไม่มี compiler หรือ
tooling ใดบังคับว่า "ถ้า entity มี property ใหม่ ต้องอัปเดตเมธอด mapping ด้วย"

นี่คือ **impedance mismatch ระหว่าง schema-driven codegen กับ hand-written business logic**
ทำให้เกิดช่องว่างเงียบ ๆ (silent gap) — โค้าง compile ผ่านปกติ ไม่มี error ใด ๆ เพราะ
property ที่ไม่ได้ map ก็แค่ถูกเว้นว่าง/ใช้ default value ไม่ throw exception

## วิธีแก้ (ที่ทำในเซสชันนี้)

1. Grep หา property จริงใน `*.Designer.cs` ของ entity ก่อนเพิ่ม field ใด ๆ (ไม่เดาชื่อ/type)
2. เพิ่ม assignment ให้ตรง type ที่ entity ประกาศไว้ (`int?`, `DateTime?`, `string`, ฯลฯ)
3. Build (`dotnet build`) ยืนยันว่าไม่มี CS error ก่อนเสนอ commit

## วิธีป้องกันในระยะยาว

- เวลา entity ถูก regenerate (schema เปลี่ยน) ควร diff property list เก่า/ใหม่ของ entity
  แล้ว cross-check กับเมธอด mapping ที่เกี่ยวข้องทุกตัว แทนที่จะรอ user มาบอกทีละ field
- พิจารณาเขียน unit test ที่ยืนยันว่าทุก property ของ entity ถูก touch อย่างน้อยหนึ่งจุดใน
  mapping method (reflection-based coverage check) สำหรับ entity ที่สำคัญ
- ดู pattern การ sync ที่เกี่ยวข้องใน [[XPO Detail Records - Replace-All Sync Pattern]]

## Engineering Principle

Generated code (schema-driven) และ hand-written glue code เป็นคนละ layer ที่ **drift ออก
จากกันได้เสมอ** เมื่อไม่มี mechanism บังคับ sync — ต้อง treat จุดเชื่อมต่อนี้เป็นจุดเสี่ยงที่
ต้อง audit เป็นระยะ ไม่ใช่ assume ว่า "compile ผ่าน = ครบถ้วน"

## Interview Question

**EN:** When your ORM entities are auto-generated from a database schema but your
field-mapping logic is hand-written, how do you prevent silent drift between the two
when the schema changes?

**Answer (EN):** Recognize this as an impedance mismatch between codegen and manual glue
code — the compiler won't catch missing mappings if the unmapped property simply keeps
its default value. Mitigate by: (1) treating entity regeneration as a trigger to diff the
property list against existing mapping methods, (2) writing reflection-based coverage
tests that assert every entity property is referenced by at least one mapping method,
and (3) keeping mapping methods close to their entity definitions in code review so
reviewers can spot new unmapped columns.

**คำถามภาษาไทย:** เมื่อ entity ของ ORM ถูก generate อัตโนมัติจาก database schema แต่ logic
การ map field เขียนด้วยมือ จะป้องกันไม่ให้สอง layer นี้ drift ออกจากกันเงียบ ๆ เวลา schema
เปลี่ยนได้อย่างไร?

**คำตอบภาษาไทย:** ต้องมองว่านี่คือ impedance mismatch ระหว่าง codegen กับโค้ด glue ที่เขียนมือ
— compiler จะไม่ฟ้อง error ถ้า field ไหนไม่ได้ map เพราะมันแค่เป็นค่า default เฉย ๆ วิธีป้องกัน
คือ (1) ทุกครั้งที่ regenerate entity ให้ diff รายการ property เทียบกับเมธอด mapping ที่เกี่ยวข้อง
(2) เขียน test แบบ reflection ตรวจว่าทุก property ของ entity ถูกอ้างถึงในเมธอด mapping
อย่างน้อยหนึ่งจุด และ (3) ตอน review code ให้เมธอด mapping อยู่ใกล้ entity definition
เพื่อให้ reviewer สังเกตเห็น column ใหม่ที่ยังไม่ได้ map ได้ง่าย

**คำอธิบายเพิ่มเติม:** เคสนี้ไม่ใช่ bug ที่ทำให้ระบบ crash หรือ error ชัดเจน แต่เป็น "silent
data loss" — ข้อมูลที่ user กรอกมาจริงถูก submission ส่งมาแล้ว แต่ backend เงียบ ๆ ไม่บันทึก
ประเภทบั๊กแบบนี้อันตรายกว่า exception ตรงที่ตรวจจับยากกว่ามาก ต้องอาศัย user แจ้งเอง
(เหมือนที่เกิดในเซสชันนี้) หรือมี automated test คอยเช็ค ไม่สามารถพึ่ง compiler/runtime
error ได้เลย

## อ้างอิงจาก

[[2026-07-14]]
