# C# Overload Resolution — Null Argument Prefers More Derived Reference Type

## หลักการ

เมื่อมี method overload สองตัวที่ต่างกันแค่ parameter type ที่เป็น reference type ทั้งคู่
(เช่น `object` กับ `Exception`) และเรียกด้วย argument เป็น literal `null` —
**compiler จะเลือก overload ที่ parameter type "เจาะจงกว่า" (more derived) เสมอ**
ไม่ว่าผู้เขียนโค้ดจะตั้งใจให้ตรงกับ overload ไหนก็ตาม

```csharp
static void Error<T>(string msg, T value) { ... }        // (A) generic, T = object
static void Error<T>(string msg, Exception ex) { ... }    // (B) เจาะจง Exception

Error<object>("msg", null);
// → เรียก (B) เสมอ เพราะ Exception derive จาก object (เจาะจงกว่า)
// แม้ผู้เขียนตั้งใจเรียก (A) โดยส่ง value = null ก็ตาม
```

ยืนยันด้วยการรันจริง (ไม่ใช่การเดา): เขียน test program เปล่า ๆ ที่มีสอง overload แบบนี้
แล้วเรียก `Error<object>("test", null)` — ผลคือ overload `Exception` ถูกเรียกเสมอ

## ทำไมถึงเป็นแบบนี้ (C# spec)

กฎ "better function member" ของ C# (§12.6.4.2) ระบุว่าเมื่อสอง candidate ทั้งคู่รับ
argument ได้ (applicable) และต่างกันแค่ type ปลายทางที่เป็น reference type — ถ้ามี
implicit reference conversion จาก type หนึ่งไปอีก type หนึ่งได้ทางเดียว (เช่น
`Exception → object` ได้ แต่ `object → Exception` ไม่ได้) type ที่ "แคบกว่า/เจาะจงกว่า"
(`Exception`) จะถือว่า **ดีกว่า** เสมอสำหรับ argument ที่เป็น `null`

## ผลกระทบที่พบจริง (ROD Officer API)

`StatusResult.cs` มี:
```csharp
public static StatusResult<T> Error<T>(string message, T value, ...)
public static StatusResult<T> Error<T>(string message, Exception ex, ...)
```

จุดเรียกใช้ทั่วโปรเจกต์ที่เขียน `StatusResult.Error<object>("ข้อความ", null)` (ตั้งใจ
ส่ง `value = null`) ทั้งหมด**ถูก compiler resolve ไปที่ overload `Exception ex` แทน**
แล้วโค้ดข้างในอ่าน `ex.Message` โดยไม่เช็ค null ก่อน → throw `NullReferenceException`
ซ้อนขึ้นมาแทนที่จะคืน validation message ที่ตั้งใจไว้ ดู [[StatusResult.Error Overload Silently Swallows Null Exception]]

## วิธีป้องกัน

1. **อย่าออกแบบ overload สองตัวที่ต่างกันแค่ parameter type เป็น reference type** เมื่อ
   คาดว่าจะมีคนเรียกด้วย `null` — ใช้ชื่อ method แยกกันแทน (เช่น `ErrorWithValue` /
   `ErrorWithException`) เพื่อตัด ambiguity ทิ้งไปเลย
2. ถ้าเลี่ยงไม่ได้ ให้ defensive-code รับ `null` ในทุก overload ที่มีโอกาสได้รับ (เช่น
   เช็ค `ex == null` ก่อนอ่าน `.Message`)
3. เวลา cast ให้ชัดเจนตอนเรียก เช่น `Error<object>("msg", (object)null)` เพื่อบังคับ
   overload ที่ต้องการ (แต่วิธีนี้พึ่งพาให้ทุกคนจำได้ ไม่แนะนำเป็น long-term fix)

## Engineering Principle

Overload resolution ของ C# ตัดสินจาก **static type ของ parameter** ไม่ใช่ "เจตนา" ของ
ผู้เขียนโค้ด เวลาออกแบบ API ที่มี generic overload คู่กับ overload เฉพาะเจาะจง (เช่น
`Exception`) ต้องคิดถึง edge case `null` เสมอ เพราะ `null` ไม่มี runtime type ให้ compiler
ดู มันจึงต้องใช้กฎ static-type-based ล้วน ๆ ซึ่งมักขัดกับสามัญสำนึกของผู้เขียน

## อ้างอิงจาก

[[2026-07-14]]
