# Duplicated Payload-Building Logic Drifts Out of Sync

## What happened?

กด "บันทึกข้อมูล" (save draft) แล้วฟิลด์เวลา (`INVESTIGATION_START_TIME`/`COMPLETION_TIME`) ถูกบันทึกถูกต้อง แต่กด "ยืนยันส่งขั้นตอนถัดไป" (ซึ่งเรียก save draft ตัวเดิมก่อน แล้วค่อยเรียก flow อีกฟังก์ชันต่อ) ฟิลด์เดียวกันกลับกลายเป็น `null`

## Root Cause

component เดียวกันมี **สองจุด** ที่ build request payload (object เดียวกันในความหมาย ส่งไป backend คนละ endpoint) แยกจากกันโดยสิ้นเชิง:

```typescript
// ฟังก์ชัน onSave() — ใช้ตอน save draft
const params = {
  ...this._formData,
  // ... fields อื่น ๆ
};
if (params.INVESTIGATION_START_TIME) {
  params.INVESTIGATION_START_TIME = formatTimeToHHmm(params.INVESTIGATION_START_TIME); // ✅ format ไว้
}

// ฟังก์ชัน Sentflow() — ใช้ตอนส่ง flow ถัดไป, เรียกหลัง onSave() สำเร็จ
Sentflow() {
  const params = {
    ...this._formData,
    ...this._formDataio,  // ❌ ไม่มี guard, ไม่ format เวลา, และ spread ทับด้วย
    // ... fields อื่น ๆ (โครงสร้างคล้ายกันมาก แต่ copy-paste แยกไฟล์)
  };
  // ไม่มีการ format เวลาเลยตรงนี้ — ลืม copy บล็อกนี้มาด้วย
}
```

ทั้งสองฟังก์ชัน build `params` จาก `_formData` เหมือนกัน โครงสร้างเกือบเหมือนกันทุกบรรทัด (ชัดเจนว่า copy-paste มาจากกัน) แต่ logic การ format ฟิลด์เวลา (เพิ่มเข้ามาทีหลังเพื่อแก้บั๊กอื่น) ถูกเพิ่มเข้าไปแค่จุดเดียว — เมื่อมีคน "แก้บั๊ก" ที่ `onSave()` จุดเดียว โดยไม่รู้ว่ามี `Sentflow()` เป็น copy คู่ขนานอยู่ บั๊กเดิมก็ยังคงอยู่ในอีกจุดหนึ่ง

## How was it fixed?

เพิ่ม logic เดียวกัน (เขียนทับ field เวลาด้วยค่าที่ format แล้วจาก `_formData`) ใน `Sentflow()` ด้วย — เป็นการแก้แบบ "sync สองจุดให้ตรงกัน" ไม่ใช่ทางแก้ระยะยาวที่แท้จริง

## Prevention

- เมื่อเจอ 2 ฟังก์ชันที่ build object โครงสร้างคล้ายกันมาก (`params = { ...this._formData, ... }` ซ้ำกันหลายที่ในไฟล์เดียวกัน) ให้สงสัยทันทีว่าเป็น copy-paste ที่จะ drift ออกจากกันเรื่อย ๆ ทุกครั้งที่มีคนแก้จุดเดียว
- ทางแก้ระยะยาวที่ถูกต้องกว่า: ดึง logic build payload ออกเป็น shared private method เดียว (เช่น `_buildParams()` ที่มีอยู่แล้วในบางจุดของไฟล์เดียวกันนี้) แล้วให้ทั้ง save draft และ sentFlow เรียกใช้ตัวเดียวกัน — แก้บั๊กครั้งเดียวจบทั้งสองที่
- เวลา grep เพื่อแก้บั๊กที่ field ใดฟิลด์หนึ่ง (เช่น `INVESTIGATION_START_TIME`) ต้อง grep **ทั้งไฟล์** ไม่ใช่แค่จุดที่ error message ชี้ไป — ถ้าเจอ field เดียวกันถูกอ้างในหลายฟังก์ชัน ต้องเช็คทุกจุดว่า fix ต้องใส่ครบไหม

## Engineering Principle

> Copy-paste code สร้างภาระ "sync manually ตลอดไป" — ทุกครั้งที่ business logic ของจุดต้นทางเปลี่ยน (เช่น เพิ่ม format/validation ใหม่) ต้องจำให้ได้ว่ามี copy อยู่ที่ไหนบ้างแล้วไปแก้ตามให้ครบ ถ้าลืมแม้แค่จุดเดียว บั๊กจะกลับมาแบบ "เคยแก้ไปแล้วนี่" ซึ่งสร้างความสับสนเวลา debug มากกว่าบั๊กใหม่ปกติ — DRY (Don't Repeat Yourself) ไม่ใช่แค่เรื่องความสวยงามของโค้ด แต่ป้องกัน bug class นี้โดยตรง

## Interview Question

**English Question:** A time-formatting bugfix was applied to one function that builds an API request payload. Weeks later, the same "already-fixed" bug reappears — but only when a *different* button (which internally calls a second, separate function building a structurally similar payload) is used. What's the underlying design flaw, and what's the fix that actually prevents recurrence?

**English Answer:** The two functions are copy-pasted duplicates that build conceptually the same payload but drifted out of sync — the fix only touched one copy. Patching the second copy to match "solves" this instance but doesn't prevent the next drift. The durable fix is to extract the shared payload-building logic into a single method both call sites invoke, so any future fix only needs to happen once.

**Thai Question:** บั๊กเรื่อง format เวลาถูกแก้ไปแล้วในฟังก์ชันหนึ่งที่ build payload ส่งไป API แต่อีกไม่กี่สัปดาห์ต่อมา บั๊กที่ "เคยแก้แล้ว" กลับมาอีก แต่เกิดเฉพาะตอนกดปุ่มอีกปุ่มหนึ่ง (ซึ่งข้างในเรียกอีกฟังก์ชันที่ build payload โครงสร้างคล้ายกันแยกต่างหาก) ปัญหาการออกแบบที่แท้จริงคืออะไร แล้วทางแก้ที่ป้องกันไม่ให้เกิดซ้ำจริง ๆ คืออะไร?

**Thai Answer:** สองฟังก์ชันนี้เป็น copy-paste ที่ build payload ความหมายเดียวกันแต่แยกกันคนละก้อนโค้ด แล้ว drift ออกจากกันเพราะการแก้บั๊กครั้งก่อนแตะแค่ก้อนเดียว การไปแก้ก้อนที่สองให้ตรงกันแค่ "แก้ปัญหาเฉพาะหน้า" ไม่ได้ป้องกันการ drift ครั้งถัดไป ทางแก้ที่ยั่งยืนกว่าคือดึง logic build payload ออกมาเป็น method เดียวที่ทั้งสองจุดเรียกใช้ร่วมกัน เพื่อให้การแก้บั๊กในอนาคตทำแค่ที่เดียวพอ

**Thai Explanation:** สัญญาณเตือนที่ควรจับได้ตั้งแต่ตอน code review คือเห็น object literal โครงสร้างคล้ายกันมาก (`{ ...this._formData, field1, field2, ... }`) ซ้ำกันในไฟล์เดียวกันหลายจุด — นั่นคือ "DRY violation" ที่รอวันสร้างบั๊กแบบนี้อยู่แล้ว

Related: [[Object Spread Merge Pattern]], [[FormData Overwritten by Double Assignment]]

Source: [[2026-07-10]]
