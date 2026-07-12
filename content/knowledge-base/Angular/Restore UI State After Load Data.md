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

Related: [[Boolean Condition Truth Table]], [[DevExtreme dx-form Rendering Rules]], [[Patch Formio Schema Dynamically]], [[Getter With Side Effect Breaks Change Detection]]

## Real Example 2 — local visibility flag ไม่ restore ตอน component ถูกสร้างใหม่ (BMA ROD Project)

component แสดงแผนที่/field ละติจูด-ลองจิจูดที่คุมด้วย local flag `_isMapVisible` — flag นี้ reset เป็น `false` เสมอทุกครั้งที่ component ถูกสร้างใหม่ (เช่น ตอน user กด "ถัดไป" แล้ว "ย้อนกลับ" มาหน้าเดิม ซึ่ง Angular destroy/recreate component ผ่าน `*ngIf`) ทั้งที่ `formData` (ส่งมาจาก parent, persist ข้าม navigation) มีพิกัดที่บันทึกไว้แล้วจริง ๆ

Fix ตรงตาม pattern เดียวกับด้านบน — restore flag จาก persisted data ใน `ngOnChanges`:

```typescript
ngOnChanges(changes: SimpleChanges): void {
  if (changes['formData']) {
    const currentData = changes['formData'].currentValue;
    if (!this._isMapVisible && currentData?.LATITUDE && currentData?.LONGITUDE) {
      this._isMapVisible = true;
    }
  }
}
```

ย้ำหลักการเดิม: **local UI-visibility flag ต้องคำนวณจาก "แหล่งความจริงที่ persist" (`formData`) เสมอ ไม่ใช่พึ่งแค่ local field ที่ reset ทุกครั้ง component lifecycle เริ่มใหม่**

Source เพิ่มเติม: [[2026-07-10]]
