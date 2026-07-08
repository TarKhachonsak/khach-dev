# Angular CLI Build Out of Memory

## What happened?

`ng build --configuration=redesign` บนโปรเจกต์ Angular ขนาดใหญ่ (หลายร้อย component, DevExtreme + formio) ล่มด้วย `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory` ระหว่าง phase generate browser bundle

## Why did it happen?

Node.js จำกัด heap size ของ V8 ไว้ default (ประมาณ ~4GB บน 64-bit) โปรเจกต์ที่มี dependency หนัก (DevExtreme, formio) และ component จำนวนมากทำให้ TypeScript/Webpack compilation ใช้ memory เกิน limit ระหว่าง production build (มี optimization/minify เพิ่มเข้ามาด้วย)

## Fix

เรียก `ng` ผ่าน `node` โดยตรงพร้อมเพิ่ม `--max-old-space-size` แทนที่จะเรียก `ng build` ตรงๆ (เพราะ `ng` เป็นแค่ shell wrapper ที่ไม่ผ่าน flag ของ node ให้):

```bash
node --max-old-space-size=8192 node_modules/@angular/cli/bin/ng build --configuration=redesign
```

## Prevention

- โปรเจกต์ใหญ่ที่ build แล้ว OOM บ่อย ควรตั้ง script npm ที่ผูก flag นี้ไว้ถาวร (`"build:redesign": "node --max-old-space-size=8192 node_modules/@angular/cli/bin/ng build --configuration=redesign"`) แทนพิมพ์ยาวทุกครั้ง
- ค่า `8192` (8GB) เป็นจุดเริ่มต้นที่ปลอดภัย ปรับเพิ่มได้ถ้ายังไม่พอ ขึ้นกับ RAM เครื่อง
- ใช้ `run_in_background` เวลารัน build ที่ใช้เวลานาน (~1 นาทีขึ้นไป) จะได้ทำงานอื่นระหว่างรอ

Related: [[Angular and DevExtreme Interview Questions]]

อ้างอิงจาก: [[2026-07-02]]
