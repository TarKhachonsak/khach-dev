# DevExtreme dx-form Rendering Rules

## What happened?

ใน Angular + DevExtreme บาง section, card, button หรือ custom component ภายใน `dx-form` ไม่ render หรือเหลือ border ว่าง แม้ Angular condition ดูถูกต้อง

## Why did it happen?

DevExtreme `dx-form` จัดการ item rendering ผ่าน `dxi-item` และ template slot ของตัวเอง ไม่ได้ render arbitrary Angular content แบบ template ปกติทุกกรณี

## Rendering Rules

1. ถ้าต้องซ่อน `dxi-item` ทั้งก้อน ให้ใช้ `ng-container *ngIf` ครอบด้านนอก
2. ถ้าวาง custom Angular component ใน `dxi-item` ให้ห่อด้วย `ng-template dxTemplate="item"`
3. อย่าวาง plain HTML ตรง ๆ ใน `dx-form`; ให้ใส่ใน `dxi-item` + `dxTemplate` หรือย้ายออกนอก `dx-form`
4. ถ้าเห็น empty card/border ให้สงสัย wrapper ของ DevExtreme ก่อน
5. ชื่อ `cellTemplate` / `dxTemplate="let x of 'name'"` ต้อง unique ทั่วทั้ง form — copy-paste block เดิมไปหน้าอื่นแล้วลืมเปลี่ยนชื่อจะทำให้ template หลังไม่ทำงาน (ดู [[Duplicate cellTemplate Name in dx-form]])
6. ห้ามใส่ `*ngIf` บน `<ng-template dxTemplate="item">` โดยตรง — ถ้าต้องสลับเนื้อหาตาม condition ให้ ng-template คงที่ตัวเดียว แล้วสลับด้วย `<ng-container *ngIf>` ข้างในแทน ไม่งั้นจะไม่ render เลย หรือ render ช้ากว่า 1 รอบ change detection (ดู [[DevExtreme dx-form Content Not Rendering]])

## Correct Pattern

```html
<ng-container *ngIf="shouldShowSection">
  <dxi-item itemType="group" [colCount]="1" cssClass="card border">
    <ng-template dxTemplate="item">
      <app-custom-section [formData]="_formData"></app-custom-section>
    </ng-template>
  </dxi-item>
</ng-container>
```

## Engineering Principle

เมื่อใช้ UI library ที่มี rendering pipeline ของตัวเอง ต้องทำตาม template contract ของ library ไม่ใช่สมมติว่า Angular DOM projection จะทำงานเหมือน HTML ปกติ

Related: [[DevExtreme dx-form Item Template Snippets]], [[Boolean Condition Truth Table]], [[Duplicate Panel with Different Variable]], [[Duplicate cellTemplate Name in dx-form]], [[Multi-Page Form Stepper Pattern]], [[DevExtreme dx-form Content Not Rendering]]

Source: [[2026-07-06]]

