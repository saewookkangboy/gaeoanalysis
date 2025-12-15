#!/bin/bash

# Day 7 통합 테스트 스크립트
# 사용법: ./scripts/test-day7.sh

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
SKIPPED=0

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Day 7: 통합 테스트 및 배포 검증${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Base URL: $BASE_URL"
echo ""

# 테스트 함수
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local expected_status=${4:-200}
    local data=${5:-""}
    
    echo -n "  테스트: $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" -H "Content-Type: application/json" 2>&1)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$data" 2>&1)
    elif [ "$method" = "PATCH" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PATCH "$url" -H "Content-Type: application/json" -d "$data" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ 통과${NC} (HTTP $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ 실패${NC} (예상: HTTP $expected_status, 실제: HTTP $http_code)"
        if [ -n "$body" ] && [ ${#body} -lt 200 ]; then
            echo "    응답: $body"
        fi
        ((FAILED++))
        return 1
    fi
}

# 1. 빌드 테스트
echo -e "${BLUE}📦 1. 빌드 테스트${NC}"
echo "  빌드 실행 중..."
if npm run build > /tmp/build.log 2>&1; then
    echo -e "  ${GREEN}✓ 빌드 성공${NC}"
    ((PASSED++))
else
    echo -e "  ${RED}✗ 빌드 실패${NC}"
    echo "  로그 확인: /tmp/build.log"
    ((FAILED++))
fi
echo ""

# 2. Health Check 테스트
echo -e "${BLUE}🏥 2. Health Check 테스트${NC}"
test_endpoint "Health Check" "GET" "$BASE_URL/api/health" 200
echo ""

# 3. 인증이 필요한 API 테스트 (401 예상)
echo -e "${BLUE}🔐 3. 인증 보안 테스트${NC}"
test_endpoint "Admin 구독 조회 (인증 필요)" "GET" "$BASE_URL/api/admin/subscriptions" 401
test_endpoint "구독 조회 (인증 필요)" "GET" "$BASE_URL/api/subscription" 401
test_endpoint "사용량 조회 (인증 필요)" "GET" "$BASE_URL/api/usage" 401
test_endpoint "분석 API (인증 필요)" "POST" "$BASE_URL/api/analyze" 401 "{\"url\":\"https://example.com\"}"
echo ""

# 4. 정적 페이지 접근 테스트
echo -e "${BLUE}📄 4. 페이지 접근 테스트${NC}"
test_endpoint "메인 페이지" "GET" "$BASE_URL/" 200
test_endpoint "About 페이지" "GET" "$BASE_URL/about" 200
test_endpoint "Admin 대시보드" "GET" "$BASE_URL/admin" 200
test_endpoint "Admin 구독 관리" "GET" "$BASE_URL/admin/subscriptions" 200
echo ""

# 5. API 엔드포인트 존재 확인
echo -e "${BLUE}🔍 5. API 엔드포인트 존재 확인${NC}"
test_endpoint "History API" "GET" "$BASE_URL/api/history" 401
test_endpoint "Chat API" "POST" "$BASE_URL/api/chat" 401 "{\"message\":\"test\"}"
echo ""

# 결과 요약
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  테스트 결과 요약${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}통과: $PASSED${NC}"
echo -e "  ${RED}실패: $FAILED${NC}"
echo -e "  ${YELLOW}건너뜀: $SKIPPED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 테스트 통과!${NC}"
    exit 0
else
    echo -e "${RED}❌ 일부 테스트 실패${NC}"
    exit 1
fi

