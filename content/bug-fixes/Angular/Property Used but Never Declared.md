# Property Used but Never Declared

## What happened?

TypeScript compile error: `Property 'flow2Task104Codes' does not exist on type 'Form104OfficerTaskComponent'` — property ถูกใช้งานจริงทั้งใน `.ts` (build payload แบบมีเงื่อนไข) และ `.html` (`*ngIf` สลับ component) แต่ compiler บอกว่าไม่มีอยู่จริง

## Root Cause

commit ก่อนหน้าของเพื่อนร่วมทีม (feature: panel ผู้กล่าวหา/ผู้แจ้ง) เพิ่มการใช้งาน `flow2Task104Codes.includes(...)` ทั้งใน template และ component logic แต่ **ไม่เคย declare ตัวแปรนี้เป็น class property เลย** — น่าจะตั้งใจสร้างเป็น `readonly array` แบบเดียวกับ `flow104SummaryTaskCodes` ที่มีอยู่แล้วในไฟล์เดียวกัน แต่บรรทัด declare หายไประหว่างแก้

โค้ดแบบนี้ผ่าน editor/IDE มาได้ (บางครั้ง IDE cache type info เก่า หรือ dev server ไม่ full recompile ทันที) แต่จะ fail ทันทีที่ `tsc --noEmit` หรือ `ng build` เต็มรูปแบบ

## How was it fixed?

grep หาทุกจุดที่ใช้ชื่อตัวแปรนี้ (`.ts` และ `.html`) เพื่อดูว่า "ควรจะเป็น" อะไร — พบว่ามาจาก commit ที่ระบุ task code ไว้ในชื่อ commit message เอง (`flow2 task63 104 375 376`) จึงใช้ชื่อ task เหล่านั้นตรง ๆ:

```typescript
readonly flow2Task104Codes = ["FLOW_02_TASK_063", "FLOW_02_TASK_104", "FLOW_02_TASK_375", "FLOW_02_TASK_376"];
```

## Prevention

- ก่อน commit component ใหม่หรือแก้ template ที่อ้างตัวแปรใหม่ ต้องรัน type-check เต็มรูปแบบ (`ng build` หรือ `tsc --noEmit`) ไม่ใช่แค่เชื่อ error list ของ editor ที่อาจ cache ค้าง
- ถ้าเจอ error "Property does not exist" ให้ grep ชื่อตัวแปรทั้งไฟล์ก่อนเสมอ — ถ้ามีใช้งานในหลายจุด (ทั้ง `.ts`/`.html`) แต่ไม่มีจุด declare เลย มักแปลว่ามี logic ที่ "ควรมีอยู่" แต่ตกหล่นระหว่างแก้ ไม่ใช่แค่ typo
- commit message ที่ระบุรายละเอียด (เช่น ระบุ task code ที่เกี่ยวข้อง) ช่วยตามรอย "ค่าที่ตั้งใจจะใส่" ได้ตอนแก้ภายหลัง — เป็นเหตุผลหนึ่งที่ควรเขียน commit message ละเอียด

## Engineering Principle

> "Property used but never declared" เป็นบั๊กคนละคลาสกับ "declared but unassigned" (ดู [[Declared but Unassigned State]]) — แบบแรก **compiler จับได้ทันที** (build แดง ชัดเจน) แบบหลัง **compiler จับไม่ได้เลย** (เป็น `undefined` แบบเงียบ ผ่าน build ปกติ) ทั้งสองแบบมีต้นตอเดียวกันคือ logic ตกหล่นระหว่างแก้โค้ด แต่ระดับความรุนแรงต่างกันมาก — แบบแรกบังคับให้ต้องแก้ก่อน deploy ได้ แบบหลังหลุดไป production ได้ง่ายกว่ามาก

## Interview Question

**English Question:** Two Angular bugs share the same root cause — a property referenced across `.ts` and `.html` was never fully wired up during a previous change — but one causes a TypeScript compile error while the other silently returns `undefined` at runtime with no error at all. What determines which outcome you get?

**English Answer:** Whether the property was declared as a class member at all. If it's referenced but never declared (no `field: Type;` and no assignment anywhere), TypeScript's structural type checker flags it immediately as "Property does not exist on type" — a hard compile-time error. If it *was* declared (even without a default value or any assignment), TypeScript considers the reference valid; the value is simply `undefined` at runtime, which is a legal value for most types unless strict initialization checks are enabled, so nothing errors — the bug hides until some new logic depends on it holding a real value.

**Thai Question:** บั๊ก Angular สองแบบมี root cause เดียวกัน (ตัวแปรที่ถูกอ้างถึงทั้งใน `.ts` และ `.html` แต่ต่อสายไม่ครบตอนแก้โค้ดครั้งก่อน) แต่แบบหนึ่ง compile error ทันที ส่วนอีกแบบเงียบเป็น `undefined` ตอน runtime โดยไม่มี error เลย อะไรเป็นตัวกำหนดว่าจะได้ผลแบบไหน?

**Thai Answer:** อยู่ที่ว่าตัวแปรนั้นถูก declare เป็น class member หรือเปล่า ถ้าถูกอ้างถึงแต่ไม่เคย declare เลย (ไม่มี `field: Type;` และไม่มีจุด assign ที่ไหนเลย) TypeScript compiler จะ error ทันที "Property does not exist on type" ตั้งแต่ compile time แต่ถ้า declare ไว้แล้ว (แม้ไม่มี default value หรือไม่เคย assign) TypeScript จะถือว่าการอ้างอิงถูกต้อง ค่าจะเป็น `undefined` ตอน runtime เฉย ๆ ซึ่งเป็นค่าที่ถูกต้องตาม type ส่วนใหญ่ (เว้นแต่เปิด strict initialization check) จึงไม่มี error อะไรเลย บั๊กจะซ่อนอยู่จนกว่าจะมี logic ใหม่ที่ต้องพึ่งค่าจริงของมัน

**Thai Explanation:** สรุปสั้น ๆ compiler ตรวจจับ "ไม่มีตัวตน" (ไม่ declare) ได้ทันที แต่ตรวจจับ "มีตัวตนแต่ว่างเปล่า" (declare แต่ไม่ assign) ไม่ได้เลย ต้องอาศัยการ grep/review เอง — ดู [[Declared but Unassigned State]] สำหรับกรณีหลัง

Related: [[Declared but Unassigned State]], [[Force-Show Feature by Task Code Allowlist]]

Source: [[2026-07-10]]
