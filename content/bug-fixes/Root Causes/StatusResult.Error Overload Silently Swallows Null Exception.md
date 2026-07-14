# StatusResult.Error Overload Silently Swallows Null Exception

## เกิดอะไรขึ้น

Client ได้รับ `NullReferenceException` (500) แทนที่จะได้ validation message ที่ตั้งใจไว้
เช่น `"ไม่พบวันที่ต้องชำระค่าปรับเป็นพินัย"` — stack trace ชี้ไปที่
`StatusResult.Error[T](String message, Exception ex, ...)` ที่ถูกเรียกจาก
`Phinai7Service.CreateInvoiceAsync`

ต้นทางคือโค้ด:
```csharp
return StatusResult.Error<object>("ไม่พบวันที่ต้องชำระค่าปรับเป็นพินัย", null);
```

## ทำไมถึงเกิด (Root Cause)

`StatusResult.cs` มี 2 overload ของ `Error<T>` ที่ parameter ตัวที่สองต่างกันแค่
reference type (`T value` vs `Exception ex`) เมื่อเรียกด้วย `null`,
**C# overload resolution เลือก `Exception` overload เสมอ** เพราะเป็น type ที่เจาะจงกว่า
`object` — ดูรายละเอียดกลไกที่
[[C# Overload Resolution - Null Argument Prefers More Derived Reference Type]]

ผลคือโค้ดที่ตั้งใจเรียก `Error<T>(message, value: null)` ดันไปโดน resolve เป็น
`Error<T>(message, ex: null)` แล้วเมธอดนั้นอ่าน `ex.Message` ตรง ๆ โดยไม่เช็ค null:

```csharp
result.Error = new
{
    message = ex.Message,   // ex เป็น null → NullReferenceException
    ...
};
```

## ยืนยันด้วยการทดสอบจริง

เขียน console app แยกจำลอง 2 overload พฤติกรรมเดียวกัน แล้วรัน `Error<object>("test", null)`
— ผลคือ `Exception` overload ถูกเรียกจริง (`ex = null` เข้าไปในเมธอด) ยืนยัน root cause
100% ไม่ใช่การเดาจาก stack trace อย่างเดียว

## ขอบเขตผลกระทบ

Pattern `StatusResult.Error<T>("...", null)` (ตั้งใจส่ง value เป็น null ไม่ใช่ exception)
พบอยู่ **105 จุด ใน 16 ไฟล์ทั่วโปรเจกต์** (Phinai3/4/7/8/10, Sumary, CctvService,
DocumentService, BmaOssService ฯลฯ) — ทุกจุดที่ validation fail ด้วย pattern นี้จะโดน
NullReferenceException บังหน้า validation message ที่ตั้งใจไว้

## วิธีแก้ที่แนะนำ (ยังไม่ได้ apply ในเซสชันนี้ — รอ user ยืนยัน)

แก้ที่ต้นตอจุดเดียวใน `StatusResult.Error<T>(string, Exception ex, ...)`:
```csharp
result.Error = ex == null ? null : new { message = ex.Message, ... };
```
ไม่ต้องไล่แก้ 105 จุดที่เรียกใช้

## Engineering Principle

เมื่อเจอ `NullReferenceException` ที่ stack trace ชี้เข้าไปใน error-handling helper เอง
(ไม่ใช่ business logic) ให้สงสัยว่า **exception เกิดจาก error-handling code เอง** ไม่ใช่จาก
logic ที่ throw จริง ๆ — ต้องแยกให้ออกว่า exception ตัวไหนคือ "ของจริง" (ที่ควรถูก log/
handle) กับตัวไหนคือ "double fault" ที่เกิดจาก helper ที่ควรจะจัดการ error กลับ throw ซ้ำเอง

## Interview Question

**EN:** You see a `NullReferenceException` whose stack trace points directly into your
own error-handling helper method (e.g. `StatusResult.Error`), not into business logic.
What does that tell you, and how would you investigate?

**Answer (EN):** It's a strong signal of a "double fault" — the error-handling code
itself is crashing while trying to report an error, likely because it assumes a
non-null argument (e.g. calling `.Message` on an `Exception` parameter without a null
check). Investigate by checking every call site that passes `null` into that helper,
and consider whether overload resolution silently routed a `null` intended for one
overload into a different overload with a more specific reference-type parameter.

**คำถามภาษาไทย:** เจอ `NullReferenceException` ที่ stack trace ชี้ตรงเข้าไปในเมธอด
error-handling helper ของตัวเอง (เช่น `StatusResult.Error`) ไม่ใช่ business logic บอกอะไร
เราได้บ้าง และควรตรวจสอบอย่างไร?

**คำตอบภาษาไทย:** เป็นสัญญาณของ "double fault" — โค้ด error-handling เองกำลัง crash
ขณะพยายาม report error ซึ่งมักเกิดจากการ assume ว่า argument ไม่เป็น null (เช่น เรียก
`.Message` บน parameter `Exception` โดยไม่เช็ค null ก่อน) ต้องตรวจสอบทุกจุดที่เรียก helper
นี้ด้วย `null` และพิจารณาว่า overload resolution อาจเลือก overload ที่ผิดจากที่ตั้งใจไว้
เงียบ ๆ หรือไม่

**คำอธิบายเพิ่มเติม:** บั๊กแบบนี้อันตรายเพราะ error message ที่ควรจะช่วย debug (เช่น
"ไม่พบวันที่ต้องชำระค่าปรับ") หายไปเลย ถูกแทนที่ด้วย NullReferenceException ที่ไม่มี
context ทำให้ debug ยากขึ้นไปอีกชั้น ทั้งที่จุดประสงค์ของ error-handling helper คือทำให้
debug ง่ายขึ้น — เป็นตัวอย่างว่า infrastructure code (ที่ทุกคนใช้ร่วมกัน) ต้อง defensive
กว่าปกติ เพราะพลาดจุดเดียวกระทบทั้งระบบ (105 จุดในเคสนี้)

## อ้างอิงจาก

[[2026-07-14]]
