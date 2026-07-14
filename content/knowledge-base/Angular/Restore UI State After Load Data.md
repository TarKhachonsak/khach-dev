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

## Real Example 3 — cascading dropdown dataSource ไม่ replay ตอน set formData ทั้งก้อนใหม่ (BMA ROD Project)

`AccuserFormAddComponent.onEditAccuser()` โหลดข้อมูลผู้แจ้งที่บันทึกไว้แล้ว (มี `PERSON_REPORT_ADDR_PROVINCE/DISTRICT/SUBDISTRICT/POSTCODE` เป็น id ครบ) เข้ามาแก้ไข แต่ dropdown อำเภอ/เขต, ตำบล/แขวง, รหัสไปรษณีย์ กลับว่างเปล่า — ทั้งที่ค่า id ยังอยู่ครบใน object (ยืนยันจาก console.log)

**Root cause:** dropdown เหล่านี้เป็น cascading (`dataSource` ของ district ขึ้นกับ province ที่เลือก, subdistrict ขึ้นกับ district) — `_dsContractDistrict`/`_dsContractSubDistrict`/`_dsContractPostCode` เริ่มต้นเป็น `[]` เปล่า และถูกเติมข้อมูลแค่ตอน `onValueChanged` ของ dropdown ระดับบนทำงาน (fire เฉพาะตอน **user เปลี่ยนค่าเอง**) พอ set `formData` ทั้งก้อนใหม่ตรงๆ (ไม่ใช่ user โต้ตอบ) event นี้ไม่ fire → dataSource ค้างว่าง → SelectBox หา item ที่ตรงกับ id เดิมไม่เจอ → label ไม่ render (province ไม่พังเพราะ dataSource ของมันโหลดจาก master data ตอน `ngOnInit` ไว้ล่วงหน้าแล้ว ไม่ได้พึ่ง cascade)

**Fix:** เรียก cascade handler เดิม (`onSelectedconProvince`, `onSelectedconDistrict`, `onSelectedconSubDistrict`) ด้วย id ที่โหลดมาเอง ทันทีหลัง set ข้อมูล:

```typescript
onEditAccuser(cell: any) {
    this._formData_ROD_FIR_TXN_PERSON_REPORT = { ...cell.data };
    // ... state อื่นๆ

    const rp = this._formData_ROD_FIR_TXN_PERSON_REPORT;
    if (rp.PERSON_REPORT_ADDR_PROVINCE) this.onSelectedconProvince({ value: rp.PERSON_REPORT_ADDR_PROVINCE });
    if (rp.PERSON_REPORT_ADDR_DISTRICT) this.onSelectedconDistrict({ value: rp.PERSON_REPORT_ADDR_DISTRICT });
    if (rp.PERSON_REPORT_ADDR_SUBDISTRICT) this.onSelectedconSubDistrict({ value: rp.PERSON_REPORT_ADDR_SUBDISTRICT });
}
```

ข้อควรระวัง: บาง handler มี guard ที่เช็ค `e.previousValue` เพื่อแยก "โหลดข้อมูลครั้งแรก" ออกจาก "user เปลี่ยนค่าจริง" (เช่น ไม่ null ค่า postcode เดิมถ้าเป็นการ replay ครั้งแรก) — ต้อง**ไม่ส่ง** `previousValue` ตอน replay เพื่อให้ guard ตีความว่าเป็น initial ถูกต้อง

## Real Example 4 — field คำนวณฝั่ง client ไม่ recompute หลัง reload จาก backend (BMA ROD Project)

`CrimeSceneInvestigatorFormComponent` มี field `OFFICER_JOB_NAME` (ตำแหน่งเจ้าหน้าที่) ที่คำนวณจาก `OFFICER_ID` + officer list ตอน user เลือกชื่อจาก dropdown เอง (`onOfficerChanged()`) เป็นเพียง **UI helper label ไม่ใช่ business data ที่ backend persist กลับมา** — หลัง save draft สำเร็จแล้ว parent reload ข้อมูลจาก backend ใหม่ทั้งก้อน field นี้เลยว่างเปล่าเสมอ (backend ไม่ได้ส่งค่านี้กลับมา และไม่มีจุดไหน recompute ใหม่)

**Fix:** เพิ่ม helper คำนวณค่านี้ใหม่จากข้อมูลที่ persist จริง (`OFFICER_ID`) เรียกทั้งใน `ngOnChanges` (ทุกครั้งที่ formData เข้ามาใหม่) และ `ngOnInit` (หลังโหลด officer list เสร็จ เผื่อ formData มาถึงก่อน list พร้อม):

```typescript
private recomputeOfficerJobName(): void {
    if (!this.formData) return;
    const officerId = this.formData.OFFICER_ID ?? this.formData.RECORDER_ID;
    if (!officerId) return;
    const item = this._dsOfficersList.find((x: any) => x.OFFICERS_ID === officerId);
    if (item) this.formData.OFFICER_JOB_NAME = item.WORK_LINE_NAME;
}
```

หลักการเดียวกับ Real Example 1-3 แต่ต่างที่ตัวสาเหตุ: ไม่ใช่ "ไม่มี event fire" แต่คือ **field ที่แสดงผลเป็นค่าที่ derive/compute ล้วนๆ ไม่มีอยู่จริงใน persisted data** — ต้อง treat แยกจาก field ที่เป็น business data ตรงๆ เสมอ ทุกครั้งที่ persisted data (`formData`/`OFFICER_ID`) เปลี่ยน ต้อง derive ใหม่ ไม่ใช่หวังว่าค่าเดิมจะยังอยู่

Related: [[Child Array Not Synced to Parent on Save]], [[Case-Mismatched Property Binding Silently No-ops]]

Source เพิ่มเติม: [[2026-07-14]]
