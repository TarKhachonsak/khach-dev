# Check Recent Commits Before Fixing Shared Component

## What It Is

นิสัย/ขั้นตอนก่อนแก้ shared component (component ที่ถูกเรียกใช้จากหลาย flow/หลายทีมพร้อมกัน): เช็ค `git log` ของไฟล์นั้นก่อนเริ่มออกแบบ fix เสมอ

## The Problem

ในโปรเจกต์ BMA ROD Officer UI, `CrimeSceneLocationRedesignComponent` ถูก fix เรื่องปุ่ม "ระบุพิกัด" ไม่แสดงถึง 2 ครั้งติดกันโดยคนละคน:

- 2026-07-07 (TarKhachonsak): แก้เป็น `return true` เสมอ เพราะสรุปว่าทุก flow_task ที่ใช้ component นี้ต้องการปุ่มเหมือนกัน
- 2026-07-10 (เพื่อนร่วมทีม): แก้ทับเป็น allowlist เฉพาะ flow code เพราะสรุปว่ามีบาง flow ที่ไม่ควรเห็นปุ่มนี้

ทั้งสอง commit แก้ไฟล์เดียวกัน getter เดียวกัน โดยไม่รู้ว่าอีกฝ่ายกำลัง/เพิ่งแก้ไปแล้ว ผลคือ งานของคนแรกถูก override ทับทั้งหมดโดยไม่มีใครรู้ตัว จนกว่าจะมีคนกลับมาเช็คว่าโค้ดปัจจุบันตรงกับที่เคย commit ไว้จริงหรือไม่

## Fix / Practice

ก่อนเริ่มแก้ shared/common component (ใช้ selector เดียวถูกเรียกจาก host หลายไฟล์):

1. `git log -- <path>` เช็คว่ามีใครแตะไฟล์นี้เมื่อเร็วๆ นี้ด้วยเหตุผลใกล้เคียงกันหรือไม่
2. ถ้ามี commit ล่าสุดที่เกี่ยวข้อง ให้อ่าน commit message + diff ก่อนออกแบบ fix ใหม่ — อาจมีคนแก้ปัญหาเดียวกันไปแล้วด้วยแนวทางที่ต่างจากที่กำลังจะทำ
3. ถ้าแนวทางต่างกัน คุยกับทีมก่อนว่าจะยึดแนวไหน แทนที่จะปล่อยให้ commit ทับกันเงียบๆ

## Why It Matters

- shared component คือจุดที่มีโอกาส "แก้ปัญหาเดียวกันซ้ำ" สูงที่สุด เพราะหลาย flow ที่ใช้ component เดียวกันมักเจอ symptom คล้ายกันในเวลาไล่เลี่ยกัน
- การ merge/rebase ปกติจะไม่เตือนเรื่องนี้ถ้าไม่ conflict กันจริงๆ ในระดับบรรทัด (เช่น คนละ commit แก้ getter เดียวกันคนละแบบ แต่บรรทัดใกล้เคียงกันจน merge ผ่านได้โดยไม่ conflict)
- การเช็ค `git log` ก่อนแก้ ใช้เวลาไม่กี่วินาที แต่ป้องกัน churn ที่เสียเวลาไปกับการ debug ว่า "ทำไม fix ที่เคยทำไปหายไป"

## Engineering Principle

ในโปรเจกต์ที่มีทีมทำงานพร้อมกันหลายคน ความเสี่ยงของการ "แก้ไฟล์เดียวกันคนละทาง" สูงกว่าความเสี่ยงของ merge conflict ที่ git ตรวจจับได้ — เครื่องมือ (git) ป้องกันได้แค่ conflict ระดับ text ไม่ได้ป้องกัน conflict ระดับ "เจตนา/แนวทางการแก้" ต้องอาศัยกระบวนการของคน (เช็ค log, คุยกับทีม) เข้ามาเสริม

Related: [[Force-Show Feature by Task Code Allowlist]]

Source: [[2026-07-07]]

## Update 2026-07-14 — ต้อง grep หา caller ทั้งหมด ไม่ใช่แค่เช็ค git log

เจอความเสี่ยงอีกแบบของ shared component ที่ไม่เกี่ยวกับ git history เลย: กำลังแก้ race condition bug ใน `LeafletMapOverviewComponent.showMap()` โดยเปลี่ยนจาก toggle behavior (สร้าง/ทำลายสลับกันทุกครั้งที่เรียก) เป็น idempotent (`if (this.map) return;`) — แก้บั๊กที่ report มาได้จริง แต่ไม่ได้เช็คก่อนว่ามีใครเรียก `showMap()` จากที่อื่นอีกบ้าง

พอ grep ย้อนกลับ (`grep -rn "\.showMap()"`) หลังแก้เสร็จแล้ว ถึงพบว่า component นี้ถูกเรียกจากฟอร์มอื่นอีก **~25 ไฟล์** ทุกไฟล์พึ่งพา toggle behavior เดิมผ่าน pattern `onToggleMap() { flag = !flag; child.showMap(); }` — การเปลี่ยนเป็น idempotent ทำให้ทุกไฟล์เหล่านั้นเสียความสามารถ "กดปุ่มซ้ำเพื่อซ่อนแผนที่" ไปพร้อมกันหมด โดยไม่มี error ใดๆ เตือนตอน build (ดู [[Leaflet Map Zoom Reset on Position Change]] update 2026-07-14)

**ส่วนขยายของหลักการเดิม:** การเช็ค `git log` ป้องกันได้แค่ "คนอื่นกำลังแก้ไฟล์เดียวกันคู่ขนาน" แต่ไม่ได้ป้องกัน "การเปลี่ยน contract ของ public method ที่มีคน**เรียกใช้อยู่แล้ว**จากหลายที่" — สองอย่างนี้ต้อง check คนละแบบ:

1. `git log -- <path>` → ป้องกันคนอื่นแก้ไฟล์เดียวกันคู่ขนาน (ความเสี่ยงระดับทีม)
2. `grep -rn "methodName\(\)"` หรือ `grep -rn "<component-selector"` ทั่ว repo → ป้องกันการเปลี่ยน behavior ที่กระทบ caller ที่มีอยู่แล้ว (ความเสี่ยงระดับ API contract) — **ต้องทำก่อนเปลี่ยน public method ของ shared component ทุกครั้ง ไม่ใช่แค่ตอนสงสัยว่ามีคนแก้พร้อมกัน**

ทั้งสองข้อไม่ทดแทนกัน ต้องทำทั้งคู่เมื่อแตะ shared component

Related: [[Leaflet Map Zoom Reset on Position Change]]

Source เพิ่มเติม: [[2026-07-14]]
