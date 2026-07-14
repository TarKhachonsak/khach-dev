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

Related: [[Angular Input Object Reference]], [[Array.isArray Guard on Wrong Variable Silently Drops Data]]

## Update 2026-07-14 — reference sharing เพียงอย่างเดียวไม่พอ ต้องมี @Output() ด้วย

พบว่า fix ข้างบน (ส่ง `[dataSource]` แล้วให้ child mutate reference เดิม) **แก้ได้แค่บางส่วน** — component เดียวกันนี้ (`crime-scene-investigator-form`) ใช้ใน form-63 ที่ bind `[dataSource]` ครบถูกต้องตาม fix นี้แล้ว แต่ยัง**หายซ้ำอีกครั้ง**ในสถานการณ์ต่างออกไป: หลัง user เพิ่มเจ้าหน้าที่คนใหม่แล้วกด "บันทึกร่าง" — parent เรียก `LoadDataCitizenSQL()` reload ข้อมูลจาก backend **reassign ทั้ง `_formData` และ `_dsROD_FIR_TXN_OFFICERS_FORM_GROUP` เป็น object/array ใหม่ทั้งคู่พร้อมกัน** ตัด reference เดิมที่ child กับ parent เคยแชร์กันอยู่ทิ้งไปเลย

**บทเรียน:** reference sharing (`this._dsX = this.dataSource ?? []` แล้วพึ่งว่า push/splice จะ mutate array เดิม) เป็นวิธีที่ **เปราะบางกว่าที่ fix เดิมคิดไว้** เพราะขึ้นอยู่กับสมมติฐานที่ควบคุมไม่ได้ทั้งหมด: parent ต้อง**ไม่เคย** reassign array ของตัวเองใหม่เลยตลอด lifecycle ของ component — สมมติฐานนี้ผิดทันทีที่มี flow ใดก็ตาม (reload, refresh, "ย้อนกลับ" แล้ว "ถัดไป") ที่ replace ทั้ง object

**Fix ที่ทนกว่า:** เพิ่ม `@Output() dataSourceChanged = new EventEmitter<any[]>()` แล้ว emit ทุกครั้งที่ child แก้ไข array (เพิ่ม/แก้/ลบ) — parent ฟัง event นี้แล้ว sync array ของตัวเองแบบ **explicit** แทนที่จะหวังพึ่ง reference เดิม:

```typescript
// child
this._dsROD_FIR_TXN_OFFICERS_FORM_GROUP.push({ ...newItem });
this.dataSourceChanged.emit(this._dsROD_FIR_TXN_OFFICERS_FORM_GROUP);
```
```html
<!-- parent -->
<app-crime-scene-investigator-form
    [dataSource]="_dsROD_FIR_TXN_OFFICERS_FORM_GROUP"
    (dataSourceChanged)="_dsROD_FIR_TXN_OFFICERS_FORM_GROUP = $event">
</app-crime-scene-investigator-form>
```

ตอนนี้ไม่ว่า parent จะ reassign array ของตัวเองกี่รอบก็ตาม (reload, refresh) child ก็ยัง sync การเปลี่ยนแปลงกลับไปได้ถูกต้องเสมอ เพราะไม่ได้พึ่งว่า reference สองฝั่งต้องเป็นก้อนเดียวกันอีกต่อไป

**หลักการที่แก้ไข:** parent-child array sync ที่ "ต้องทนต่อการ reload ข้อมูลใหม่ทั้งก้อน" ควรใช้ **`@Output()` แบบ explicit เสมอ** ไม่ใช่พึ่ง reference sharing แม้จะดู "ทำงานได้" ในตอนแรกก็ตาม — reference sharing เหมาะกับกรณีที่ parent รับประกันได้ว่าจะไม่ reassign array นั้นตลอดอายุของ component เท่านั้น ซึ่งเป็นสมมติฐานที่ยากจะรักษาไว้ในระยะยาว

Related: [[Restore UI State After Load Data]]

Source เพิ่มเติม: [[2026-07-14]]
