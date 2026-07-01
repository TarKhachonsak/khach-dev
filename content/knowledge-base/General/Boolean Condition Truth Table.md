# Boolean Condition Truth Table

## What happened?

UI section ไม่ render เพราะ condition รวมหลายตัวแปรถูกเขียนเป็น `!A && B` ทั้งที่ requirement จริงคือซ่อนเฉพาะ `A && B`

## Why did it happen?

คิดจากเงื่อนไขด้าน "แสดงเมื่อไหร่" แต่ requirement เป็นด้าน "ซ่อนเมื่อไหร่" ทำให้ case อื่น เช่น `B = false` หรือ undefined ถูกซ่อนทั้งหมดโดยไม่ตั้งใจ

## How was it fixed?

เขียนจาก forbidden combination โดยตรง

```html
<ng-container *ngIf="!(isSpecificTask && approveValue === 'B')">
  ...
</ng-container>
```

## Prevention Checklist

- ถ้า condition มี 2 ตัวแปรขึ้นไป ให้ทำ truth table สั้น ๆ
- ถ้าต้องซ่อนเฉพาะ case เดียว ให้ใช้ `!(A && B)`
- ถ้าต้องแสดงเฉพาะ case เดียว ค่อยใช้ `A && B`

## Engineering Principle

Boolean expression ควรสะท้อน intent ของ requirement โดยตรง การเขียน condition จากด้านตรงข้ามโดยไม่ทำ truth table คือแหล่ง bug ที่เจอบ่อยใน UI

Related: [[Restore UI State After Load Data]], [[DevExtreme dx-form Rendering Rules]], [[Switch Case Fall-Through]], [[Flexbox justify-content-between Single Child]], [[Duplicate Panel with Different Variable]]

