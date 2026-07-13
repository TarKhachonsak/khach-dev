# DevExtreme Callback this Undefined

## What happened?

Event handler ของ DevExtreme เรียกแล้ว `this` เป็น undefined ทำให้ access component state ไม่ได้

## Root Cause

ใช้ regular method เป็น callback ให้ third-party widget ทำให้ `this` ถูกกำหนดโดย caller ของ DevExtreme ไม่ใช่ Angular component

## Fix

```typescript
onValueChanged = (e: any) => {
  this.formData.VALUE = e.value;
};
```

## Prevention

ใช้ arrow function สำหรับ DevExtreme callback ที่ต้องอ้างถึง component instance

## Alternative Fix: `.bind(this)` ที่จุดอ้างอิง (2026-07-13)

ถ้ามีเหตุผลที่ต้องใช้ regular method แทน arrow-function class property (เช่นโค้ดเดิมออกแบบไว้แบบนั้นแล้ว ไม่อยากเปลี่ยน signature) ยังแก้ปัญหาเดียวกันได้ด้วยการ `.bind(this)` ตรงจุดที่ส่ง reference เข้า `editorOptions`:

```typescript
// component: regular method (ไม่ auto-bind)
onExtensionDayChanged(e: any) { this._formData.EXTENSION_AMOUNT_DAY = ...; }
```

```html
<!-- template: ต้อง bind เอง ไม่งั้น this จะไม่ใช่ component -->
[editorOptions]="{ onValueChanged: onExtensionDayChanged.bind(this) }"
```

หลักการเดียวกับ arrow function — แค่ผูก `this` คนละจุด (arrow function ผูกตอน declare, `.bind(this)` ผูกตอนส่ง reference) ถ้าลืม `.bind(this)` ตรงนี้จะเจอบั๊กแบบเดียวกับโน้ตนี้ทันที

Related: [[DevExtreme Callback Context]], [[Function Reference Without Parentheses]]

Source: [[2026-07-13]]
