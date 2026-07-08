# Multi-Page Form Stepper Pattern

## What happened?

ต้องแบ่งฟอร์ม DevExtreme `dx-form` เดิมที่เป็นหน้าเดียวยาวๆ ออกเป็นหลาย step (wizard) พร้อม stepper UI ที่ task-container ควบคุมได้ (ปุ่ม back/next, กดเลขหน้าเพื่อข้ามได้)

## Pattern

### State

```typescript
_currentFormPage: number = 1;
_totalFormPages: number = 3;
_formPageCompleted: boolean[] = [];
```

### Method ชุดมาตรฐาน

```typescript
initializeFormPageCompleted(): void {
  if (this._formPageCompleted.length !== this._totalFormPages) {
    this._formPageCompleted = Array(this._totalFormPages).fill(false);
  }
}

updateStepperConfig(): void {
  this.initializeFormPageCompleted();
  this._taskInfoShard?.setStepperConfig({
    totalPages: this._totalFormPages,
    currentPage: this._currentFormPage,
    completedSteps: [...this._formPageCompleted],
  });
}

async onGoToPage(page: number): Promise<void> {
  if (page < 1 || page > this._totalFormPages) return;
  if (page === this._currentFormPage) return;
  if (page > this._currentFormPage && !(await this.validateCurrentPage())) return;
  this._currentFormPage = page;
  this.updateStepperConfig();
}

async onNextPage() {
  if (this._currentFormPage >= this._totalFormPages) return;
  if (!(await this.validateCurrentPage())) return;
  this._currentFormPage++;
  this.updateStepperConfig();
}

onPreviousPage() {
  if (this._currentFormPage <= 1) return;
  this._currentFormPage--;
  this.updateStepperConfig();
}
```

### ผูกกับ task-container (เผื่อกดเลขหน้าจาก stepper UI ภายนอก component)

```typescript
setTimeout(() => {
  this.updateStepperConfig();
  if (this._taskInfoShard?.container) {
    (this._taskInfoShard.container as any).navigateToPage = async (page: number) => {
      this.onGoToPage(page);
    };
  }
}, 100);
```

### Guard ปิดกั้นไม่ให้ข้ามหน้าถ้ายังไม่กรอกข้อมูลจำเป็น

จุดเดียวที่ต้องแก้เพื่อ block การเปลี่ยนหน้า คือ `validateCurrentPage()` — ทั้ง `onNextPage` และ `onGoToPage` (ทิศไปข้างหน้า) เรียกผ่านจุดนี้จุดเดียว:

```typescript
async validateCurrentPage(): Promise<boolean> {
  if (this._currentFormPage === 1 && !this.approveValue) {
    DialogWarning("แจ้งเตือน", "กรุณาเลือกผลการดำเนินการก่อน");
    return false;
  }
  return true;
}
```

### เนื้อหาแต่ละหน้าใน dx-form

ครอบเนื้อหาแต่ละหน้าด้วย `ng-container *ngIf="_currentFormPage === N"` ทั้งก้อน (การ์ด + ปุ่มควบคุมประจำหน้านั้น) อย่าลืมว่าปุ่มควบคุมที่วางใน `dx-form` ต้องผ่าน `cellTemplate` + `dxTemplate` (ดู [[DevExtreme dx-form Rendering Rules]]) และตั้งชื่อ template ไม่ให้ซ้ำข้ามหน้า (ดู [[Duplicate cellTemplate Name in dx-form]])

## Prevention / Checklist เวลาเพิ่ม stepper ให้ฟอร์มเดิม

1. เช็คว่า field ที่ guard ใช้ (เช่น `approveValue`) ถูก wire ไว้จริงหรือไม่ — ดู [[Declared but Unassigned State]]
2. เนื้อหาทุกหน้าต้องอยู่ใต้ `*ngIf` ของหน้านั้นจริง ไม่มี section ที่หลุดแสดงทุกหน้า
3. ปุ่มบันทึก/ยืนยันด้านล่างสุด (นอก `dx-form`) ต้อง gate ด้วย `_currentFormPage === _totalFormPages` ไม่ใช่แค่ `readonly === false`

## Engineering Principle

> Stepper ที่ดูเหมือน "แค่เพิ่มตัวแปรนับหน้า" จริงๆ ต้องมี 3 ส่วนทำงานร่วมกันเสมอ: state, navigation method, และ validation gate — ถ้าขาดส่วนไหนไปหนึ่งส่วน ฟีเจอร์จะดูเหมือนทำงานได้บางส่วนแต่พังแบบเงียบๆ

Related: [[DevExtreme dx-form Rendering Rules]], [[Duplicate cellTemplate Name in dx-form]], [[Declared but Unassigned State]], [[Conditional Validation Pattern]]

อ้างอิงจาก: [[2026-07-02]]
