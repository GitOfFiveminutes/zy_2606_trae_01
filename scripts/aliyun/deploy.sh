#!/bin/bash
set -e

REGION="${REGION:-cn-hangzhou}"
REGISTRY="${REGISTRY:-registry.${REGION}.aliyuncs.com}"
NAMESPACE="${NAMESPACE:?NAMESPACE is required}"
IMAGE_NAME="${IMAGE_NAME:-zy_2606_trae_01}"
TAG="${TAG:-latest}"
ECS_HOST="${ECS_HOST:?ECS_HOST is required}"
SSH_USER="${SSH_USER:-root}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"
SSH_PORT="${SSH_PORT:-22}"
HOST_PORT="${HOST_PORT:-80}"
CONTAINER_PORT="${CONTAINER_PORT:-80}"

FULL_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${TAG}"

echo "========================================"
echo "  Aliyun Full Deploy Script"
echo "========================================"
echo ""
echo "Image:   ${FULL_IMAGE}"
echo "ECS:     ${SSH_USER}@${ECS_HOST}:${SSH_PORT}"
echo ""

echo "[1/5] Building Docker image..."
docker build -t "${FULL_IMAGE}" -f Dockerfile .

echo "[2/5] Logging in to ACR..."
docker login "${REGISTRY}"

echo "[3/5] Pushing image..."
docker push "${FULL_IMAGE}"

echo "[4/5] Deploying to ECS..."
ssh -i "${SSH_KEY}" -p "${SSH_PORT}" -o StrictHostKeyChecking=no "${SSH_USER}@${ECS_HOST}" <<EOF
set -e
docker login "${REGISTRY}"
docker pull "${FULL_IMAGE}"
docker stop "${IMAGE_NAME}" 2>/dev/null || true
docker rm "${IMAGE_NAME}" 2>/dev/null || true
docker run -d \
  --name "${IMAGE_NAME}" \
  --restart unless-stopped \
  -p ${HOST_PORT}:${CONTAINER_PORT} \
  --health-cmd="wget --spider -q http://localhost/healthz || exit 1" \
  --health-interval=30s \
  --health-timeout=5s \
  --health-retries=3 \
  "${FULL_IMAGE}"
docker image prune -f
EOF

echo "[5/5] Verifying deployment..."
sleep 5
ssh -i "${SSH_KEY}" -p "${SSH_PORT}" -o StrictHostKeyChecking=no "${SSH_USER}@${ECS_HOST}" \
  "docker ps --filter name=${IMAGE_NAME} --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

echo ""
echo "========================================"
echo "  Done! Visit http://${ECS_HOST}:${HOST_PORT}"
echo "========================================"
