# ORM Child Record Sync — Replace-All vs Diff-Based Update

## English Question
When a client submits the *entire* array of child/detail records on every save
(not a diff), how would you synchronize that with the database using an ORM,
and what are the trade-offs of the approach you'd choose?

## English Answer
Two common strategies:

1. **Replace-all (soft-delete + reinsert)** — mark all existing active child rows
   as inactive (e.g. `RECORD_STATUS = "I"`), then insert every row from the
   incoming array as new. Simple to implement, avoids per-row diffing logic,
   and — if using soft delete instead of hard delete — naturally preserves an
   audit trail of every previous version of the child collection.
2. **Diff-based update** — compare incoming array against existing rows by key,
   issue targeted insert/update/delete only for what changed. More efficient
   for large collections and preserves row identity (foreign keys pointing at
   a specific child row survive), but is more complex to implement correctly
   and easier to get wrong (e.g. mishandling deletes).

Replace-all is the better default when: collections are small, the domain
needs an audit trail, and the client always sends the full set. Diff-based
update wins when collections are large, other data references specific child
rows by identity, or partial updates are common.

## Thai Question (คำถามภาษาไทย)
ถ้า client ส่ง array ของ child/detail records มาทั้งชุดทุกครั้งที่ save (ไม่ใช่ diff)
จะ sync ข้อมูลนี้เข้า database ผ่าน ORM อย่างไร และแต่ละวิธีมี trade-off อะไรบ้าง?

## Thai Answer (คำตอบภาษาไทย)
มีสองแนวทางหลัก:

1. **Replace-all (soft-delete แล้ว insert ใหม่)** — mark record เดิมทั้งหมดที่ active
   ให้เป็น inactive (เช่น `RECORD_STATUS = "I"`) แล้ว insert record ใหม่ทั้งหมดจาก array
   ที่รับมา ทำง่าย ไม่ต้องเขียน logic diff ทีละแถว และถ้าใช้ soft delete แทน hard delete
   จะได้ audit trail ของทุกเวอร์ชันที่เคยมีมาโดยอัตโนมัติ
2. **Diff-based update** — เทียบ array ที่รับมากับ record เดิมด้วย key แล้วสั่ง
   insert/update/delete เฉพาะส่วนที่เปลี่ยน มีประสิทธิภาพดีกว่าเมื่อ collection ใหญ่
   และรักษา identity ของแต่ละแถวไว้ได้ (foreign key ที่ชี้ไปยัง child แถวเดิมยังใช้ได้)
   แต่ implement ยากกว่าและพลาดง่ายกว่า (เช่น handle การลบผิดพลาด)

Replace-all เหมาะเป็น default เมื่อ: collection มีขนาดเล็ก, domain ต้องการ audit trail,
และ client ส่งข้อมูลทั้งชุดมาเสมอ ส่วน diff-based update เหมาะกว่าเมื่อ collection ใหญ่,
มีข้อมูลอื่นอ้างอิง child record ด้วย identity เฉพาะเจาะจง, หรือมี partial update บ่อย

## Thai Explanation (คำอธิบายเพิ่มเติมภาษาไทย)
ตัวอย่างจริงจากงาน: ระบบฟอร์มราชการ (ROD Officer API) ใช้ DevExpress XPO กับ Oracle
เมธอด `ReplaceXxxGroupAsync` ต่าง ๆ ใน `FormProcessService.cs` เลือกใช้ replace-all
เพราะฟอร์มราชการต้องตรวจสอบย้อนหลังได้ (audit) และ frontend ส่งข้อมูลทั้งชุดมาทุกครั้งที่
save draft อยู่แล้ว จึงไม่มีความจำเป็นต้องทำ diff logic ที่ซับซ้อนกว่า — เป็นตัวอย่างที่ดีว่า
การเลือก pattern ควรพิจารณาจาก **ลักษณะการส่งข้อมูลของ client** และ **ความต้องการทาง
ธุรกิจ (audit/compliance)** ไม่ใช่แค่มุมมองด้าน performance อย่างเดียว ดูเพิ่มเติมที่
[[XPO Detail Records - Replace-All Sync Pattern]]

## อ้างอิงจาก

[[2026-07-14]]
