# Angular Lifecycle Hooks — @ViewChild Timing

## ลำดับ Lifecycle Hooks

```
constructor()
    ↓
ngOnChanges()     ← @Input() เปลี่ยนทุกครั้ง
    ↓
ngOnInit()        ← @ViewChild ยังเป็น undefined
    ↓
[Angular renders template]
    ↓
ngAfterViewInit() ← @ViewChild พร้อมใช้งานครั้งแรก
    ↓
ngAfterViewChecked() ← ทุกครั้งที่ view ถูก check
```

## กฎสำคัญ

**@ViewChild พร้อมใน `ngAfterViewInit` เท่านั้น — ไม่ใช่ `ngOnInit`**

```typescript
@ViewChild('myForm') formRef: DxFormComponent;

ngOnInit() {
    this.formRef.instance.updateData(...); // ❌ ERROR: formRef is undefined
}

ngAfterViewInit() {
    this.formRef.instance.updateData(...); // ✅ พร้อมใช้งาน
}
```

## ngOnChanges vs ngAfterViewInit เลือกอย่างไร

| ต้องการทำ | ใช้ |
|-----------|-----|
| React เมื่อ `@Input()` เปลี่ยน | `ngOnChanges` |
| ใช้ `@ViewChild` | `ngAfterViewInit` |
| ทั้งสองอย่าง | ทั้งสอง lifecycle |

## Pattern: @Input + @ViewChild ร่วมกัน

```typescript
export class MyComponent implements AfterViewInit, OnChanges {
    @ViewChild('formRef') formRef: DxFormComponent;
    @Input() formData: any;

    // เมื่อ parent ส่ง formData ใหม่ → set ค่าลง object โดยตรง (form ยังไม่พร้อม)
    ngOnChanges(changes: SimpleChanges) {
        if (changes['formData'] && this.formData) {
            this.formData['STATUS'] = 'default';
        }
    }

    // หลัง form พร้อม → ใช้ updateData() เพื่อ trigger re-render
    ngAfterViewInit() {
        this.formRef.instance.updateData('STATUS', 'default');
    }
}
```

Related: [[DevExtreme dx-form updateData vs Direct Mutation]], [[DevExtreme dx-form Rendering Rules]], [[Fix Function Called in Wrong Lifecycle Phase]]