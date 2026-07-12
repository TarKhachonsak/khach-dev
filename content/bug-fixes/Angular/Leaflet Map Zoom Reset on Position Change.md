# Bug: Leaflet Map Zoom Reset ทุกครั้งที่คลิกเลือกพิกัด

## What Happened?

ใน `LeafletMapOverviewComponent` ทุกครั้งที่ user คลิกเลือกตำแหน่งบนแผนที่ แผนที่จะ zoom out กลับไปที่ zoom level 13 อัตโนมัติ

## Root Cause

**Data flow ที่ทำให้เกิด loop:**

1. User คลิกแผนที่ → `positionChange.emit({ lat, lng })`
2. Parent รับ event → อัปเดต `formData.INVESTIGATION_ADDR_LATITUDE/LONGITUDE`
3. Angular detect change → `@Input() lat` และ `lng` ใน component เปลี่ยน
4. `ngOnChanges` ทำงาน → เรียก `this.map.setView([lat, lng], 13)` → **zoom reset!**

```typescript
// ❌ ก่อนแก้: ngOnChanges reset zoom ทุกครั้ง input เปลี่ยน
ngOnChanges(changes: any) {
    if ((changes['lat'] || changes['lng']) && this.map && this.marker) {
        this.map.setView([this.lat, this.lng], 13); // ← ตัวปัญหา
        this.marker.setLatLng([this.lat, this.lng]);
    }
}
```

## Fix

```typescript
// ✅ หลังแก้: แค่เลื่อนหมุด ไม่ reset view
ngOnChanges(changes: any) {
    if ((changes['lat'] || changes['lng']) && this.map && this.marker) {
        this.marker.setLatLng([this.lat, this.lng]);
    }
}
```

`ngOnChanges` มี 2 use case:
- **โหลดข้อมูลครั้งแรก** → `showMap()` จัดการ `setView` เองอยู่แล้ว
- **User interact** → ไม่ต้อง setView เพราะแผนที่อยู่ที่ตำแหน่งนั้นแล้ว

## How to Prevent

ระวัง `ngOnChanges` ที่ทำ side effect ซ้ำซ้อนกับ user interaction:
- Input change ที่เกิดจาก user action ใน component เดิม → ไม่ควร reset state
- แยก "initial load" กับ "user interaction" ให้ชัดเจน

## Engineering Principle

> `ngOnChanges` ออกแบบมาสำหรับ **external data update** (parent ส่งค่าใหม่)  
> ไม่ใช่สำหรับ react กับ user interaction ที่ component emit ออกไปเอง

เมื่อ component emit ค่าออกไปแล้ว parent bounce กลับมาเป็น Input → `ngOnChanges` fire แต่ไม่ควร reset UI state ที่ user กำลัง interact อยู่

## Interview Question

**English Question:** What is the risk of calling `map.setView()` inside `ngOnChanges` when the component also emits position changes?

**English Answer:** It creates a self-triggering loop. User interaction emits a value → parent updates the Input → `ngOnChanges` fires → resets the map view → bad UX.

**Thai Explanation:** `ngOnChanges` ไม่รู้ว่าค่าที่เปลี่ยนมาจาก parent จริงๆ หรือมาจาก emit ของตัวเอง การ reset UI state ใน ngOnChanges จึงต้องระวังเป็นพิเศษ

Related: [[Angular Lifecycle Hooks — @ViewChild Timing]], [[Angular Input Object Reference]], [[Getter With Side Effect Breaks Change Detection]]

## Update 2026-07-10 — parent เรียก showMap() ซ้ำจนแผนที่ไม่ขึ้นตอนย้อนกลับหน้า

พบบั๊กอีกจุดในคู่ parent-child เดียวกัน (`crime-scene-location-redesign` → `LeafletMapOverviewComponent`): แผนที่ไม่ render เลยตอน user ย้อนกลับมาหน้าเดิม

**Root cause:** `showMap()` ของ `LeafletMapOverviewComponent` ออกแบบเป็น toggle (`this.isMapVisible = !this.isMapVisible`) — parent เรียกฟังก์ชันนี้ซ้ำถึง 2 จุด (`ngOnChanges` ทุกครั้งที่ input เปลี่ยน และ `ngAfterViewInit`) ในขณะที่ child เองก็เรียก `this.showMap()` ใน `ngAfterViewInit` ของตัวเองอยู่แล้ว ผลคือแผนที่ถูกสร้าง (`isMapVisible: false → true`) แล้วถูก toggle กลับปิดทันที (`true → false`) จาก call ที่สองก่อนแม้แต่ `setTimeout` ที่สร้าง Leaflet map จริงจะทำงานเสร็จ

**Fix:** ลบการเรียก `mapComponent.showMap()` ที่ parent ทั้งสองจุดทิ้ง — ปล่อยให้ child จัดการ init ของตัวเองใน `ngAfterViewInit` เพียงจุดเดียว ส่วนปุ่ม "ระบุพิกัด" ที่ parent ยังเรียก `showMap()` ได้ตามปกติ เพราะเป็นการ toggle แบบตั้งใจจาก user action จุดเดียว ไม่ใช่ lifecycle hook ที่ยิงซ้ำ

**บทเรียนเพิ่มเติม:** เมื่อ child component ออกแบบ public method เป็น "toggle" (ไม่ใช่ "set true/false ตรง ๆ") parent ที่เรียก method นี้จากมากกว่า 1 lifecycle hook มีความเสี่ยงสูงที่จะเรียกซ้ำโดยไม่ตั้งใจ เพราะนับจำนวนครั้งที่ถูกเรียกได้ยากเมื่อ hook หลายตัวทำงานใกล้กัน — ถ้าเป็นไปได้ควรออกแบบ public API ของ child เป็น `show()`/`hide()` แยกกัน (idempotent) แทน toggle เดียว เพื่อไม่ให้จำนวนครั้งที่เรียกมีผลต่อ state สุดท้าย

Source เพิ่มเติม: [[2026-07-10]]
