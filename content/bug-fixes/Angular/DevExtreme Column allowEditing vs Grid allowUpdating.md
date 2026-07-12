# DevExtreme Column allowEditing vs Grid allowUpdating

## What happened?

ใน `dx-data-grid` ที่ `editing.mode="cell"` และปิดการแก้ไขทั้ง grid ด้วย `[allowUpdating]="false"` มี column หนึ่ง (`EVIDENCE_OBJECT_OUT_DATE` — "วันที่คืน") แสดงพื้นหลังเป็นสีเทาแบบ editor cell ทั้งที่กดแก้ไม่ได้จริง ในขณะที่ column อื่นในกริดเดียวกันแสดงปกติ

## Why did it happen?

```html
<dxo-editing mode="cell" [allowUpdating]="false" [allowDeleting]="false" [allowAdding]="false"> </dxo-editing>

<!-- column อื่นทุกตัวมี allowEditing false ครบ -->
<dxi-column dataField="EVIDENCE_OBJECT_NAME" [allowEditing]="false"> </dxi-column>
<dxi-column dataField="EVIDENCE_OBJECT_QUANTITY" [allowEditing]="false"> </dxi-column>

<!-- column นี้ไม่มี allowEditing เลย -->
<dxi-column caption="วันที่คืน" dataField="EVIDENCE_OBJECT_OUT_DATE" [customizeText]="formatThaiDateText"> </dxi-column>
```

`allowUpdating` (ระดับ `dxo-editing`/grid) กับ `allowEditing` (ระดับ `dxi-column`) เป็นคนละ flag กัน:

- `allowUpdating: false` บล็อก**พฤติกรรม**การแก้ไขจริงทั้ง grid
- `allowEditing` ต่อ column กำหนด**การ render/CSS ของ cell** ว่าจะแสดงเป็น editor-look (เทา) หรือ plain text cell — DevExtreme เช็ค flag นี้ตอนคำนวณ style ของ cell โดยไม่สนใจว่า grid ปิด `allowUpdating` ไว้หรือไม่

เพราะ column นี้ไม่ได้ set `allowEditing` (default = `true`) DevExtreme เลย mark ว่า column นี้ "editable" แล้ว render พื้นหลังแบบ editor ทั้งที่กดจริงแล้วแก้ไม่ได้เพราะโดน `allowUpdating` บล็อกซ้ำอีกชั้น

## How was it fixed?

เพิ่ม `[allowEditing]="false"` ให้ column นี้ ให้ตรงกับ column พี่น้องทุกตัวในกริดเดียวกัน (และตรงกับ grid ตัวที่สองในไฟล์เดียวกันที่มี flag นี้ครบอยู่แล้ว ใช้เป็น reference ยืนยันว่า pattern ที่ถูกต้องคืออะไร):

```html
<dxi-column caption="วันที่คืน" dataField="EVIDENCE_OBJECT_OUT_DATE" alignment="center"
  [customizeText]="formatThaiDateText" [allowEditing]="false"> </dxi-column>
```

## How can it be prevented?

- เมื่อปิด edit ทั้ง grid ด้วย `allowUpdating: false` ยังต้องใส่ `[allowEditing]="false"` ให้ครบทุก column ด้วย — สอง flag นี้ไม่ได้ inherit กันอัตโนมัติ
- ถ้ามี grid เดียวกันซ้ำสองที่ในไฟล์ (เช่น edit mode vs view mode) ให้ diff column definitions ระหว่างสอง grid เทียบกันเป็น checklist ว่า flag อะไรขาดหายไปจากอันหนึ่ง
- อาการ "เทาผิดที่เดียว ทั้งที่ column อื่นปกติ" ให้สงสัย column-level flag ที่ขาด ก่อนไปหาสาเหตุที่ระดับ grid/CSS ทั่วไป

## Engineering Principle

Library ที่มี rendering pipeline เป็นของตัวเอง (เช่น DevExtreme) มักแยก flag ระดับ "พฤติกรรม" (behavior) กับระดับ "การแสดงผล" (style/appearance) ออกจากกันตาม scope (grid-level vs column-level) — ปิด behavior ที่ scope บนไม่ได้แปลว่า style ที่ scope ล่างจะถูกปิดตามไปด้วยเสมอ ต้องเช็คทั้งสอง scope แยกกัน

## Interview Question

**English Question:** In a DevExtreme `dx-data-grid` with `editing.mode="cell"`, you set `allowUpdating: false` at the grid level, but one column still renders with an "editable" grey background even though it can't actually be edited. Why?

**English Answer:** `allowUpdating` (grid-level) and `allowEditing` (column-level) are independent flags. `allowUpdating: false` blocks the actual edit behavior for the whole grid, but each column's `allowEditing` (defaulting to `true`) still controls how DevExtreme styles that cell — as an editor-look cell or a plain text cell — regardless of the grid-level setting. A column missing an explicit `allowEditing: false` gets the editor styling even though editing is functionally blocked.

**Thai Explanation:** `allowUpdating` ที่ grid กับ `allowEditing` ที่ column เป็นคนละ flag — ปิด `allowUpdating` แค่บล็อกการแก้ไขจริง แต่ style ของ cell (เทา/editor-look) ยังคุมด้วย `allowEditing` ของแต่ละ column แยกต่างหาก ถ้าลืมใส่ `allowEditing:false` ที่ column ใด column นั้นจะแสดงพื้นเทาทั้งที่กดแก้ไม่ได้จริง

Related: [[DevExtreme dx-form Rendering Rules]], [[DevExtreme Callback Context]]

Source: [[2026-07-08]]
