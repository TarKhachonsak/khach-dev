# Shared Sync Helper Not Wired Into Every Form Controller

## เกิดอะไรขึ้น (เกิดซ้ำ 2 ครั้งในวันเดียว)

1. **PHINAI4**: `Phinai4Service.UpdateFormDraftAsync` ไม่เคยเรียก
   `FormProcessService.ReplacePersonReportAsync` ทั้งที่ `_formProcessService` inject
   เข้ามาแล้วและเมธอดนี้มีอยู่แล้ว → ข้อมูลผู้แจ้ง/ผู้รายงาน (PERSON_REPORT) ไม่ถูกบันทึก
   ตอน save draft
2. **PHINAI10**: `UpdateTask` (POST `updateform/{id}`) ไม่เคยเรียก
   `FormProcessService.ReplaceOfficerFormGroupAsync` ทั้งที่ inject แล้วและใช้
   pattern เดียวกับ Phinai4Service → เพิ่ม/แก้/ลบเจ้าหน้าที่ในทีมแล้วกด save draft
   ข้อมูลเดิมไม่เปลี่ยนแปลง (data ที่ user แก้หายไปเงียบ ๆ)

ทั้งสองเคสมี "shape" เดียวกันเป๊ะ: service กลาง (`FormProcessService`) มีเมธอด sync
child-group เตรียมไว้ให้ครบทุก group แล้ว แต่ **แต่ละ controller/flow ของแต่ละฟอร์ม
(PHINAI3/4/7/8/9/10) ต้องมาเขียนเรียกเองทีละจุด** ไม่มีกลไกบังคับว่า "ถ้าฟอร์มนี้มี
field group X ต้องเรียก ReplaceXGroupAsync เสมอ"

## ทำไมถึงเกิด (Root Cause)

โครงสร้างโค้ดเป็นแบบ **each controller/flow ประกอบ (compose) เรียก sync helper เอง
ทีละเมธอด** แทนที่จะมี template method หรือ pipeline กลางที่ list ไว้ว่าฟอร์มแต่ละแบบ
ต้อง sync group ไหนบ้าง ทำให้เวลา:
- เพิ่มฟอร์มใหม่ (copy-paste จากฟอร์มเก่า) แล้วลืม copy บาง group มา
- เพิ่ม group ใหม่ทีหลัง (เช่น PERSON_REPORT เพิ่มเข้ามาทีหลัง) แล้วอัปเดตแค่บาง flow
  ของฟอร์มเดียว ไม่ได้ไล่อัปเดตทุก flow (`updateFormDraft`, `createFormDraft`,
  `updateFormApprove`) ที่ควรเรียกเหมือนกัน

ไม่มี compile-time หรือ test coverage อะไรจับได้ — ทุกอย่าง compile ผ่านปกติ เพราะ
"ไม่เรียก method" ไม่ใช่ syntax error เป็น silent data loss แบบเดียวกับ
[[Unmapped Entity Properties After Codegen]] แต่คนละระดับ (ที่นั่นคือ "เรียก method
แล้วแต่ field ใน method ไม่ครบ", ที่นี่คือ "ไม่เรียก method เลย")

## วิธีแก้ (เฉพาะจุดที่เจอ)

เพิ่มเรียก helper ที่ขาดไปตรง ๆ ในแต่ละจุด (checkpoint logging ตาม pattern เดิมของไฟล์
สำหรับ PHINAI4, เพิ่มบรรทัดเรียกตรง ๆ ต่อจาก block บันทึกหลักสำหรับ PHINAI10)

## วิธีป้องกันในระยะยาว

- ทำ checklist/matrix ต่อฟอร์ม (PHINAI3/4/7/8/9/10 × child group ทั้งหมด) ว่าฟอร์มไหน
  ต้องเรียก Replace group ไหนบ้าง แล้วเทียบกับโค้ดจริงเป็นระยะ (ไม่ใช่รอ user เจอ bug
  แล้วมาบอกทีละเคส)
- พิจารณา refactor ให้แต่ละฟอร์มประกาศ "list ของ group ที่ต้อง sync" แบบ data-driven
  (เช่น array ของ delegate/Func) แล้ววน loop เรียกจากจุดเดียว แทนการเขียนเรียงทีละบรรทัด
  ในแต่ละ controller — ลดโอกาสลืมเมื่อเพิ่ม group ใหม่
- เขียน integration test อย่างน้อย 1 เคสต่อฟอร์มที่ยืนยันว่า submit แล้ว child group
  ทุกตัวถูก persist จริง (ไม่ใช่แค่ HTTP 200)

## Engineering Principle

เมื่อ logic เดียวกัน (list ของ sync operation ที่ต้องทำ) ถูก **copy-paste กระจายไปในหลาย
call site** แทนที่จะรวมไว้จุดเดียว (single source of truth) ทุกครั้งที่แก้ไข/เพิ่มเติมจะมี
ความเสี่ยงที่บาง call site จะตกหล่นเสมอ — นี่คือรูปแบบคลาสสิกของ DRY violation ที่ไม่ได้
แสดงผลเป็น compile error แต่เป็น runtime data-loss bug ที่เงียบและตรวจจับยาก

## Interview Question

**EN:** A shared "sync child records" helper exists and is already injected into
multiple form controllers, yet one flow silently forgets to call it — the code
compiles fine and returns HTTP 200. How do you both fix the immediate bug and reduce
the chance of the same class of bug recurring?

**Answer (EN):** The immediate fix is adding the missing call. The systemic fix is
recognizing this as a DRY violation across call sites: the list of "which child groups
this form must sync" is duplicated implicitly across every flow method instead of being
declared once. Refactor toward a data-driven list (form → list of sync delegates)
consumed from a single loop, and add integration tests that assert each child group is
actually persisted after submit — not just that the endpoint returns success.

**คำถามภาษาไทย:** มี helper กลางสำหรับ sync child records อยู่แล้ว และถูก inject เข้าไป
ในหลาย controller ของฟอร์มแล้ว แต่มี flow หนึ่งลืมเรียกมันเงียบ ๆ — โค้ด compile ผ่าน
และคืน HTTP 200 ปกติ จะแก้บั๊กตรงหน้าและลดโอกาสเกิดบั๊กแบบเดียวกันซ้ำได้อย่างไร?

**คำตอบภาษาไทย:** แก้ตรงหน้าคือเพิ่มเรียก method ที่ขาดไป ส่วนแก้เชิงระบบคือมองว่านี่คือ
DRY violation ข้าม call site — รายการ "ฟอร์มนี้ต้อง sync group ไหนบ้าง" ถูกกระจายซ้ำ ๆ
โดยนัยในทุก flow method แทนที่จะประกาศไว้จุดเดียว ควร refactor ให้เป็น data-driven list
(ฟอร์ม → list ของ sync delegate) แล้ววนเรียกจากจุดเดียว พร้อมเขียน integration test
ยืนยันว่า submit แล้ว child group แต่ละตัวถูก persist จริง ไม่ใช่แค่เช็คว่า endpoint
คืน success

**คำอธิบายเพิ่มเติม:** จุดสำคัญคือบั๊กประเภทนี้ไม่มี error ให้เห็นเลย ต่างจาก
NullReferenceException ที่อย่างน้อยยัง crash ให้รู้ตัว — การ "ลืมเรียก method" แบบนี้ทำให้
ระบบทำงาน "เหมือนปกติ" ทุกอย่าง (return 200, ไม่มี exception) แต่ข้อมูลที่ user กรอกมา
หายไปเงียบ ๆ ต้องอาศัย user มา report เอง (เกิดขึ้นจริง 2 ครั้งในวันเดียวกันของโปรเจกต์นี้)
จึงเป็นเหตุผลว่าทำไม integration test ที่ตรวจ data persistence จริงถึงสำคัญกว่าการเช็คแค่
HTTP status code

## อ้างอิงจาก

[[2026-07-14]]
[[XPO Detail Records - Replace-All Sync Pattern]]
