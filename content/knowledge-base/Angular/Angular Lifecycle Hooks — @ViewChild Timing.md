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

## `{ static: true }` — ได้ ViewChild เร็วขึ้นกว่า ngAfterViewInit

Default (`static: false` โดยปริยาย) resolve ที่ `ngAfterViewInit` เท่านั้น แต่ถ้า element เป้าหมาย**ไม่มี** structural directive (`*ngIf`/`*ngFor`) ครอบตัวมันเอง สามารถบังคับให้ resolve เร็วขึ้นได้ด้วย `{ static: true }`:

```typescript
@ViewChild('mapContainer', { static: true }) mapContainerRef!: ElementRef<HTMLDivElement>;

ngOnInit() {
    // ✅ พร้อมใช้แล้วตั้งแต่ตรงนี้ เพราะ static: true
    this.mapContainerRef.nativeElement.style.height = '400px';
}
```

**ทำไมถึงใช้ได้:** `static: true` บอก Angular ว่า element นี้ render อยู่เสมอไม่มีเงื่อนไข (ไม่ถูกซ่อน/สร้างใหม่ตาม state) Angular เลย resolve reference ได้ตั้งแต่รอบ change detection แรกโดยไม่ต้องรอ `ngAfterViewInit`

**ข้อควรระวัง:** ถ้า element ที่ query มี `*ngIf` ครอบตัวมันเอง ห้ามใช้ `static: true` เพราะ element อาจไม่มีอยู่จริงในรอบแรก (`static: true` กับ element ที่มีเงื่อนไขจะได้ `undefined` หรือพฤติกรรมไม่แน่นอน) — กรณีนี้ต้องใช้ default (`static: false`) แล้วรอ `ngAfterViewInit` เท่านั้น

**เคสที่ควรใช้จริง:** ต้องส่ง native DOM element เข้า third-party JS library ที่ query DOM ด้วยตัวเอง (เช่น Leaflet `L.map(element)`) — การใช้ `static: true` + ส่ง `.nativeElement` ตรงๆ ปลอดภัยกว่าการให้ library query ด้วย string id (`L.map('map')` ที่พึ่ง `document.getElementById` ภายใน) เพราะตัดปัญหา timing ที่ element อาจยังไม่ถูกแทรกเข้า DOM จริงตอนถูกเรียกใช้ (ดู [[Leaflet Map Zoom Reset on Position Change]] — update 2026-07-14)

Related: [[DevExtreme dx-form updateData vs Direct Mutation]], [[DevExtreme dx-form Rendering Rules]], [[Fix Function Called in Wrong Lifecycle Phase]], [[Leaflet Map Zoom Reset on Position Change]]

Source: [[2026-07-14]]