# XPO Detail Records — Replace-All Sync Pattern

## บริบท

พบใน `FormProcessService.cs` ของโปรเจกต์ ROD Officer API (ASP.NET Core 6 + DevExpress XPO)
เมธอดกลุ่ม `ReplaceXxxGroupAsync` (เช่น `ReplaceOfficerFormGroupAsync`,
`ReplacePersonReportAsync`) ใช้ pattern เดียวกันในการ sync child/detail records
ของฟอร์มเวลา user submit ข้อมูลซ้ำ (draft save / update)

## Pattern

```csharp
public async Task ReplaceXxxAsync(int rqMainId, JObject submission)
{
    if (!submission.ContainsKey("KEY_NAME")) return;

    var jArray = JArray.Parse(submission["KEY_NAME"].ToString());

    // 1) mark ของเดิมทั้งหมดเป็น inactive (soft delete)
    var oldData = await _db.GetXpQuery<TEntity>()
        .Where(x => x.RQ_MAIN_ID == rqMainId && x.RECORD_STATUS == "A")
        .ToListAsync();
    foreach (var row in oldData)
    {
        row.RECORD_STATUS = "I";
        row.UPDATE_DATE = DateTime.Now;
        _db.UpdateObject(row);
    }

    // 2) insert ใหม่ทั้งหมดจาก submission
    foreach (JObject item in jArray)
    {
        var obj = _db.CreatePersistent<TEntity>();
        // map field ...
        obj.RQ_MAIN_ID = rqMainId;
        obj.RECORD_STATUS = "A";
        _db.InsertObject(obj);
    }
}
```

## ทำไมถึงใช้ pattern นี้แทนการ diff/update

- Frontend ส่ง array ของ detail records ทั้งชุดมาทุกครั้งที่ save (ไม่ส่ง diff)
- การ diff เทียบ record เก่ากับใหม่ (add/update/delete แยกกัน) ซับซ้อนกว่าและเสี่ยง bug
  มากกว่าการ "ปิดของเก่าทั้งหมด แล้วสร้างใหม่ทั้งหมด"
- ใช้ soft delete (`RECORD_STATUS = "I"`) แทนการ `DeleteObject` จริง เพื่อรักษา audit trail /
  ประวัติการแก้ไข ซึ่งจำเป็นสำหรับระบบราชการที่ต้องตรวจสอบย้อนหลังได้

## ข้อควรระวัง

1. **ทุกเมธอดต้องกรองด้วย `RECORD_STATUS == "A"`** ตอน query ของเดิม ไม่งั้นจะไป mark
   record ที่ถูกปิดไปแล้วซ้ำ (ไม่ผิดแต่เปลือง query)
2. **ต้องเรียกเมธอดนี้จริงในทุก flow ที่ควรบันทึกข้อมูลกลุ่มนี้** — เมธอด helper การมีอยู่ใน
   service ไม่ได้แปลว่าถูกเรียกใช้แล้ว ดู [[Unmapped Entity Properties After Codegen]]
   สำหรับกรณีที่เจอเมธอดมีอยู่แต่ยังไม่ได้ต่อสายเรียกใน flow ที่ควรใช้
3. **field mapping ในเมธอดต้อง sync กับ entity ที่ generate จาก DB schema เสมอ** — XPO
   entity ถูก generate จาก Oracle schema ด้วย `tools/XpoEntityGenerator` เวลามีคอลัมน์ใหม่
   entity จะมี property ใหม่ทันที แต่เมธอด mapping (เขียนมือ) จะไม่รู้ตัว ต้องตรวจสอบเอง

## หลักการทั่วไป (Engineering Principle)

Replace-all + soft-delete เป็นทางเลือกที่ดีเมื่อ:
- ปริมาณ record ต่อ parent ไม่มาก (ไม่ใช่ bulk data)
- ต้องการ audit trail ของการเปลี่ยนแปลง
- Client ส่งข้อมูลทั้งชุดมาเสมอ (ไม่ใช่ partial update)

ถ้าเข้าเงื่อนไขตรงข้าม (data เยอะ, ต้องการ partial update, ไม่สนใจ history) ควรพิจารณา
diff-based update แทน

## อ้างอิงจาก

[[2026-07-14]]
