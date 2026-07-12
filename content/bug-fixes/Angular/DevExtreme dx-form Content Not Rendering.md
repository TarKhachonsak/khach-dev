# DevExtreme dx-form Content Not Rendering

## What happened?

ใน Angular + DevExtreme มีทั้ง custom component, plain HTML และ button ที่ไม่ render ภายใน `dx-form` รวมถึงบาง section ซ่อนแล้วเหลือ empty card border

## Root Cause

- `*ngIf` อยู่บน `dxi-item` ทำให้ DevExtreme ยังสร้าง wrapper ไว้
- custom component วางใน `dxi-item` โดยไม่มี `ng-template dxTemplate="item"`
- plain HTML วางตรงใน `dx-form` โดยไม่ผ่าน `dxi-item`
- **`*ngIf` วางอยู่บน `<ng-template dxTemplate="item">` เอง** — พบ 2 อาการต่างกันแล้วแต่ context:
  1. **ไม่ render เลยไม่ว่า condition จะจริงหรือไม่** — เพราะ Angular ห่อ element ที่มี `*ngIf` ด้วย ng-template อีกชั้นเสมอ (`*ngIf` sugar) ผลคือได้ `<ng-template [ngIf]><ng-template dxTemplate="item">content</ng-template></ng-template>` — ไม่มีตัวไหนเรียก `createEmbeddedView` ให้ ng-template ชั้นในเลย เนื้อหาจึงไม่ปรากฏ
  2. **render เฉพาะครั้งที่ 2 เป็นต้นไป (ครั้งแรกที่ ngIf เปลี่ยนจาก false→true ไม่ขึ้น)** — เมื่อมี 2 `<ng-template dxTemplate="item">` (ชื่อ template ซ้ำกัน) สลับกันด้วย `*ngIf` คนละตัว DevExtreme `ContentChildren(DxTemplateDirective)` sync ไม่ทันในรอบ change detection แรกที่ ngIf เพิ่งเปลี่ยน ต้อง toggle อีกรอบถึงจะ sync

## Fix

```html
<ng-container *ngIf="shouldShow">
  <dxi-item itemType="group" [colCount]="1">
    <ng-template dxTemplate="item">
      <div class="d-flex justify-content-end">
        <button type="button">Save</button>
      </div>
    </ng-template>
  </dxi-item>
</ng-container>
```

สำหรับกรณี `*ngIf` บน `<ng-template dxTemplate="item">` (root cause ข้อ 4): เหลือ `<ng-template dxTemplate="item">` ตัวเดียวเสมอ แล้วย้าย `*ngIf` เข้าไปไว้ใน `<ng-container>` ข้างในแทน — DevExtreme เห็น template คงที่ ไม่ต้อง re-discover ContentChildren ทุกครั้งที่ condition เปลี่ยน

```html
<!-- ❌ ผิด: ngIf อยู่บนตัว ng-template เอง -->
<ng-template dxTemplate="item" *ngIf="cond">...</ng-template>

<!-- ✅ ถูก: ng-template คงที่ ngIf ย้ายเข้าไปข้างใน -->
<ng-template dxTemplate="item">
  <ng-container *ngIf="cond">...</ng-container>
</ng-template>
```

## Prevention

- Treat `dx-form` as DevExtreme-managed layout, not normal Angular HTML
- Put conditions outside `dxi-item` when hiding whole sections
- Put all custom item content inside `dxTemplate="item"`
- **ห้ามใส่ `*ngIf` บน `<ng-template dxTemplate="...">` โดยตรงเด็ดขาด** ไม่ว่าจะสลับ 1 หรือ 2 ก้อน — ให้ ng-template คงที่แล้วสลับเนื้อหาข้างในด้วย `ng-container` เสมอ

Related: [[DevExtreme dx-form Rendering Rules]]

Source: [[2026-07-06]]

