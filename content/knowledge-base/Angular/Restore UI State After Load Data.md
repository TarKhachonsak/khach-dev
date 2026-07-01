# Restore UI State After Load Data

## What happened?

หลัง load draft จาก backend แล้ว section ที่ขึ้นกับ `approveValue` ไม่แสดง เพราะ `approveValue` ยังเป็น undefined

## Why did it happen?

ค่า `approveValue` ถูก set จาก form event เช่น `onFieldChange` เท่านั้น แต่ตอน hydrate saved data เข้า form event อาจไม่ถูกยิง หรือยิงก่อน component พร้อม

## How was it fixed?

restore state จาก saved data ภายใน `loadData()` หลัง assign form model แล้ว fallback ไปหา data source ที่เกี่ยวข้องถ้าจำเป็น

```typescript
const approveKey = `${this._taskFormCode.toLocaleLowerCase()}_approve`;
this.approveValue = this._formData?.[approveKey] ?? this._formDataio?.[approveKey];
```

## Prevention

- UI state ที่ control visibility ต้อง restore จาก backend data หลัง load เสมอ
- อย่าพึ่ง event จาก form renderer เป็น source เดียวของ truth
- ถ้ามี race condition ระหว่าง task metadata กับ saved data ให้แยก restore function แล้วเรียกเมื่อ dependency พร้อม

Related: [[Boolean Condition Truth Table]], [[DevExtreme dx-form Rendering Rules]], [[Patch Formio Schema Dynamically]]
