# DevExtreme Callback Context

## What happened?

DevExtreme event handler เช่น `onValueChanged` เรียก regular method แล้ว `this` กลายเป็น `undefined` หรือไม่ใช่ Angular component instance

## Why did it happen?

DevExtreme เรียก callback ด้วย context ของ widget ทำให้ regular function มี dynamic `this` ตาม caller

## How was it fixed?

เปลี่ยน handler เป็น arrow function เพื่อ preserve lexical `this`

```typescript
onOfficerChanged = (e: any) => {
  this.formData.OFFICER_ID = e.value;
};
```

## Prevention

- ใช้ arrow function กับ DevExtreme callbacks ที่ต้อง access `this`
- ระวัง callback จาก third-party library ทุกตัว ไม่ใช่เฉพาะ DevExtreme

## Engineering Principle

Callback ownership สำคัญพอ ๆ กับ function body ถ้า library เป็นคนเรียก function ต้องคิดเสมอว่า `this` จะถูก bind โดยใคร

Related: [[Angular Input Object Reference]]
