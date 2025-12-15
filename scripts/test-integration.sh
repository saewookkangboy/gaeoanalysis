#!/bin/bash

# 통합 테스트 스크립트
# 사용법: ./scripts/test-integration.sh

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 통합 테스트 시작..."
echo "Base URL: $BASE_URL"
echo ""

# 테스트 함수
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local expected_status=${4:-200}
    
    echo -n "테스트: $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" -H "Content-Type: application/json" 2>&1)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$5" 2>&1)
    elif [ "$method" = "PATCH" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PATCH "$url" -H "Content-Type: application/json" -d "$5" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ 통과${NC} (HTTP $http_code)"
        return 0
    else
        echo -e "${RED}✗ 실패${NC} (예상: HTTP $expected_status, 실제: HTTP $http_code)"
        echo "응답: $body"
        return 1
    fi
}

# 1. Health Check
echo "📋 1. Health Check 테스트"
test_endpoint "Health Check" "GET" "$BASE_URL/api/health" 200
echo ""

# 2. Admin 구독 관리 API 테스트
echo "📋 2. Admin 구독 관리 API 테스트"
test_endpoint "Admin 구독 조회 (인증 필요)" "GET" "$BASE_URL/api/admin/subscriptions" 401
echo ""

# 3. 구독 API 테스트
echo "📋 3. 구독 API 테스트"
test_endpoint "구독 조회 (인증 필요)" "GET" "$BASE_URL/api/subscription" 401
echo ""

# 4. 사용량 API 테스트
echo "📋 4. 사용량 API 테스트"
test_endpoint "사용량 조회 (인증 필요)" "GET" "$BASE_URL/api/usage" 401
echo ""

echo ""
echo "✅ 기본 API 엔드포인트 테스트 완료"
echo ""
echo "⚠️  인증이 필요한 API는 실제 세션 토큰이 필요합니다."
echo "   브라우저에서 직접 테스트하거나, 인증 토큰을 포함하여 테스트하세요."

