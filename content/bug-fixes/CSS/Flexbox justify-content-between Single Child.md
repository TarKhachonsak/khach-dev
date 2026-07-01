# Flexbox justify-content-between Single Child

## What happened?

ปุ่ม "ยืนยันส่งขั้นตอนถัดไป" ไม่ชิดขวาหลังซ่อนปุ่มร่างด้วย `*ngIf`

## Why did it happen?

`justify-content: space-between` จะกระจาย children ไปสองฝั่งก็ต่อเมื่อมี **2 children ขึ้นไป** เมื่อ DOM เหลือ element เดียว element นั้นจะอยู่ฝั่งซ้าย (start) ตาม flex default

```html
<!-- ปุ่มร่างถูก *ngIf ซ่อน → เหลือ 1 element → ไม่ชิดขวา -->
<div class="d-flex justify-content-between">
  <div *ngIf="false">ปุ่มร่าง</div>
  <button>ยืนยัน</button>  ← อยู่ซ้าย
</div>
```

## How was it fixed?

เปลี่ยน justify class แบบ dynamic ด้วย `[ngClass]` บน parent:

```html
<div class="d-flex mb-2"
     [ngClass]="condition ? 'justify-content-end' : 'justify-content-between'">
  <div *ngIf="!condition">ปุ่มร่าง</div>
  <button>ยืนยัน</button>
</div>
```

- มี 2 ปุ่ม → `justify-content-between`
- มีปุ่มเดียว → `justify-content-end`

## How to prevent?

เมื่อ layout ใช้ `justify-content-between` และบาง child อาจถูก `*ngIf` ซ่อน ให้วาง logic ที่ **parent** แทนที่จะแก้ที่ element ลูก

## Engineering Principle

> Flexbox alignment เป็น function ของ child count — layout logic ที่ถูกต้องต้องคำนึงถึงจำนวน children ที่อาจเปลี่ยนแบบ dynamic

Related: [[Boolean Condition Truth Table]], [[Angular and DevExtreme Interview Questions]]