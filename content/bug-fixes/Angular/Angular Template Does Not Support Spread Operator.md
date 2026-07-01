# Bug: Angular Template ไม่รองรับ Spread Operator `...`

## What Happened?

พยายามใช้ spread operator ใน Angular template expression เพื่อ filter array ของ radio options แบบ conditional:

```html
[items]="[
    { text: 'Option A', value: 'A' },
    ...(condition ? [{ text: 'Option B', value: 'B' }] : [])
]"
```

ได้รับ error:
```
NG5002: Parser Error: Unexpected token . at column N
```

## Root Cause

Angular template expression ไม่ใช่ JavaScript เต็มรูปแบบ — Angular Template Language (ATL) มี subset ของ JS expression เท่านั้น และ **ไม่รองรับ spread operator `...`**

## Fix

ย้าย logic ไปไว้ใน component TypeScript แทน:

```typescript
// component.ts
get radioOptions(): any[] {
    const base = [
        { text: 'Option A', value: 'A' },
        { text: 'Option C', value: 'C' },
    ];
    if (this.taskFormCode !== 'FLOW_04_TASK_058') {
        base.push({ text: 'ปรากฏผู้ถูกกล่าวหาที่แท้จริง', value: 'I' });
    }
    return base;
}
```

```html
<!-- template -->
[items]="radioOptions"
```

## Angular Template Limitations (สิ่งที่ทำไม่ได้)

| Feature | ใน Template | ทางออก |
|---|---|---|
| Spread `...` | ❌ | getter ใน TS |
| `typeof` | ❌ | method/getter |
| `new` keyword | ❌ | สร้างใน TS |
| `try/catch` | ❌ | method ใน TS |
| Array destructuring | ❌ | method ใน TS |

## Engineering Principle

> Angular template เป็น **view layer** เท่านั้น  
> Logic ที่ซับซ้อนกว่า simple conditional/pipe ให้ย้ายเข้า component

## Interview Question

**English Question:** Why can't you use the JavaScript spread operator `...` inside Angular template expressions?

**English Answer:** Angular's template language is a restricted subset of JavaScript. It supports basic expressions, pipes, and safe navigation, but not ES6+ features like spread, destructuring, or `new`. Complex logic should live in the component class.

**Thai Explanation:** Angular template ไม่ใช่ JavaScript เต็มรูปแบบ — ต้องย้าย logic ที่ใช้ spread หรือ feature ขั้นสูงไปไว้ใน component TypeScript แทน

Related: [[DevExtreme dx-form Rendering Rules]]