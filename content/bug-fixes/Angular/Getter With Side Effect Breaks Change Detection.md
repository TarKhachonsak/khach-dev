# Getter With Side Effect Breaks Change Detection

## What happened?

component แสดงแผนที่/พิกัดไม่แน่นอน — บางทีแสดง บางทีไม่แสดง โดยไม่มี pattern ชัดเจนที่สัมพันธ์กับการกระทำของ user เลย

## Root Cause

getter ที่ผูกกับ template (`*ngIf="showCoordinatePicker || _isMapVisible"`) มี side-effect อยู่ข้างใน:

```typescript
// ❌ getter ที่ toggle state ตัวเอง
get showCoordinatePicker(): boolean {
  this._isMapVisible = !this._isMapVisible; // side-effect!
  const forced = this.forceShowCoordinatePicker || ALLOWLIST.includes(this.taskFormCode);
  return forced || !!(this.formData?.LAT && this.formData?.LNG);
}
```

Angular เรียก getter ที่ผูกกับ template **ทุกรอบ change detection** ไม่ใช่แค่ตอนที่ user คลิกหรือ input เปลี่ยนจริง ๆ — change detection cycle เกิดถี่มาก (ทุก event, timer, HTTP response ทั่วทั้งแอป ไม่ใช่แค่ใน component นี้) ทำให้ `_isMapVisible` ถูก toggle กลับไปมาแบบสุ่มตามจำนวนรอบ CD ที่เกิดขึ้นระหว่างนั้น ไม่สัมพันธ์กับ user action เลย

## How was it fixed?

ลบ side-effect ออก ให้ getter เป็น **pure function** — คำนวณจาก input/state ที่มีอยู่แล้วเท่านั้น ไม่ mutate อะไร:

```typescript
// ✅ pure getter
get showCoordinatePicker(): boolean {
  const forced = this.forceShowCoordinatePicker || ALLOWLIST.includes(this.taskFormCode);
  return forced || !!(this.formData?.LAT && this.formData?.LNG);
}
```

ส่วน `_isMapVisible` ที่ต้องการ toggle จริง ๆ (ตอนกดปุ่ม) ย้ายไปอยู่ใน event handler (`onToggleMap()`) แทน — ที่ทำงานครั้งเดียวต่อการคลิกจริง

## Prevention

- getter ที่ผูกกับ template (`*ngIf`, `{{ }}`, `[prop]="getterName"`) ต้องเป็น pure เสมอ — ห้าม assign `this.xxx = ...` ข้างในเด็ดขาด
- ตัวคุมได้ง่าย ๆ: ถามตัวเองว่า "ถ้า getter นี้ถูกเรียก 100 ครั้งติดกันโดยไม่มีอะไรเปลี่ยน จะได้ผลลัพธ์เดิมทุกครั้งไหม" ถ้าไม่ใช่ = มี side-effect ต้องย้ายออก
- code review: เจอ assignment (`=`) ข้างในตัวอย่าง `get xxx()` ให้ flag ทันที ไม่ต้องรอ reproduce bug ก่อน

## Engineering Principle

> Angular template binding ไม่ได้ "call ครั้งเดียวตอน event เกิด" เหมือน event handler — getter/method ที่ผูกกับ template ถูกเรียกซ้ำทุกรอบ change detection ของ**ทั้งแอป** ไม่ใช่แค่ของ component นั้น การใส่ side-effect ในจุดนี้เท่ากับสร้าง state ที่เปลี่ยนแปลงแบบไม่มี pattern ที่คาดเดาได้

## Interview Question

**English Question:** Why is it dangerous to mutate component state inside a getter that's bound to an Angular template (e.g. `*ngIf="myGetter"`)?

**English Answer:** Angular calls template-bound getters on every change detection cycle, which can fire many times per user action (any event, timer, or async callback anywhere in the app can trigger it) — not just once per intended trigger. A getter that mutates state on each call produces a value that flips unpredictably, uncorrelated with any real user interaction.

**Thai Question:** ทำไมการ mutate state ของ component ข้างใน getter ที่ผูกกับ Angular template (เช่น `*ngIf="myGetter"`) ถึงอันตราย?

**Thai Answer:** Angular เรียก getter ที่ผูกกับ template ทุกรอบ change detection ซึ่งเกิดขึ้นได้หลายครั้งต่อ 1 user action จริง (event/timer/async callback ที่ไหนก็ได้ในแอปสามารถ trigger ได้) ไม่ใช่แค่ครั้งเดียวตามที่ตั้งใจ ถ้า getter มี side-effect ค่าที่ได้จะเปลี่ยนไปมาแบบไม่มี pattern ที่สัมพันธ์กับ user action จริง

**Thai Explanation:** วิธีจำง่าย ๆ คือ getter ที่ผูกกับ template ต้อง "pure" เสมอ — เรียกกี่ครั้งก็ต้องได้ผลลัพธ์เดิมถ้าไม่มีอะไรเปลี่ยน ถ้าต้องการ toggle state จริง ๆ ให้ย้าย logic นั้นไปอยู่ใน event handler (เช่น `(click)="onToggle()"`) แทนที่จะฝังไว้ใน getter

Related: [[Restore UI State After Load Data]], [[Angular Lifecycle Hooks — @ViewChild Timing]], [[Leaflet Map Zoom Reset on Position Change]]

Source: [[2026-07-10]]
