param(
    [Parameter(Mandatory=$true)]
    [string]$EcsHost,

    [Parameter(Mandatory=$true)]
    [string]$SshUser,

    [string]$SshKey = "~/.ssh/id_rsa",

    [string]$SshPort = "22",

    [string]$Region = "cn-hangzhou",

    [string]$Registry = "",

    [Parameter(Mandatory=$true)]
    [string]$Namespace,

    [string]$ImageName = "zy_2606_trae_01",

    [string]$Tag = "latest",

    [string]$ContainerPort = "80",

    [string]$HostPort = "80"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrEmpty($Registry)) {
    $Registry = "registry.$Region.aliyuncs.com"
}

$FullImage = "$Registry/$Namespace/$ImageName`:$Tag"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Aliyun ECS Deploy Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ECS Host:     $EcsHost" -ForegroundColor Yellow
Write-Host "SSH User:     $SshUser" -ForegroundColor Yellow
Write-Host "Image:        $FullImage" -ForegroundColor Yellow
Write-Host "Port Mapping: $HostPort`:$ContainerPort" -ForegroundColor Yellow
Write-Host ""

$DeployCommands = @"
set -e
echo "[1/4] Logging in to ACR..."
docker login $Registry

echo "[2/4] Pulling latest image..."
docker pull $FullImage

echo "[3/4] Stopping and removing old container..."
docker stop $ImageName 2>/dev/null || true
docker rm $ImageName 2>/dev/null || true

echo "[4/4] Starting new container..."
docker run -d \
  --name $ImageName \
  --restart unless-stopped \
  -p $HostPort`:$ContainerPort \
  --health-cmd="wget --spider -q http://localhost/healthz || exit 1" \
  --health-interval=30s \
  --health-timeout=5s \
  --health-retries=3 \
  $FullImage

echo "Cleaning up old images..."
docker image prune -f

echo ""
echo "========================================"
echo "  Deployment successful!"
echo "  Access: http://$EcsHost`:$HostPort"
echo "========================================"
"@

Write-Host "Connecting to ECS and executing deployment..." -ForegroundColor Green
ssh -i $SshKey -p $SshPort -o StrictHostKeyChecking=no $SshUser@$EcsHost $DeployCommands

if ($LASTEXITCODE -ne 0) {
    Write-Error "Deployment failed"
    exit 1
}

Write-Host ""
Write-Host "Deployment completed successfully!" -ForegroundColor Green
