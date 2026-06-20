param(
    [string]$Region = "cn-south-1",
    [string]$Registry = "",
    [Parameter(Mandatory=$true)]
    [string]$Org,
    [string]$ImageName = "zy_2606_trae_01",
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrEmpty($Registry)) {
    $Registry = "swr.$Region.myhuaweicloud.com"
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HuaweiCloud SWR Build & Push Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$FullImage = "$Registry/$Org/$ImageName`:$Tag"
Write-Host "Target Image: $FullImage" -ForegroundColor Yellow
Write-Host ""

Write-Host "[1/3] Logging in to Huawei SWR..." -ForegroundColor Green
docker login $Registry
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker login failed"
    exit 1
}
Write-Host "Login successful." -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] Building Docker image..." -ForegroundColor Green
docker build -t $FullImage -f Dockerfile .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed"
    exit 1
}
Write-Host "Build successful." -ForegroundColor Green
Write-Host ""

Write-Host "[3/3] Pushing image to SWR..." -ForegroundColor Green
docker push $FullImage
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker push failed"
    exit 1
}
Write-Host "Push successful." -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Done! Image: $FullImage" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
