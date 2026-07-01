# Bug: Child Component Array ไม่ Sync กับ Parent เมื่อ Save

## What Happened?

ใน `form-104` ส่ง `[formData]="_formData"` ให้ `crime-scene-investigator-form` แต่ไม่ได้ส่ง `[dataSource]` — ทำให้ officers ที่เพิ่มใน child ไม่ถูก save เมื่อ parent กด save

## Root Cause

```typescript
// crime-scene-investigator-form.component.ts
ngOnChanges(changes: SimpleChanges): void {
    if (changes['formData']) {
        this._dsROD_FIR_TXN_OFFICERS_FORM_GROUP = this.dataSource ?? [];
        // dataSource = undefined (ไม่ได้ส่งมา) → เริ่มเป็น []
    }
}
```

Child สร้าง local array `_dsROD_FIR_TXN_OFFICERS_FORM_GROUP` ของตัวเอง (array ใหม่ ไม่ใช่ของ parent)

เมื่อ parent save:
```typescript
// form-104 save params
ROD_FIR_TXN_OFFICERS_FORM_GROUP: [...this._dsROD_FIR_TXN_OFFICERS_FORM_GROUP]
// ใช้ array ของ parent เอง → ไม่รู้ว่า child เพิ่มอะไรไป
```

## Fix

**1. ส่ง dataSource จาก parent:**
```html
<app-crime-scene-investigator-form
    [formData]="_formData"
    [dataSource]="_dsROD_FIR_TXN_OFFICERS_FORM_GROUP">
</app-crime-scene-investigator-form>
```

**2. Child รับ reference เดียวกัน:**
```typescript
ngOnChanges(changes: SimpleChanges): void {
    if (changes['formData'] || changes['dataSource']) {
        this._dsROD_FIR_TXN_OFFICERS_FORM_GROUP = this.dataSource ?? [];
        // ชี้ไปที่ array ของ parent — same reference
    }
}
```

**3. Child push/splice array เดิม → parent เห็นทันที:**
```typescript
this._dsROD_FIR_TXN_OFFICERS_FORM_GROUP.push({ ...newItem }); // mutate in-place
```

## How to Prevent

- เมื่อ child จัดการ list ที่ parent ต้องการ save → **ต้องส่ง array เป็น `@Input()`**
- หรือใช้ `@Output()` emit array กลับทุกครั้งที่มีการเปลี่ยนแปลง

## Engineering Principle

> ข้อมูลที่ parent เป็น source of truth → parent ต้องส่ง reference ให้ child  
> Child ไม่ควรสร้าง local copy ของ data ที่ต้อง sync กับ parent

Related: [[Angular Input Object Reference]]
