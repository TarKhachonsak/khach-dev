---
tags: [angular, formio, devextreme, bug, data-mapping]
date: 2026-06-30
---

# Over-Mapping All Fields to TEMP Suffix

## สิ่งที่เกิดขึ้น

ฟังก์ชัน `addTempFields` สร้าง `_TEMP` suffix ให้ **ทุก field** แล้ว replace `formData` ทั้งหมด ทำให้ field อื่นที่ template ใช้อยู่ เช่น `PENALTY_INFO_ID` หายไป

```typescript
// ❌ ผิด — replace ทุก field ด้วย _TEMP version
private addTempFields(data: any): any {
    const result: any = {};
    Object.keys(data).forEach((key) => {
        result[`${key}_TEMP`] = data[key];  // PENALTY_INFO_ID → PENALTY_INFO_ID_TEMP
    });
    return result;
}
// หลัง assign → _formData ไม่มี PENALTY_INFO_ID อีกต่อไป
```

```typescript
// ✅ ถูก — เพิ่มเฉพาะ field ที่ต้องการ
const offense = this._dsSection.find((x) => x.OFFENSE_INFO_ID === source.OFFENSE_INFO_ID);
if (offense) {
    this._formData = {
        ...source,
        OFFENSE_INFO_FULL_NAME_TEMP: offense.OFFENSE_INFO_FULL_NAME,
    };
}
```

## Root Cause

ออกแบบ `addTempFields` ให้ generic เกินไป แต่ในความเป็นจริงมีแค่ field เดียวที่ต้องการ `_TEMP` suffix

## หลักการ

**YAGNI (You Aren't Gonna Need It)** — อย่าสร้าง abstraction สำหรับ use case ที่ยังไม่มีอยู่จริง

## วิธีป้องกัน

ก่อนสร้าง helper ที่ map ทุก field ให้ตรวจว่า HTML template ใช้ field ไหนจริง ๆ บ้าง

## Interview Question

> What is YAGNI and when does over-abstraction cause bugs?

YAGNI = ไม่สร้างสิ่งที่ "อาจจะ" ต้องใช้ในอนาคต — over-abstraction เช่น map ทุก field ทำให้เกิด unintended side effect กับ field ที่ไม่เกี่ยวข้อง

Related: [[Angular Input Object Reference]], [[2026-06-30]]
