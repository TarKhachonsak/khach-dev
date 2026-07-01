# Duplicate Panel with Different Variable

## What happened?

Panel "ความเห็นในการพิจารณาค่าปรับ" แสดงใน `FLOW_04_TASK_022` ทั้งที่ใส่ condition ซ่อนแล้ว

## Why did it happen?

มี panel **2 ตัวที่หน้าตาเหมือนกัน** ในไฟล์ HTML เดียว แต่ใช้ variable ต่างกัน:

- Panel 1: เช็ค `_taskFormCode` — มี `FLOW_04_TASK_022` → ซ่อนถูก ✓
- Panel 2: เช็ค `_formcode` — ไม่มี `FLOW_04_TASK_022` → แสดงออกมา ✗

เมื่อ developer ซ่อน panel ที่ 1 จึงมองข้าม panel ที่ 2 ไป

## How was it fixed?

เพิ่ม `'FLOW_04_TASK_022'` เข้า list ของ panel ที่ 2

## How to prevent?

- ก่อน debug ให้ grep หา component / section header name เสมอ — อาจมี DOM node ซ้ำ
- Panel ซ้ำที่แตกต่างกันแค่ list ใน condition ควร refactor รวมเป็นตัวเดียว

## Engineering Principle

> เมื่อ condition ไม่ทำงานตามคาด ให้ตรวจว่ามี DOM element อื่นที่ control การแสดงผลเดียวกันอยู่หรือไม่ ก่อนสมมติว่า variable ผิด

Related: [[Boolean Condition Truth Table]], [[DevExtreme dx-form Rendering Rules]]