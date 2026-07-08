# Duplicate cellTemplate Name in dx-form

## What happened?

แบ่งฟอร์ม `dx-form` ออกเป็นหลายหน้า (multi-step) แล้ว copy กลุ่มปุ่มควบคุมหน้า (draft/next) จากหน้า 1 ไปวางในหน้า 2 โดยไม่เปลี่ยนชื่อ `cellTemplate` ปุ่มของหน้า 2 จึงพังแบบไม่มี error ในคอนโซล

## Root Cause

`dx-form` ใช้ `cellTemplate="XXX"` คู่กับ `<div *dxTemplate="let cell of 'XXX'">` เป็นกลไก register template ไว้ในสโคปเดียวกันของ form — ชื่อ template ต้อง unique ทั่วทั้ง form ถ้าซ้ำกัน DevExtreme จะ resolve ไปยัง template แรกที่เจอเท่านั้น ทำให้ dxi-item ตัวหลังที่ผูกชื่อซ้ำใช้งานไม่ได้ตามที่ตั้งใจ

## Fix

```html
<!-- หน้า 1 -->
<dxi-item itemType="group" cellTemplate="CellTemplatedPage1Buttons">
  <div *dxTemplate="let cell of 'CellTemplatedPage1Buttons'"> ... </div>
</dxi-item>

<!-- หน้า 2: ต้องใช้ชื่อไม่ซ้ำ -->
<dxi-item itemType="group" cellTemplate="CellTemplatedPage2Buttons">
  <div *dxTemplate="let cell of 'CellTemplatedPage2Buttons'"> ... </div>
</dxi-item>
```

## Prevention

- เวลา copy-paste block ที่มี `cellTemplate` / `dxTemplate="let ... of '...'"` ต้องเปลี่ยนชื่อ template ทุกครั้ง
- grep หาชื่อ template ซ้ำในไฟล์เดียวกันก่อน commit multi-page dx-form
- ตั้งชื่อ template ให้สื่อเลขหน้า/ตำแหน่งชัดเจน (`CellTemplatedPage{N}Buttons`) กันสับสน

Related: [[DevExtreme dx-form Rendering Rules]], [[Multi-Page Form Stepper Pattern]]

อ้างอิงจาก: [[2026-07-02]]
