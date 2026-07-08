# Duplicate Component Registration Checklist

## What happened?

ต้อง duplicate component เดิม (`Form395OfficerTaskComponent`) เป็น component ใหม่แยกอิสระ (`Form398OfficerTaskComponent`) เพราะเดิมสอง task (`FLOW_05_TASK_395`, `FLOW_05_TASK_398`) ใช้ component ตัวเดียวกันร่วมกันอยู่

## Why "แค่ copy ไฟล์" ไม่พอ

Angular component หนึ่งตัวต้องถูก "รู้จัก" ใน 2 ที่ที่แยกกันเสมอ ถ้าขาดจุดใดจุดหนึ่งจะ compile error หรือ runtime ไม่ resolve component:

1. **NgModule declarations** — ทุก component ต้องอยู่ใน `declarations` ของ module ที่เกี่ยวข้อง (`app.module.ts`) ไม่งั้น Angular compiler จะไม่รู้จัก selector นี้เลย
2. **Business mapping/router-like service** — ในโปรเจกต์นี้คือ `FormComponentMap` ใน `form-render.component.ts` ที่ผูก task code (`FLOW_05_TASK_398`) เข้ากับ component class — ถ้าไม่แก้จุดนี้ task จะยังคง render component เก่าอยู่ (import ผิดจุดเดียวไม่พอ ต้องเปลี่ยน mapping ด้วย)

## Fix Checklist

เมื่อ duplicate component ให้ทำครบทุกข้อ:

- [ ] สร้างไฟล์ `.component.ts` / `.html` / `.scss` ใหม่ พร้อมเปลี่ยน `selector`, class name, `templateUrl`, `styleUrls` ให้ตรงกับไฟล์ใหม่ทั้งหมด (อย่าเหลือ reference เก่าปนอยู่)
- [ ] เปลี่ยน hardcoded string ที่ผูกกับ task code เดิมในไฟล์ (เช่น `*ngIf="_formcode !== 'FLOW_05_TASK_395'"`) ให้เป็น task code ใหม่ ไม่งั้น logic จะยังอ้างอิง task เดิม
- [ ] เพิ่ม `import` + declaration ใน `app.module.ts`
- [ ] เพิ่ม `import` และแก้ mapping ใน `form-render.component.ts` (`FormComponentMap`) — เปลี่ยนจาก component เก่าเป็นตัวใหม่
- [ ] `ng build` ยืนยันว่า component ใหม่ compile ผ่านจริง (ไม่ใช่แค่ TypeScript ไม่ error แต่ compiler เจอ component ใน template จริง)

## Engineering Principle

> ใน Angular ทุก component ต้องถูก "wire" อย่างน้อย 2 ชั้นเสมอ: framework-level (NgModule) และ application-level (routing/mapping ของโปรเจกต์) — การ duplicate component ที่ทำแค่ copy ไฟล์แล้วลืมชั้นใดชั้นหนึ่ง จะทำให้ของเก่ายังถูกใช้งานอยู่โดยไม่มี error เตือน

Related: [[Angular CLI Build Out of Memory]], [[Duplicate Panel with Different Variable]]

อ้างอิงจาก: [[2026-07-02]]
