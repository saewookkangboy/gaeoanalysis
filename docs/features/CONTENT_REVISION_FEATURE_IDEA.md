# 콘텐츠 자동 수정 기능 아이디어

## 📋 개요

분석 점수 및 체크리스트 내용을 기반으로 원본 콘텐츠를 자동으로 수정하여 개선된 버전을 생성하는 기능입니다.

## 🎯 핵심 기능

### 1. **AI 기반 콘텐츠 수정 엔진**
   - 분석 결과 (점수, 인사이트, 체크리스트)를 기반으로 원본 콘텐츠를 자동 수정
   - Gemini API를 활용한 스마트 콘텐츠 개선
   - 원본 콘텐츠의 톤과 스타일 유지하면서 SEO/AEO/GEO 최적화

### 2. **수정 범위 옵션**
   - **전체 수정**: 전체 콘텐츠를 한 번에 수정
   - **섹션별 수정**: 특정 섹션만 선택하여 수정
   - **우선순위 기반 수정**: 낮은 점수 카테고리부터 순차적으로 수정
   - **체크리스트 기반 수정**: 선택한 체크리스트 항목만 반영하여 수정

### 3. **비교 및 미리보기**
   - **원본 vs 수정본 비교**: Side-by-side 비교 뷰
   - **변경 사항 하이라이트**: 추가/수정/삭제된 부분을 시각적으로 표시
   - **점수 예측**: 수정된 콘텐츠의 예상 점수 표시
   - **실시간 미리보기**: 수정 중인 콘텐츠를 실시간으로 확인

### 4. **다양한 수정 모드**
   - **빠른 수정**: 최소한의 변경으로 핵심 개선 사항만 반영
   - **표준 수정**: 균형잡힌 수정으로 대부분의 개선 사항 반영
   - **전면 수정**: 최대한의 개선을 위해 광범위한 수정 수행
   - **커스텀 수정**: 사용자가 원하는 체크리스트 항목만 선택하여 수정

## 🏗️ 구현 구조

### 컴포넌트 구조

```
components/
├── ContentRevision/
│   ├── ContentRevisionPanel.tsx      # 메인 수정 패널
│   ├── RevisionModeSelector.tsx      # 수정 모드 선택
│   ├── ChecklistSelector.tsx         # 체크리스트 항목 선택
│   ├── BeforeAfterView.tsx           # 전/후 비교 뷰
│   ├── RevisionPreview.tsx           # 수정 미리보기
│   ├── RevisionControls.tsx          # 수정 컨트롤 (적용/취소/다운로드)
│   └── ScorePrediction.tsx           # 예상 점수 표시
```

### API 구조

```
app/api/
├── content/
│   ├── revise/route.ts               # 콘텐츠 수정 API
│   └── preview/route.ts              # 수정 미리보기 API
```

### 라이브러리 구조

```
lib/
├── content-revision/
│   ├── revision-engine.ts            # 수정 엔진 로직
│   ├── prompt-builder.ts             # 수정 프롬프트 생성
│   ├── diff-generator.ts             # 변경 사항 분석
│   └── score-predictor.ts            # 예상 점수 계산
```

## 💡 상세 기능 아이디어

### 아이디어 1: 단계별 수정 가이드

**개념**: 체크리스트 항목별로 수정된 코드/텍스트를 제안

**구현**:
1. 체크리스트 항목을 하나씩 선택
2. 해당 항목에 대한 구체적인 수정 사항 생성
3. 원본과 수정본을 나란히 비교
4. 사용자가 승인하면 다음 항목으로 진행

**예시**:
```
체크리스트: "H1 태그 추가 (필수)"
원본: <div class="title">페이지 제목</div>
수정본: <h1>페이지 제목</h1>
예상 효과: SEO 점수 +8~12점
```

### 아이디어 2: 섹션별 수정

**개념**: 콘텐츠를 섹션(H2 기준)으로 나누어 각각 수정

**구현**:
1. 원본 콘텐츠를 섹션별로 분석
2. 각 섹션의 점수와 개선 사항 계산
3. 사용자가 수정할 섹션 선택
4. 선택한 섹션만 수정하여 표시
5. 수정된 섹션을 원본에 통합하여 최종 결과 생성

**장점**:
- 부분 수정 가능
- 사용자가 원하는 부분만 변경
- 점진적 개선 가능

### 아이디어 3: 점수 기반 우선순위 수정

**개념**: 낮은 점수 카테고리부터 우선적으로 수정

**구현**:
1. SEO, AEO, GEO 점수 중 가장 낮은 카테고리 확인
2. 해당 카테고리의 개선 사항을 먼저 반영
3. 점수가 개선되면 다음 카테고리로 이동
4. 종합 점수가 목표 점수에 도달할 때까지 반복

**예시**:
```
1단계: SEO 점수 45 → 65 (H1, Title, Meta 추가)
2단계: AEO 점수 50 → 70 (FAQ 섹션 추가)
3단계: GEO 점수 55 → 75 (콘텐츠 길이 확장)
최종: 종합 점수 50 → 70
```

### 아이디어 4: AI 프롬프트 기반 수정

**개념**: Gemini API를 활용하여 분석 결과를 바탕으로 콘텐츠 수정

**프롬프트 구조**:
```
당신은 SEO/AEO/GEO 전문가입니다. 다음 콘텐츠를 분석 결과를 바탕으로 수정해주세요.

[원본 콘텐츠]
{originalContent}

[분석 결과]
- SEO 점수: {seoScore}/100 (개선 필요: {seoIssues})
- AEO 점수: {aeoScore}/100 (개선 필요: {aeoIssues})
- GEO 점수: {geoScore}/100 (개선 필요: {geoIssues})

[개선 사항]
{checklistItems}

[수정 요구사항]
1. 원본 콘텐츠의 톤과 스타일을 유지하세요
2. 위 개선 사항을 반영하되, 자연스럽게 통합하세요
3. HTML 구조를 유지하세요 (태그 형식 보존)
4. 콘텐츠의 핵심 메시지는 변경하지 마세요

수정된 콘텐츠:
```

### 아이디어 5: 실시간 점수 예측

**개념**: 수정된 콘텐츠의 예상 점수를 실시간으로 계산

**구현**:
1. 수정된 콘텐츠를 분석 엔진에 전달
2. 빠른 점수 계산 (전체 분석 대신 핵심 지표만)
3. 예상 점수와 실제 개선 정도 표시
4. 사용자가 수정 전/후 점수를 비교하여 효과 확인

**표시 예시**:
```
원본 점수: SEO 45 | AEO 50 | GEO 55 | 종합 50
예상 점수: SEO 68 | AEO 72 | GEO 70 | 종합 70
개선 폭:   SEO +23 | AEO +22 | GEO +15 | 종합 +20
```

### 아이디어 6: HTML 구조 유지 수정

**개념**: HTML 구조를 유지하면서 텍스트와 메타데이터만 수정

**구현**:
1. 원본 HTML을 파싱
2. 텍스트 콘텐츠만 추출하여 수정
3. 메타 태그, 헤딩 태그 등 구조 요소 개선
4. 수정된 텍스트를 원본 HTML 구조에 다시 삽입

**주요 수정 항목**:
- `<title>` 태그 추가/수정
- `<meta name="description">` 추가/수정
- `<h1>`, `<h2>`, `<h3>` 태그 최적화
- `<img alt="">` 속성 추가
- 구조화된 데이터(JSON-LD) 추가

### 아이디어 7: 다중 버전 생성

**개념**: 하나의 원본에서 여러 개선 버전 생성

**구현**:
1. 원본 콘텐츠를 다양한 관점에서 수정
2. 버전 A: SEO 중심 수정
3. 버전 B: AEO 중심 수정
4. 버전 C: GEO 중심 수정
5. 버전 D: 통합 최적화 (모든 요소 균형)
6. 사용자가 원하는 버전 선택

### 아이디어 8: 수정 히스토리 관리

**개념**: 수정 이력을 관리하고 이전 버전으로 롤백 가능

**구현**:
1. 각 수정 버전을 데이터베이스에 저장
2. 수정 이력 목록 표시
3. 이전 버전과 비교
4. 원하는 버전으로 롤백
5. 최종 버전 다운로드

## 🎨 UI/UX 디자인 아이디어

### 레이아웃 옵션 1: 탭 기반 인터페이스

```
┌─────────────────────────────────────────────┐
│ [원본] [수정본] [비교] [설정]              │
├─────────────────────────────────────────────┤
│                                             │
│  원본 콘텐츠 미리보기                      │
│                                             │
└─────────────────────────────────────────────┘
```

### 레이아웃 옵션 2: Side-by-Side 비교

```
┌──────────────────┬──────────────────┐
│   원본 콘텐츠     │   수정된 콘텐츠  │
│                  │                  │
│  [변경 없음]     │  [변경됨]        │
│                  │                  │
└──────────────────┴──────────────────┘
```

### 레이아웃 옵션 3: 단일 뷰 + 변경 사항 하이라이트

```
┌─────────────────────────────────────────────┐
│ 수정된 콘텐츠 (변경 사항 하이라이트)       │
│                                             │
│ <del>원본 텍스트</del>                      │
│ <ins>수정된 텍스트</ins>                    │
│                                             │
└─────────────────────────────────────────────┘
```

## 🔧 기술 구현 세부사항

### 1. 수정 엔진 (`lib/content-revision/revision-engine.ts`)

```typescript
interface RevisionRequest {
  originalContent: string;
  analysisResult: AnalysisResult;
  selectedChecklistItems?: string[];
  revisionMode: 'quick' | 'standard' | 'comprehensive' | 'custom';
  targetSections?: string[];
}

interface RevisionResult {
  revisedContent: string;
  changes: RevisionChange[];
  predictedScores: {
    seo: number;
    aeo: number;
    geo: number;
    overall: number;
  };
  improvements: string[];
}

async function reviseContent(request: RevisionRequest): Promise<RevisionResult> {
  // 1. 프롬프트 생성
  const prompt = buildRevisionPrompt(request);
  
  // 2. Gemini API 호출
  const revisedContent = await callGeminiAPI(prompt);
  
  // 3. 변경 사항 분석
  const changes = analyzeChanges(request.originalContent, revisedContent);
  
  // 4. 예상 점수 계산
  const predictedScores = await predictScores(revisedContent);
  
  return {
    revisedContent,
    changes,
    predictedScores,
    improvements: extractImprovements(changes)
  };
}
```

### 2. 프롬프트 빌더 (`lib/content-revision/prompt-builder.ts`)

```typescript
function buildRevisionPrompt(request: RevisionRequest): string {
  const { originalContent, analysisResult, selectedChecklistItems, revisionMode } = request;
  
  let prompt = `당신은 SEO/AEO/GEO 전문 콘텐츠 편집자입니다.
다음 콘텐츠를 분석 결과를 바탕으로 수정해주세요.

[원본 콘텐츠]
${originalContent}

[현재 점수]
- SEO: ${analysisResult.seoScore}/100
- AEO: ${analysisResult.aeoScore}/100
- GEO: ${analysisResult.geoScore}/100
- 종합: ${analysisResult.overallScore}/100

[개선이 필요한 사항]
${formatChecklistItems(selectedChecklistItems || getAllChecklistItems(analysisResult))}

[수정 모드]
${getModeInstructions(revisionMode)}

[수정 지침]
1. 원본 콘텐츠의 톤, 스타일, 핵심 메시지를 유지하세요
2. HTML 구조와 태그 형식을 보존하세요
3. 위 개선 사항을 자연스럽게 통합하세요
4. 변경 사항은 명확하고 구체적으로 하세요

수정된 콘텐츠:`;
  
  return prompt;
}
```

### 3. 변경 사항 분석 (`lib/content-revision/diff-generator.ts`)

```typescript
interface RevisionChange {
  type: 'added' | 'modified' | 'deleted';
  original?: string;
  revised?: string;
  location: string; // 섹션 또는 위치
  reason: string; // 수정 이유
}

function analyzeChanges(original: string, revised: string): RevisionChange[] {
  // diff 알고리즘을 사용하여 변경 사항 분석
  // 예: diff-match-patch 라이브러리 사용
  const changes: RevisionChange[] = [];
  
  // 변경 사항 추출 및 분류
  // ...
  
  return changes;
}
```

## 📊 사용자 워크플로우

### 기본 워크플로우

1. **분석 완료 후** "콘텐츠 수정" 버튼 클릭
2. **수정 모드 선택** (빠른/표준/전면/커스텀)
3. **체크리스트 선택** (전체 또는 일부)
4. **수정 실행** 버튼 클릭
5. **수정 결과 확인** (원본 vs 수정본 비교)
6. **예상 점수 확인** 및 개선 사항 검토
7. **적용 또는 수정** 선택
8. **최종 결과 다운로드** (HTML 파일)

### 고급 워크플로우 (섹션별 수정)

1. **콘텐츠 섹션 목록** 표시
2. **수정할 섹션 선택**
3. **각 섹션별 개선 사항 확인**
4. **섹션별 수정 실행**
5. **수정된 섹션 미리보기**
6. **승인 또는 재수정**
7. **전체 결과 통합 및 최종 확인**

## 🎯 우선순위 구현 계획

### Phase 1: 기본 수정 기능 (2주)
- [ ] 수정 엔진 기본 구현
- [ ] 프롬프트 빌더 구현
- [ ] API 엔드포인트 생성
- [ ] 기본 수정 UI 컴포넌트
- [ ] 전체 콘텐츠 수정 기능

### Phase 2: 비교 및 미리보기 (1주)
- [ ] 전/후 비교 뷰
- [ ] 변경 사항 하이라이트
- [ ] 예상 점수 계산
- [ ] 수정 결과 다운로드

### Phase 3: 고급 기능 (2주)
- [ ] 섹션별 수정
- [ ] 체크리스트 선택 기능
- [ ] 수정 모드 옵션
- [ ] 수정 히스토리 관리

### Phase 4: 최적화 및 개선 (1주)
- [ ] 성능 최적화
- [ ] 에러 처리 강화
- [ ] 사용자 피드백 반영
- [ ] 문서화

## 💾 데이터 구조

### 수정 버전 저장

```typescript
interface RevisionVersion {
  id: string;
  analysisId: string;
  userId: string;
  originalContent: string;
  revisedContent: string;
  revisionMode: string;
  selectedChecklistItems: string[];
  predictedScores: {
    seo: number;
    aeo: number;
    geo: number;
    overall: number;
  };
  createdAt: Date;
}
```

### 데이터베이스 스키마

```sql
CREATE TABLE content_revisions (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  original_content TEXT NOT NULL,
  revised_content TEXT NOT NULL,
  revision_mode TEXT NOT NULL,
  selected_checklist_items TEXT, -- JSON array
  predicted_scores TEXT, -- JSON object
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 🔐 보안 및 제한사항

### 사용량 제한
- 무료 플랜: 월 10회 수정
- 프리미엄 플랜: 월 100회 수정
- 무제한 플랜: 무제한

### 콘텐츠 크기 제한
- 최대 콘텐츠 길이: 10,000자
- Gemini API 토큰 제한 고려

### 프라이버시
- 수정된 콘텐츠는 사용자만 접근 가능
- 자동 삭제 정책 (30일 후 자동 삭제)

## 📈 성공 지표

- 기능 사용률: 전체 사용자의 30% 이상
- 만족도: 사용자 만족도 4.0/5.0 이상
- 점수 개선: 평균 +15점 이상 개선
- 재사용률: 사용자의 50% 이상이 재사용

## 🚀 향후 확장 아이디어

1. **자동 재분석**: 수정된 콘텐츠를 자동으로 재분석
2. **A/B 테스트**: 여러 버전을 비교하여 최적 버전 선택
3. **템플릿 저장**: 수정 패턴을 템플릿으로 저장
4. **일괄 수정**: 여러 페이지를 한 번에 수정
5. **협업 기능**: 팀원과 수정 결과 공유 및 피드백

