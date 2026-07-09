# Node.js o'rnatish va loyihani ishga tushirish skripti
# PowerShell da ishga tushiring: .\setup.ps1

Write-Host "📦 Node.js tekshirilmoqda..." -ForegroundColor Cyan

$nodeUrl = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi"
$installerPath = "$env:TEMP\node-installer.msi"

# Node.js mavjudligini tekshirish
$nodeFound = Get-Command node -ErrorAction SilentlyContinue
if ($nodeFound) {
    Write-Host "✅ Node.js topildi: $(node --version)" -ForegroundColor Green
} else {
    Write-Host "⬇️  Node.js yuklab olinmoqda..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "📀 O'rnatilmoqda..." -ForegroundColor Yellow
    Start-Process msiexec.exe -Wait -ArgumentList "/i `"$installerPath`" /quiet /norestart"
    
    # PATH yangilash
    $env:PATH = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    Write-Host "✅ Node.js o'rnatildi!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Dependencies o'rnatilmoqda..." -ForegroundColor Cyan
npm install

Write-Host ""
Write-Host "🚀 Development server ishga tushirilmoqda..." -ForegroundColor Cyan
Write-Host "🌐 http://localhost:5173 da ochiladi" -ForegroundColor Green
npm run dev
