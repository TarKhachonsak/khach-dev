# Debugging Backend Breakpoint Not Hit Checklist

## What happened?

กด action บนหน้าเว็บ (เช่นปุ่ม "ยืนยันส่งขั้นตอนถัดไป") แล้ว breakpoint ที่ตั้งไว้ใน backend (เช่น Visual Studio) ไม่ติด ทั้งที่ปุ่มอื่นในหน้าเดียวกัน (เช่น "บันทึกร่าง") กด breakpoint ติดปกติ

## Why did it happen?

อาการนี้มีสาเหตุที่เป็นไปได้อย่างน้อย 4 ชั้น เรียงจาก frontend ไปจนถึง debugger setup ต้องตัดออกทีละชั้นด้วยหลักฐานจริง ไม่ใช่เดาข้ามไปที่ backend logic ทันที:

1. **Frontend logic short-circuit ก่อนยิง request จริง** — guard condition/observable chain ที่ `return`/`of({...})` เงียบๆ ก่อนถึง `http.post` จริง
2. **Frontend ยิง request ไปผิด host** — environment config ชี้ไป remote server ไม่ใช่ localhost ที่กำลัง debug อยู่
3. **Request ถึง backend host ถูกต้องแล้ว (เห็น response กลับมาใน Network tab) แต่ debugger attach ผิด process** — เช่น process ที่รันจริงเป็นคนละ instance กับที่ IDE attach อยู่ หรือรันจาก build เก่า/Release ที่ไม่มี PDB ตรงกัน
4. **Request ไปถูก process แล้ว แต่ breakpoint อยู่คนละ method/route จาก endpoint จริงที่ถูกเรียก** — โดยเฉพาะเมื่อปุ่มต่างกันในหน้าเดียวกันยิงไปคนละ service/endpoint กัน (ดู [[Service Endpoint Mismatch Blocks Field From Persisting]])

## How was it fixed?

Diagnose ตามลำดับจากง่ายไปยาก:

1. เปิด DevTools **Network tab** ก่อนเสมอ — เช็คว่ามี request ออกจริงไหม และไปที่ host ไหน
2. ถ้า **ไม่มี request เลย** → ปัญหาอยู่ที่ frontend logic (เช็ค condition/`.pipe()` chain ก่อนถึง HTTP call จริง)
3. ถ้า **มี request แต่ host ผิด** → เช็ค environment config (`environment*.ts`) ว่า apiUrl/host ชี้ไปถูกเครื่องหรือไม่
4. ถ้า **request ถึง host ถูกและได้ response กลับมาแล้ว (เช่น 200) แต่ breakpoint ยังไม่ติด** → ปัญหาไม่ใช่ frontend อีกต่อไป ให้เช็คว่า IDE debugger attach ตรง process จริงที่กำลังฟัง port อยู่หรือไม่ (เทียบ PID) และ breakpoint อยู่ใน method ที่ถูกเรียกจริงหรือไม่

## How can it be prevented?

- ก่อนสงสัยโค้ด backend เสมอเช็ค Network tab เป็นจุดแรก — แยกให้ออกว่า "ไม่มี request" กับ "มี request แต่ debugger ไม่ติด" เป็นคนละปัญหา คนละวิธีแก้
- เมื่อมีหลายปุ่ม/action ในฟอร์มเดียวกัน (save draft vs submit/approve) อย่าสมมติว่ายิง endpoint เดียวกัน — grep service call ของแต่ละปุ่มเทียบกันจริงก่อน

## What engineering principle was learned?

อาการ "โค้ด backend ไม่ทำงานตามที่คาด" มีชั้นความเป็นไปได้อย่างน้อย 4 ชั้นตั้งแต่ frontend logic ไปถึง debugger setup — ต้องตัดออกทีละชั้นด้วยหลักฐานจริง (Network tab, PID, breakpoint binding) ไม่ใช่กระโดดไปสรุปที่ backend logic ทันทีเพราะเป็นจุดที่ "ดูน่าจะผิด" ที่สุด

## Interview Question

**English Question:** You click a button in a web app expecting a specific backend controller method to run, but a breakpoint set inside that method never hits — even though another button on the same page does hit its breakpoint fine. Walk through your debugging approach.

**English Answer:** Don't jump straight to backend code. First open the Network tab to check whether a request was even sent, and to what host/URL. If no request went out, the issue is frontend logic short-circuiting before the call. If a request went out to the wrong host, it's an environment/config issue (e.g. pointing to a remote server instead of localhost). If the request reaches the correct host and even returns a response, but the breakpoint still doesn't hit, the problem has shifted to the debugger itself — check that the IDE is attached to the actual running process (matching PID) and that the breakpoint is inside the method that's actually being invoked, since different buttons may call entirely different endpoints.

**Thai Question:** กดปุ่มในหน้าเว็บแล้วคาดว่า backend controller method หนึ่งจะทำงาน แต่ breakpoint ที่ตั้งไว้ในเมธอดนั้นไม่ติดเลย ทั้งที่ปุ่มอื่นในหน้าเดียวกันกด breakpoint ติดปกติ จะไล่ debug ยังไง?

**Thai Answer:** อย่าเพิ่งกระโดดไปดูโค้ด backend ก่อน เปิด Network tab เช็คก่อนว่ามี request ออกจริงไหม และไปที่ host ไหน ถ้าไม่มี request เลยแปลว่าปัญหาอยู่ที่ frontend logic ที่ return ก่อนยิงจริง ถ้ามี request แต่ไปผิด host แปลว่าเป็นปัญหา environment config (เช่นชี้ไป remote server แทนที่จะเป็น localhost) ถ้า request ไปถูก host แล้วได้ response กลับมาด้วยซ้ำแต่ breakpoint ยังไม่ติด ปัญหาย้ายไปอยู่ที่ debugger เอง ต้องเช็คว่า IDE attach ตรง process จริงที่กำลังรันอยู่ (PID ตรงกัน) และ breakpoint อยู่ใน method ที่ถูกเรียกจริง เพราะปุ่มต่างกันอาจยิงไปคนละ endpoint กันเลย

**Thai Explanation:** เทคนิคนี้สำคัญเพราะคนส่วนใหญ่เจออาการนี้แล้วเดาไปที่ backend logic ทันที (เช่น "โค้ดมีบั๊ก" หรือ "condition ผิด") ทั้งที่จริงๆ อาจไม่เคย request ไปถึง backend เลยด้วยซ้ำ การเช็ค Network tab ก่อนเป็นวิธีที่เร็วและตัดความเป็นไปได้ออกได้เยอะที่สุดในเวลาสั้นที่สุด ก่อนเสียเวลาไล่โค้ด backend ที่อาจไม่เกี่ยวข้องเลย

Related: [[Service Endpoint Mismatch Blocks Field From Persisting]]

Source: [[2026-07-13]]
