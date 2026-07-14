# C# Overload Resolution With a Null Argument

## English Question
You have two overloads: `void Foo<T>(string msg, T value)` and
`void Foo<T>(string msg, Exception ex)`. If you call `Foo<object>("msg", null)`,
which overload runs, and why?

## English Answer
The `Exception` overload runs — even though the caller may have intended to pass
`value = null` via the generic overload. C#'s "better function member" rule says that
when two applicable overloads differ only in a reference-type parameter, and one type
has an implicit reference conversion to the other but not vice versa (here,
`Exception → object` but not `object → Exception`), the more derived type
(`Exception`) is considered the better match for a `null` literal, because `null` has
no runtime type to disambiguate with — the compiler falls back to purely static rules
that favor specificity. This is a real production bug source: helper methods like
`Result.Error<T>(msg, value)` that overload against `Result.Error<T>(msg, Exception ex)`
will silently route every `null`-value call into the exception path, and if that path
calls `ex.Message` without a null check, it throws `NullReferenceException` instead of
returning the intended result.

## Thai Question (คำถามภาษาไทย)
มี overload สองตัว: `void Foo<T>(string msg, T value)` กับ
`void Foo<T>(string msg, Exception ex)` ถ้าเรียก `Foo<object>("msg", null)` overload
ไหนจะถูกเรียก และเพราะอะไร?

## Thai Answer (คำตอบภาษาไทย)
Overload ที่รับ `Exception` จะถูกเรียก แม้ผู้เรียกอาจตั้งใจส่ง `value = null` ผ่าน
generic overload ก็ตาม เพราะกฎ "better function member" ของ C# ระบุว่าเมื่อสอง
overload ที่ใช้ได้ต่างกันแค่ parameter ที่เป็น reference type และมี implicit reference
conversion จาก type หนึ่งไปอีก type ได้ทางเดียว (ที่นี่ `Exception → object` ได้ แต่
`object → Exception` ไม่ได้) type ที่เจาะจงกว่า (`Exception`) จะถือว่าเหมาะกับ `null`
มากกว่าเสมอ เพราะ `null` ไม่มี runtime type ให้แยกแยะ compiler จึงต้องใช้กฎ static-type
ล้วน ๆ ที่เลือก type เจาะจงกว่าเป็นค่าเริ่มต้น

## Thai Explanation (คำอธิบายเพิ่มเติมภาษาไทย)
นี่เป็นบั๊กที่เกิดขึ้นจริงในโปรเจกต์ ROD Officer API: `StatusResult.Error<T>(msg, value)`
กับ `StatusResult.Error<T>(msg, Exception ex)` — จุดเรียกใช้ 105 จุดทั่วโปรเจกต์ที่เขียน
`StatusResult.Error<object>("ข้อความ", null)` ตั้งใจส่ง `value = null` แต่ compiler
resolve ไปที่ overload `Exception` แทนทุกครั้ง แล้วเมธอดนั้นอ่าน `ex.Message` โดยไม่เช็ค
null → throw `NullReferenceException` ทับ validation message ที่ตั้งใจไว้ ข้อคิดสำคัญ:
เวลาออกแบบ API/library เอง ต้องระวังการมี overload สองตัวที่ต่างกันแค่
reference-type parameter เพราะ `null` จะเลือก overload แบบที่คาดไม่ถึงได้เสมอ ดู
[[C# Overload Resolution - Null Argument Prefers More Derived Reference Type]] และ
[[StatusResult.Error Overload Silently Swallows Null Exception]] สำหรับรายละเอียดเต็ม

## อ้างอิงจาก

[[2026-07-14]]
