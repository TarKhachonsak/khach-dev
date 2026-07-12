# Output Not Wired Across Nested Component Chain

## What happened?

Radio button ที่ฝังอยู่ใน component ชั้นในสุด (`app-seek-link-radio`) เปลี่ยน selected state ให้เห็นด้วยตา แต่ section อื่นที่ควรเปลี่ยนตาม (`*ngIf` ที่ผูกกับค่าเดียวกันใน component ชั้นบนสุด) ไม่ขยับเลย ทั้งที่ property ชื่อเดียวกัน (`approveValue`) ถูกส่งผ่านไปทุกชั้น

## Root Cause

Chain มี 3 ชั้น: `app-seek-link-radio` → `person-crime-form-v3` → `form-10-officer-task`

- ชั้นในสุด (`app-seek-link-radio`) มี `[(value)]="approveValue"` ผูกกับ property ของตัวเอง (แก้ local state ได้จริง) และมี `@Output() approveValueChange` emit ออกมาด้วย
- แต่ชั้นกลาง (`person-crime-form-v3`) เรียกใช้แบบ **one-way** เท่านั้น: `<app-seek-link-radio [approveValue]="approveValue">` — ไม่มี `(approveValueChange)` listener เลย event ที่ emit มาจึงตกหาย ไม่มีใครรับ
- ผลคือ `approveValue` ของชั้นกลางไม่เคยเปลี่ยนตามที่คลิกจริง และของชั้นบนสุด (`form-10-officer-task`) ก็ไม่เปลี่ยนตามไปด้วย เพราะรับมาแบบ one-way เหมือนกัน — `*ngIf` ทุกจุดที่อ้างอิง `approveValue` ที่ชั้นบนจึงค้างอยู่ค่าเดิมตลอด

UI ดูเหมือน "ตอบสนอง" เพราะ radio component ชั้นในมี state ของตัวเองและ render ตัวเองใหม่ได้ แต่ค่านั้นไม่เคยไหลย้อนขึ้นไปจริง

## Fix

ต้องเปิด Output + ต่อสาย listener ให้ครบทุกชั้นที่ต้องการให้ค่าไหลขึ้น ไม่ใช่แค่ชั้นในสุดกับชั้นนอกสุด:

```typescript
// person-crime-form-v3.component.ts (ชั้นกลาง)
@Input() approveValue: string;
@Output() approveValueChange = new EventEmitter<string>();

onApproveValueChange = (e: string) => {
  this.approveValue = e;
  this.approveValueChange.emit(e); // ส่งต่อขึ้นไปชั้นบน
};
```

```html
<!-- person-crime-form-v3.component.html -->
<app-seek-link-radio
  [approveValue]="approveValue"
  (approveValueChange)="onApproveValueChange($event)"
></app-seek-link-radio>
```

```html
<!-- form-10-officer-task.component.html (ชั้นบนสุด) -->
<app-person-crime-form-v3 [(approveValue)]="approveValue"></app-person-crime-form-v3>
```

## Prevention

- ทุกครั้งที่เห็น `@Output() xChange` ถูกประกาศไว้ในไฟล์ child ให้เช็คว่า parent ทุกชั้น (ไม่ใช่แค่ parent ชั้นบนสุด) ฟัง event นั้นจริงหรือไม่ — grep หา `(xChange)=` ในทุก `.html` ที่ใช้ component นั้น
- ถ้าต้องการ two-way data flow ข้าม 3 ชั้นขึ้นไป ให้ตรวจสอบทีละคู่ parent-child จากในสุดออกมานอกสุด อย่าเชื่อว่า "ผูก property ชื่อเดียวกันทุกชั้นแล้วจะไหลถึงกันเอง"
- แยกให้ออกจาก [[Angular Input Object Reference]]: กรณีนั้นเป็น object reference ที่ mutate แล้ว parent เห็นเองโดยไม่ต้อง Output แต่กรณีนี้เป็น primitive (`string`) ที่ไม่มี reference sharing เลย — **ต้องมี Output ครบทุกชั้นเสมอ** ไม่มีทางลัด

## Engineering Principle

Two-way binding เป็นแค่ syntax sugar ของ `[x]` + `(xChange)` — banana-in-a-box ใช้ได้กับ parent-child คู่เดียวเท่านั้น เวลามี component ซ้อนกันหลายชั้น ต้องต่อสายให้ครบทุกคู่ parent-child ไม่ใช่แค่ปลายทาง 2 ฝั่งสุด (ชั้นในสุดกับชั้นนอกสุด) — ชั้นกลางที่ขาด Output คือจุดที่ค่า "หายกลางทาง" เสมอ

## Interview Question

**English Question:** In Angular, if a deeply nested child component updates its own value and the top-level ancestor doesn't react, what's the most likely cause?

**English Answer:** A missing `@Output()` listener at one of the intermediate component layers — two-way binding (`[(x)]`) only connects one parent-child pair at a time, so every layer in the chain needs its own `@Input()` + `@Output()...Change` wired to the one below it, or the value change stops propagating at that layer.

**Thai Question:** ถ้า component ที่ซ้อนอยู่ชั้นในสุดเปลี่ยนค่าแล้ว component ชั้นบนสุดไม่ตอบสนองตาม สาเหตุที่เป็นไปได้มากที่สุดคืออะไร

**Thai Answer:** มีชั้นกลางชั้นใดชั้นหนึ่งที่ไม่ได้ฟัง `@Output()` ของชั้นที่อยู่ข้างใน — two-way binding เชื่อมได้แค่คู่ parent-child เดียวต่อครั้ง ถ้าจะส่งค่าขึ้นข้ามหลายชั้น ทุกชั้นต้องมีทั้ง `@Input()` และ `@Output()...Change` ต่อกับชั้นที่อยู่ข้างในตัวเองด้วย ไม่งั้นค่าจะหยุดไหลที่ชั้นนั้น

**Thai Explanation:** เข้าใจผิดบ่อยว่าแค่ property ชื่อเดียวกันไหลผ่านทุก component ก็พอ แต่จริง ๆ แล้ว Angular ไม่มีกลไก "ไหลข้ามชั้นอัตโนมัติ" ให้ primitive value ต้องต่อสาย Output เองทุกจุด

Related: [[Angular Input Object Reference]], [[Approve Value Scoped to Wrong Task]], [[Case-Sensitive Component Selector in Template Type Checker]]

Source: [[2026-07-06]]
