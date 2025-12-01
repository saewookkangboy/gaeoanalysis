'use client';

import { useEffect } from 'react';

export default function ContentProtection() {
  useEffect(() => {
    // 마우스 오른쪽 클릭 방지
    const handleContextMenu = (e: MouseEvent) => {
      // CopyButton 영역은 예외 처리
      const target = e.target;
      
      // target이 Element가 아니면 closest를 사용할 수 없음
      if (!(target instanceof Element)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      const copyButton = target.closest('[data-allow-copy="true"]');
      
      if (!copyButton) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 텍스트 선택 방지
    const handleSelectStart = (e: Event) => {
      const target = e.target;
      
      // target이 Element가 아니면 closest를 사용할 수 없음
      if (!(target instanceof Element)) {
        e.preventDefault();
        return false;
      }

      const copyButton = target.closest('[data-allow-copy="true"]');
      
      // CopyButton 영역은 허용
      if (copyButton) {
        return;
      }

      // 입력 필드는 허용
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        (target as HTMLElement).isContentEditable ||
        target.getAttribute('role') === 'textbox'
      ) {
        return;
      }

      e.preventDefault();
      return false;
    };

    // 드래그 방지
    const handleDragStart = (e: DragEvent) => {
      const target = e.target;
      
      // target이 Element가 아니면 closest를 사용할 수 없음
      if (!(target instanceof Element)) {
        e.preventDefault();
        return false;
      }

      const copyButton = target.closest('[data-allow-copy="true"]');
      
      if (!copyButton) {
        e.preventDefault();
        return false;
      }
    };

    // 키보드 단축키 방지 (Ctrl+C, Ctrl+A, Ctrl+V, Ctrl+S, F12 등)
    const handleKeyDown = (e: KeyboardEvent) => {
      // CopyButton 내부에서는 허용
      const target = e.target;
      
      // target이 Element가 아니면 closest를 사용할 수 없음
      if (!(target instanceof Element)) {
        // Element가 아니면 기본 동작 방지
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
          (e.ctrlKey && e.key === 'U') ||
          ((e.ctrlKey || e.metaKey) &&
           (e.key === 'c' || e.key === 'C' || 
            e.key === 'v' || e.key === 'V' ||
            e.key === 'a' || e.key === 'A' ||
            e.key === 's' || e.key === 'S' ||
            e.key === 'p' || e.key === 'P'))
        ) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        return;
      }

      const copyButton = target.closest('[data-allow-copy="true"]');
      
      if (copyButton) {
        return; // CopyButton 내부는 허용
      }

      // 입력 필드에서는 허용
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        (target as HTMLElement).isContentEditable ||
        target.getAttribute('role') === 'textbox'
      ) {
        return; // 입력 필드는 허용
      }

      // 개발자 도구 단축키 방지
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 복사/붙여넣기/전체선택 단축키 방지
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'c' || e.key === 'C' || 
         e.key === 'v' || e.key === 'V' ||
         e.key === 'a' || e.key === 'A' ||
         e.key === 's' || e.key === 'S' ||
         e.key === 'p' || e.key === 'P')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 복사 이벤트 방지
    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target;
      
      // target이 Element가 아니면 closest를 사용할 수 없음
      if (!(target instanceof Element)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      const copyButton = target.closest('[data-allow-copy="true"]');
      
      // CopyButton 영역은 허용
      if (copyButton) {
        return;
      }

      // 입력 필드는 허용
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        (target as HTMLElement).isContentEditable ||
        target.getAttribute('role') === 'textbox'
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 붙여넣기 이벤트 방지
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target;
      
      // target이 Element가 아니면 closest를 사용할 수 없음
      if (!(target instanceof Element)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      const copyButton = target.closest('[data-allow-copy="true"]');
      
      // CopyButton 영역은 허용
      if (copyButton) {
        return;
      }

      // 입력 필드는 허용
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        (target as HTMLElement).isContentEditable ||
        target.getAttribute('role') === 'textbox'
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 이벤트 리스너 등록
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    // 정리 함수
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  return null;
}

