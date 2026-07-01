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

Related: [[DevExtreme Callback Context]]
