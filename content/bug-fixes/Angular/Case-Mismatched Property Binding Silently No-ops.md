# Case-Mismatched Property Binding Silently No-ops

## What happened?

Template bind property เข้า child component ด้วยชื่อผิด case:

```html
<!-- ❌ ผิด: ตัวเล็กหมด -->
<app-crime-scene-location-redesign [taskformcode]="_taskFormCode"></app-crime-scene-location-redesign>
```

แต่ component ประกาศ:

```typescript
@Input() taskFormCode: any; // camelCase
```

`ng build` ผ่าน **0 error**, รันไม่มี console warning เลย แต่ `taskFormCode` ใน child เป็น `undefined` ตลอด ทำให้ logic ที่พึ่งค่านี้ (เช่น allowlist ตาม flow code) ไม่ทำงานตามที่ตั้งใจ

## Root Cause

ขึ้นอยู่กับว่าโปรเจกต์เปิด strict template type-checking (`strictTemplates`/`fullTemplateTypeCheck` ใน `tsconfig`) แค่ไหน — ถ้าไม่เข้มงวด (เหมือนโปรเจกต์นี้) property binding ที่สะกดไม่ตรงกับ `@Input()` ไหนเลยจะถูกมองข้ามเหมือนอาจเป็น native DOM attribute — ไม่มี input ไหนของ component ตรงกัน จึงไม่ bind อะไรเลย, child ใช้ค่า default/undefined ต่อไปโดยไม่มี error หรือ fallback ไปตีความเป็น event แบบที่เกิดกับ two-way binding `[(x)]` (ดู [[Case-Sensitive Component Selector in Template Type Checker]] ซึ่งเป็นบั๊กคนละคลาสที่ error เพราะ selector ทั้ง tag ไม่ตรง ไม่ใช่แค่ property เดียว)

## Fix

แก้ตัวสะกดให้ตรงกับ `@Input()` เป๊ะ (case-sensitive):

```html
<!-- ✅ ถูก -->
<app-crime-scene-location-redesign [taskFormCode]="_taskFormCode"></app-crime-scene-location-redesign>
```

## How to Prevent

- เวลาสงสัยว่า "ทำไม `@Input()` เป็น `undefined` ทั้งที่ parent ดูเหมือน bind อยู่" ให้เช็คตัวสะกด binding ใน template เทียบกับชื่อ property ใน `.ts` **ทีละตัวอักษร** เป็นข้อแรก ก่อนไปสงสัยจุดอื่น (เช่น timing, ngOnChanges)
- ระวังเป็นพิเศษเวลา copy/แก้ template ที่มี input หลายตัวพร้อมกัน — การลบ/แก้ binding หนึ่งอาจพิมพ์ผิด case โดยไม่รู้ตัว เพราะไม่มี error เตือน
- ถ้าโปรเจกต์ยังไม่เปิด `strictTemplates`ในtsconfig ให้รู้ไว้ว่า class of bug นี้จะไม่ถูกจับตอน build เลย ต้อง review ด้วยตาหรือทดสอบ runtime เท่านั้น

## Engineering Principle

Angular property binding (`[x]="y"`) กับ component selector มีกติกา case-sensitivity คนละแบบกัน: selector ที่สะกดผิด case อาจ error ตอน build เพราะ type checker หา component ไม่เจอเลย (ดู [[Case-Sensitive Component Selector in Template Type Checker]]) แต่ property binding ที่สะกดผิด case (ตัว component ยังหาเจอ แค่ input name ไม่ตรง) จะ**พังแบบเงียบสนิท**ไม่มี error ใดๆ เพราะไม่มี fallback ไปตีความเป็นอย่างอื่นที่ type ไม่ตรง — เป็นอีกตัวอย่างของ "runtime ไม่ error ไม่ได้แปลว่า source ถูก"

## Interview Question

**English Question:** A template writes `[taskformcode]="_taskFormCode"` (lowercase) targeting `@Input() taskFormCode` (camelCase). Build passes with 0 errors, no console warning, but the value is always `undefined`. Why doesn't the compiler catch this?

**English Answer:** Whether this is caught depends on the project's Angular template type-checking strictness (`strictTemplates`/`fullTemplateTypeCheck`). Without strict checking, an unrecognized property binding on a custom element is tolerated as if it might be a native DOM attribute — no `@Input()` matches the misspelled name, so nothing binds, and the child silently keeps its default/undefined value. Unlike a case-mismatched component *selector*, there's no event-fallback misinterpretation here, so it fails completely silently with zero signal.

**Thai Question:** เทมเพลตเขียน `[taskformcode]="_taskFormCode"` (ตัวเล็กหมด) แต่ component มี `@Input() taskFormCode` (camelCase) build ผ่าน 0 error ไม่มี warning เลย แต่ค่าที่ได้เป็น `undefined` ตลอด ทำไม compiler ไม่จับ?

**Thai Answer:** ขึ้นอยู่กับว่า config เช็ค template ของโปรเจกต์เข้มงวดแค่ไหน (`strictTemplates`/`fullTemplateTypeCheck`) ถ้าไม่เข้มงวด property binding ที่สะกดไม่ตรงกับ input ไหนเลยจะถูกมองข้ามเหมือนอาจเป็น native DOM attribute — ไม่มี `@Input()` ไหนตรงกับชื่อที่พิมพ์ผิด เลยไม่ bind อะไรเลย child ใช้ค่า default/undefined ต่อไปแบบเงียบๆ ต่างจาก selector ที่สะกดผิด case ตรงที่ property binding ไม่มี fallback ไปตีความเป็น event ที่ type ไม่ตรงให้เห็น จึงพังแบบไม่มีสัญญาณใดๆ เลย

**Thai Explanation:** นี่คือเหตุผลว่าทำไมเวลา debug "`@Input()` เป็น undefined" ต้องเช็คตัวสะกด binding ให้ตรงกับชื่อ property แบบ case-sensitive เป็นข้อแรก ก่อนไปสงสัยเรื่อง lifecycle/timing เพราะ compiler ในโปรเจกต์ที่ไม่เปิด strict mode จะไม่ช่วยเตือนกรณีนี้เลย

Related: [[Case-Sensitive Component Selector in Template Type Checker]], [[Missing Input Binding Causes Undefined Crash]]

Source: [[2026-07-14]]
