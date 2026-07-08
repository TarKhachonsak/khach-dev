---
tags: [angular, formio, schema, recursive, pattern]
date: 2026-06-30
---

# Patch Formio Schema Dynamically

## Use Case

ต้องการซ่อน/ลบ option ใน radio component ของ formio โดยไม่แก้ JSON ต้นฉบับ เช่น ซ่อน option ที่เคยเลือกไปแล้วในรอบก่อน

## Pattern: Recursive Tree Walk

Formio JSON ซ้อน component หลายชั้น (panel → columns → rows → components) ต้องใช้ recursive เพื่อค้นหาและแก้ไข

```typescript
private disableFormioRadioOption(schema: any, key: string, value: string): any {
    const patch = (components: any[]): any[] =>
        components.map((c) => {
            // เจอ radio ที่ต้องการ → filter option ออก
            if (c.key === key && c.type === 'radio') {
                return { ...c, values: c.values.filter((v: any) => v.value !== value) };
            }
            // ซ้อนใน components (panel, fieldset)
            if (c.components?.length) return { ...c, components: patch(c.components) };
            // ซ้อนใน columns layout
            if (c.columns?.length) return { ...c, columns: c.columns.map((col: any) => ({ ...col, components: patch(col.components || []) })) };
            // ซ้อนใน table rows
            if (c.rows?.length) return { ...c, rows: c.rows.map((row: any) => row.map((cell: any) => ({ ...cell, components: patch(cell.components || []) }))) };
            return c;
        });
    return { ...schema, components: patch(schema.components || []) };
}
```

## วิธีใช้งาน (แบบ single)

```typescript
// หลัง parse JSON schema
this.formio = JSON.parse(res.Value[0].formJson);

// ถ้า submission รอบก่อนเลือก A แล้ว → ตัด option A ออก
const prevApprove = this.formioSubmission?.data?.flow_04_task_034_approve;
if (prevApprove === 'A') {
    this.formio = this.disableFormioRadioOption(this.formio, 'flow_04_task_034_approve', 'A');
}
```

## Pattern: Config Array (รองรับหลาย flow)

เมื่อมีหลาย flow ที่ต้องซ่อน option → ใช้ config array แทน if-else ซ้อน

```typescript
private _applyFormioDisableRules(): void {
    const rules: { submissionKey: string; formKey: string; disableValue: string }[] = [
        { submissionKey: 'flow_04_task_034_approve', formKey: 'flow_04_task_034_approve', disableValue: 'A' },
        // เพิ่ม flow อื่นที่นี่
    ];
    for (const rule of rules) {
        const prev = this.formioSubmission?.data?.[rule.submissionKey];
        if (prev === rule.disableValue) {
            this.formio = this.disableFormioRadioOption(this.formio, rule.formKey, rule.disableValue);
        }
    }
}
```

**ข้อดี:** เพิ่ม flow ใหม่แค่เพิ่ม 1 บรรทัดใน array — ไม่ต้องแตะ logic

## ข้อดี

- ไม่ mutate JSON ต้นฉบับ (สร้าง object ใหม่ทุกชั้น)
- ไม่กระทบ `formioSubmission` หรือข้อมูลที่ส่ง API
- `@Input()` formioSubmission มาก่อน ngOnInit → ไม่มี async race condition

## หมายเหตุ

Formio ไม่ support `disabled` บน individual radio option โดยตรง วิธีนี้จึงเป็นทางออกที่สะอาดที่สุด

## Related

- [[Angular Input Object Reference]]
- [[Restore UI State After Load Data]]
- [[Angular and DevExtreme Interview Questions]]
- [[2026-06-30]]
- [[2026-07-01]]
