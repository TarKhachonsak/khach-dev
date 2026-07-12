# คู่มือการใช้งาน khach-dev

## ข้อมูลโปรเจกต์

| รายการ | ค่า |
|--------|-----|
| Obsidian Vault | `C:\Users\khach\Obsidian Vault\Programming` |
| โปรเจกต์เว็บ | `C:\Users\khach\Development\Personal Project\khach-dev` |
| GitHub | `https://github.com/TarKhachonsak/khach-dev` |
| Vercel Dashboard | `https://vercel.com/dashboard` |

---

## การทำงานประจำวัน

สิ่งที่ต้องทำเองมีแค่อย่างเดียว — เปิด Claude Code แล้วพิมพ์:

```
/programming-journal
```

ตอบวันที่ที่ Claude ถาม → รอให้เขียน note ลง Obsidian → watcher deploy ให้อัตโนมัติ

### ระบุวันที่เฉพาะเจาะจง

```
/programming-journal 2026/07/12
```

---

## ไฟล์และหน้าที่

| ไฟล์ | หน้าที่ |
|------|---------|
| `scripts/watch-vault.ps1` | polling vault ทุก 5 วินาที ตรวจหาไฟล์เปลี่ยน debounce 15 วินาที |
| `scripts/sync-vault.ps1` | copy .md จาก vault → `content/` ใน repo |
| `deploy.ps1` | เรียก sync → `git add content/` → commit → push |

---

## คำสั่งที่ใช้บ่อย

### เช็คสถานะ

```powershell
# เช็ค watcher รันอยู่ไหม
Get-ScheduledTask -TaskName "ObsidianVaultWatcher"

# เช็ค commit ล่าสุด
cd "C:\Users\khach\Development\Personal Project\khach-dev"
git log --oneline -5

# เช็คไฟล์ล่าสุดใน vault
Get-ChildItem "C:\Users\khach\Obsidian Vault\Programming" -Recurse -Filter "*.md" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 5 FullName, LastWriteTime

# เช็คไฟล์ค้างที่ยังไม่ push
cd "C:\Users\khach\Development\Personal Project\khach-dev"
git status
```

### Deploy

```powershell
# deploy ด้วยมือ (กรณีมีไฟล์ค้าง)
cd "C:\Users\khach\Development\Personal Project\khach-dev"
.\deploy.ps1

# รัน watcher ด้วยมือ (ทดสอบ หรือ Task Scheduler ไม่ทำงาน)
cd "C:\Users\khach\Development\Personal Project\khach-dev"
.\scripts\watch-vault.ps1 -VaultPath "C:\Users\khach\Obsidian Vault\Programming"
```

### Task Scheduler

```powershell
# เช็ค task และ arguments
$task = Get-ScheduledTask -TaskName "ObsidianVaultWatcher"
$task.Actions | Select-Object Execute, Arguments, WorkingDirectory
$task.Triggers | Select-Object UserId

# เริ่ม / หยุด / ลบ task
Start-ScheduledTask -TaskName "ObsidianVaultWatcher"
Stop-ScheduledTask -TaskName "ObsidianVaultWatcher"
Unregister-ScheduledTask -TaskName "ObsidianVaultWatcher" -Confirm:$false

# ตั้ง Task Scheduler ใหม่ (Run as Administrator)
$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"C:\Users\khach\Development\Personal Project\khach-dev\scripts\watch-vault.ps1`" -VaultPath `"C:\Users\khach\Obsidian Vault\Programming`"" `
  -WorkingDirectory "C:\Users\khach\Development\Personal Project\khach-dev"
$trigger = New-ScheduledTaskTrigger -AtLogon -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit 0 `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask `
  -TaskName "ObsidianVaultWatcher" `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -RunLevel Highest `
  -Force
Stop-ScheduledTask -TaskName "ObsidianVaultWatcher"
Start-ScheduledTask -TaskName "ObsidianVaultWatcher"
```

### Git

```powershell
# deploy ไฟล์ค้างด้วยมือ (กรณี watcher พลาด)
cd "C:\Users\khach\Development\Personal Project\khach-dev"
git add content/
git commit -m "sync: manual deploy"
git push origin main
```

---

## Flow การทำงาน

```
Login Windows
    → Task Scheduler รัน watch-vault.ps1 อัตโนมัติ
        → polling vault ทุก 5 วินาที

ทำงานใน Claude Code
    → /programming-journal (วันละครั้ง)
        → Claude เขียน .md ลง Obsidian vault
            → watch-vault.ps1 เห็นการเปลี่ยนแปลง (debounce 15 วิ)
                → deploy.ps1
                    → sync-vault.ps1 (copy .md → content/)
                    → git add content/ + commit + push
                        → Vercel rebuild อัตโนมัติ
                            → เว็บอัปเดต (~1-2 นาที)
```

---

## การแก้ไขปัญหา

### เว็บไม่อัปเดต

1. เช็ค watcher รันอยู่ไหม
   ```powershell
   Get-ScheduledTask -TaskName "ObsidianVaultWatcher"
   # State ต้องเป็น Running
   ```
2. เช็ค commit ล่าสุดมี sync message ไหม
   ```powershell
   git log --oneline -3
   ```
3. ถ้าไม่มี commit ใหม่ → รัน `.\deploy.ps1` ด้วยมือ
4. ถ้า deploy แล้วยังไม่อัปเดต → เช็ค Vercel Dashboard

### watcher ไม่จับการเปลี่ยนแปลง

```powershell
# รัน watcher ด้วยมือเพื่อดู debug output
cd "C:\Users\khach\Development\Personal Project\khach-dev"
.\scripts\watch-vault.ps1 -VaultPath "C:\Users\khach\Obsidian Vault\Programming"
# สร้างไฟล์ใน Obsidian แล้วรอ 5 วินาที
# ควรเห็น [DEBUG] Changed: ...
```

### deploy.ps1 ไม่ push (No changes detected)

```powershell
cd "C:\Users\khach\Development\Personal Project\khach-dev"
git status
# ถ้าเห็น modified/untracked ใน content/ → รัน:
git add content/
git commit -m "sync: manual deploy"
git push origin main
```

### Task Scheduler ไม่รัน watcher

```powershell
# ลบแล้วตั้งใหม่ (Run as Administrator)
Unregister-ScheduledTask -TaskName "ObsidianVaultWatcher" -Confirm:$false
# แล้วรันคำสั่งตั้ง Task Scheduler ใหม่ด้านบน
```

---

## กรณีที่ต้อง deploy ด้วยมือ

| กรณี | วิธีแก้ |
|------|---------|
| มีไฟล์ค้างก่อน watcher รัน | `.\deploy.ps1` |
| watcher เพิ่งเปิดใหม่ | `.\deploy.ps1` ครั้งเดียว |
| Task Scheduler ไม่ทำงาน | Start task แล้วรัน `.\deploy.ps1` |

---

## หมายเหตุทางเทคนิค

**ทำไม polling แทน FileSystemWatcher**
Obsidian เขียนไฟล์แบบ atomic (เขียน temp file แล้ว rename) ทำให้ .NET `FileSystemWatcher` จับ event ไม่ได้บน Windows — polling แก้ปัญหานี้ได้ตรงจุด

**ทำไม debounce 15 วินาที**
`/programming-journal` เขียนหลาย note ต่อเนื่องกัน debounce ป้องกัน deploy หลายรอบโดยไม่จำเป็น รอให้เขียนเสร็จทั้งหมดแล้วค่อย deploy ครั้งเดียว

**ทำไม git add ก่อนเช็ค status**
`git status --porcelain` โชว์เฉพาะไฟล์ที่ staged แล้ว ถ้าเช็คก่อน add จะได้ค่าว่างเสมอแม้มีไฟล์เปลี่ยน
