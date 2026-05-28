# IP adresini otomatik al
$IP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi").IPAddress
Write-Host "IP Adresi: $IP" -ForegroundColor Green

# api.ts dosyasını güncelle
$apiFile = "api.ts"
$content = Get-Content $apiFile -Raw
$content = $content -replace "return 'http://[\d\.]+:8000'", "return 'http://${IP}:8000'"
Set-Content $apiFile $content
Write-Host "api.ts güncellendi" -ForegroundColor Green

# Backend'i yeni pencerede başlat
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\disaster-match\backend; venv\Scripts\activate; uvicorn main:app --reload --host 0.0.0.0"

# Expo'yu başlat
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $IP
npx expo start