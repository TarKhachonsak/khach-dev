# DevExtreme dx-form — updateData() vs Direct Mutation

## What happened?

`BookSentFormComponent` ต้องแสดงค่า "จัดส่งแล้ว" ใน field `_POST_STATUS` ตั้งแต่โหลด form แต่ค่าไม่แสดง แม้ตรวจสอบพบว่า `formData` object มีค่านั้นอยู่แล้ว

## Why did it happen?

DevExtreme `dx-form` snapshot ค่าจาก `formData` ตอน render ครั้งแรก เมื่อ mutate property ของ object โดยตรงหลัง form render เสร็จ form ไม่รู้ว่าค่าเปลี่ยน จึงไม่ re-render

```typescript
// ❌ form ไม่รู้ ไม่ re-render
this.formData['PREFIX_POST_STATUS'] = 'จัดส่งแล้ว';

// ✅ บอก form ให้ update และ re-render
this.formRef.instance.updateData('PREFIX_POST_STATUS', 'จัดส่งแล้ว');
```

## How was it fixed?

```typescript
import { Component, AfterViewInit, OnChanges, SimpleChanges, Input, ViewChild } from '@angular/core';

export class BookSentFormComponent implements AfterViewInit, OnChanges {
    @ViewChild('formRef') formRef: DxFormComponent;
    @Input() formData: any;
    @Input() dataFieldPrefix: string;

    // ทุกครั้งที่ parent ส่ง formData object ใหม่
    ngOnChanges(changes: SimpleChanges) {
        if (changes['formData'] && this.formData && this.dataFieldPrefix) {
            this.formData[this.dataFieldPrefix + '_POST_STATUS'] = 'จัดส่งแล้ว';
        }
    }

    // สำหรับ initial render หลัง form พร้อม
    ngAfterViewInit() {
        this.onSetDefaultPostStatus();
    }

    onSetDefaultPostStatus() {
        this.formRef.instance.updateData(this.dataFieldPrefix + '_POST_STATUS', 'จัดส่งแล้ว');
    }
}
```

## Why ngOnChanges ด้วย?

Parent อาจส่ง `formData` object ใหม่มาหลัง API response — ทำให้ค่าที่ set ใน `ngAfterViewInit` หายไป `ngOnChanges` จึง intercept ทุกครั้งที่ `formData` เปลี่ยน

## Prevention

| Situation | Use |
|-----------|-----|
| Set ค่าก่อน form render (object มีค่าแล้ว) | กำหนดค่าใน parent ก่อน pass |
| Set ค่าหลัง form render ครั้งแรก | `ngAfterViewInit` + `instance.updateData()` |
| Parent ส่ง object ใหม่ทีหลัง | `ngOnChanges` |

## Engineering Principle

DevExtreme widget มี rendering pipeline ของตัวเอง — การ mutate JavaScript object โดยตรงไม่ทำให้ widget รู้ว่าข้อมูลเปลี่ยน ต้องใช้ API ของ widget เสมอ

Related: [[Angular Lifecycle Hooks — @ViewChild Timing]], [[DevExtreme dx-form Rendering Rules]]