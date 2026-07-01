# DevExtreme dx-form Content Not Rendering

## What happened?

ใน Angular + DevExtreme มีทั้ง custom component, plain HTML และ button ที่ไม่ render ภายใน `dx-form` รวมถึงบาง section ซ่อนแล้วเหลือ empty card border

## Root Cause

- `*ngIf` อยู่บน `dxi-item` ทำให้ DevExtreme ยังสร้าง wrapper ไว้
- custom component วางใน `dxi-item` โดยไม่มี `ng-template dxTemplate="item"`
- plain HTML วางตรงใน `dx-form` โดยไม่ผ่าน `dxi-item`

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

## Prevention

- Treat `dx-form` as DevExtreme-managed layout, not normal Angular HTML
- Put conditions outside `dxi-item` when hiding whole sections
- Put all custom item content inside `dxTemplate="item"`

Related: [[DevExtreme dx-form Rendering Rules]]

