// Content Script for applying modifications
interface ModificationMessage {
  type: 'APPLY_MODIFICATION';
  modification: {
    id: string;
    type: string;
    title: string;
    before: string;
    after: string;
    selector?: string;
  };
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((message: ModificationMessage, _sender, sendResponse) => {
  if (message.type === 'APPLY_MODIFICATION') {
    try {
      applyModification(message.modification);
      sendResponse({ success: true });
    } catch (error) {
      console.error('수정안 적용 오류:', error);
      sendResponse({ success: false, error: String(error) });
    }
    return true;
  }
});

// 수정안 적용 함수
function applyModification(modification: {
  type: string;
  after: string;
  selector?: string;
}) {
  switch (modification.type) {
    case 'meta-description':
      applyMetaDescription(modification.after);
      break;
    case 'meta-title':
      applyMetaTitle(modification.after);
      break;
    case 'h1-tag':
      applyH1Tag(modification.after, modification.selector);
      break;
    case 'h2-tag':
      applyH2Tag(modification.after, modification.selector);
      break;
    case 'image-alt':
      applyImageAlt(modification.after, modification.selector);
      break;
    default:
      console.warn('지원하지 않는 수정 유형:', modification.type);
  }
}

// 메타 설명 적용
function applyMetaDescription(text: string) {
  let metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', text);
  } else {
    // 메타 태그가 없으면 생성
    const meta = document.createElement('meta');
    meta.name = 'description';
    meta.content = text;
    document.head.appendChild(meta);
  }
}

// 메타 제목 적용
function applyMetaTitle(text: string) {
  document.title = text;
  
  // Open Graph title도 업데이트
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', text);
  } else {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'og:title');
    meta.content = text;
    document.head.appendChild(meta);
  }
}

// H1 태그 적용
function applyH1Tag(text: string, selector?: string) {
  if (selector) {
    const element = document.querySelector(selector);
    if (element && element.tagName === 'H1') {
      element.textContent = text;
      return;
    }
  }
  
  // 선택자가 없으면 첫 번째 H1 태그 찾기
  const h1 = document.querySelector('h1');
  if (h1) {
    h1.textContent = text;
  }
}

// H2 태그 적용
function applyH2Tag(text: string, selector?: string) {
  if (selector) {
    const element = document.querySelector(selector);
    if (element && element.tagName === 'H2') {
      element.textContent = text;
      return;
    }
  }
  
  // 선택자가 없으면 첫 번째 H2 태그 찾기
  const h2 = document.querySelector('h2');
  if (h2) {
    h2.textContent = text;
  }
}

// 이미지 Alt 텍스트 적용
function applyImageAlt(text: string, selector?: string) {
  if (selector) {
    const img = document.querySelector(selector) as HTMLImageElement;
    if (img) {
      img.alt = text;
      return;
    }
  }
  
  // 선택자가 없으면 첫 번째 이미지 찾기
  const img = document.querySelector('img') as HTMLImageElement;
  if (img) {
    img.alt = text;
  }
}

console.log('GAEO Analysis Content Script loaded');

