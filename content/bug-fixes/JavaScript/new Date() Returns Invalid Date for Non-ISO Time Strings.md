# new Date() Returns Invalid Date for Non-ISO Time Strings

## What happened?

ฟิลด์เวลา (`INVESTIGATION_START_TIME`/`COMPLETION_TIME`) ที่โหลดมาจาก backend อยู่แล้วเป็น string รูปแบบ `"16:11"` กลายเป็นค่าว่างหลังผ่าน helper function `formatTimeToHHmm()` ทั้งที่ input truthy และดูเหมือน valid อยู่แล้ว — เกิดเฉพาะกรณีที่ user ไม่เคยแตะ time picker เลย (ใช้ค่าที่โหลดมาตรง ๆ)

## Root Cause

```typescript
export function formatTimeToHHmm(time: Date | string | number | null | undefined): string {
  if (!time) return '';
  const d = new Date(time);           // ❌ new Date("16:11") = Invalid Date
  if (isNaN(d.getTime())) return '';  // ผ่านเงื่อนไขนี้ → return ''
  ...
}
```

`new Date(string)` ใน JavaScript parse ได้เฉพาะรูปแบบที่ ECMAScript กำหนด (ISO 8601 เต็มรูปแบบ เช่น `"2026-01-01T16:11:00"`) หรือรูปแบบที่ browser รู้จักเป็นพิเศษ (เช่น `"Jan 1, 2026"`) — string แบบ `"16:11"` (เวลาเปล่า ไม่มีวันที่) **ไม่ใช่** รูปแบบที่ valid จึงได้ `Invalid Date` แบบ**เงียบ ๆ ไม่ throw error** โค้ดที่ไม่เช็ค `isNaN(d.getTime())` มักไม่รู้ตัวว่าพัง

สาเหตุที่ bug นี้ปรากฏเฉพาะบางกรณี: ถ้า user เพิ่งเลือกเวลาจาก `dxDateBox` (DevExtreme time picker) ค่าที่ได้จะเป็น **`Date` object จริง** ซึ่ง `new Date(dateObject)` parse ได้ปกติ — แต่ถ้าเป็นค่าที่ backend ส่งมาตรง ๆ (ผ่านการ format เป็น `"HH:mm"` ไว้แล้วตั้งแต่รอบ save ก่อนหน้า) จะเป็น **string** ที่ผิดรูปแบบสำหรับ `new Date()` ทันที

## How was it fixed?

เช็ค pattern ก่อนว่า input เป็น string ที่อยู่ในรูปแบบเป้าหมายอยู่แล้วหรือไม่ ถ้าใช่ให้ return ตรง ๆ โดยไม่ผ่าน `new Date()` เลย:

```typescript
export function formatTimeToHHmm(time: Date | string | number | null | undefined): string {
  if (!time) return '';

  if (typeof time === 'string' && /^\d{2}:\d{2}$/.test(time)) {
    return time;
  }

  const d = new Date(time);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
```

## How to debug (เมื่อยังไม่รู้ root cause)

log ค่าและ **type** ของ input ที่จุดก่อนและหลัง function ที่สงสัย — ไม่ใช่แค่ log ค่า เพราะ `"16:11"` (string) กับ `Date` object ทั้งคู่ดู "มีค่า" เหมือนกันตอน log แบบผิวเผิน แต่พฤติกรรมใน `new Date()` ต่างกันคนละเรื่อง:

```typescript
console.log({ value: time, type: typeof time }); // เห็นชัดว่าเป็น string ไม่ใช่ Date
```

## Prevention

- function ที่รับ union type กว้าง (`Date | string | number`) ต้องคิดถึงกรณี **input อยู่ในรูปแบบผลลัพธ์ที่ต้องการอยู่แล้ว** (idempotent case) เสมอ — ไม่ใช่แค่กรณี "แปลงจาก raw input"
- `new Date(x)` ไม่เคย throw error เมื่อ parse ไม่ได้ — ต้องเช็ค `isNaN(d.getTime())` ทุกครั้งที่ parse จาก string ที่ไม่รู้แน่ชัดว่ามาจากไหน
- เวลา field เดียวกันถูก set ได้จากสองแหล่ง (UI widget ที่ให้ `Date` object vs backend ที่ให้ `string` ที่ format แล้ว) ต้องออกแบบ helper ให้รองรับทั้งสองแบบ ไม่ใช่ assume ว่ามาจากแหล่งเดียวเสมอ

## Engineering Principle

> `new Date(invalidString)` คือ "silent failure" แบบคลาสสิกของ JavaScript — ไม่ throw, ไม่ warn, แค่คืนค่า object พิเศษที่ทุก field เป็น `NaN` เงียบ ๆ โค้ดที่ต่อจากนั้นต้อง defensive เช็ค `isNaN(d.getTime())` เอง มิฉะนั้น bug จะไหลต่อไปเป็น empty string/wrong value โดยไม่มีจุดไหน error ให้ตามรอยง่าย ๆ

## Interview Question

**English Question:** A helper function `formatTimeToHHmm(time)` accepts `Date | string | number`. It returns an empty string for a valid-looking input like `"16:11"`, but works fine for a `Date` object. What's the most likely cause, and how do you confirm it?

**English Answer:** `new Date("16:11")` is not a valid ECMAScript date-time string (it has no date component), so `new Date()` silently produces an `Invalid Date` rather than throwing — any downstream `isNaN(d.getTime())` check then discards it. Confirm by logging both the value and `typeof time` at the function's entry: if the failing case is a plain `"HH:mm"` string (e.g., loaded from a backend that already formatted it) while the working case is a live `Date` object from a UI picker, that's the signature of this bug. Fix by short-circuiting: if the string already matches the target output format, return it as-is instead of re-parsing through `new Date()`.

**Thai Question:** helper function `formatTimeToHHmm(time)` รับ type `Date | string | number` แต่คืนค่าว่างสำหรับ input ที่ดู valid เช่น `"16:11"` ทั้งที่ทำงานถูกต้องกับ `Date` object ปกติ สาเหตุที่เป็นไปได้มากที่สุดคืออะไร แล้วจะยืนยันยังไง?

**Thai Answer:** `new Date("16:11")` ไม่ใช่รูปแบบ date-time string ที่ ECMAScript รองรับ (ไม่มีส่วนวันที่) จึงได้ `Invalid Date` แบบเงียบ ๆ ไม่ throw error — เช็ค `isNaN(d.getTime())` ที่ต่อมาจะทิ้งค่านี้ไปเป็น string ว่าง ยืนยันได้โดย log ทั้งค่าและ `typeof time` ที่จุดเข้า function ถ้ากรณีที่พังเป็น string `"HH:mm"` ธรรมดา (เช่นโหลดมาจาก backend ที่ format ไว้แล้ว) ในขณะที่กรณีที่ทำงานถูกเป็น `Date` object จาก UI picker นั่นคือลายเซ็นของบั๊กนี้ แก้โดยเช็ค pattern ก่อน ถ้า string ตรงรูปแบบผลลัพธ์ที่ต้องการอยู่แล้วให้ return ตรง ๆ ไม่ต้องผ่าน `new Date()` ซ้ำ

**Thai Explanation:** บทเรียนสำคัญคือ `new Date()` เป็นฟังก์ชันที่ "fail แบบเงียบ" — ไม่มี error ให้เห็นตอน parse ไม่ได้ ต่างจากภาษาอื่นที่มักจะ throw exception ทำให้นักพัฒนาที่ไม่เช็ค `isNaN()` เจอบั๊กแบบนี้บ่อยโดยไม่รู้ตัว

Related: [[Object Spread Merge Pattern]]

Source: [[2026-07-10]]
