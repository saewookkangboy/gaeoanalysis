import { ReactElement } from 'react';

// 간단한 마크다운 렌더링 (Extension용 경량 버전)
interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // 간단한 마크다운 파싱
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: ReactElement[] = [];
    let listItems: string[] = [];
    let inList = false;

    lines.forEach((line, index) => {
      // 리스트 항목
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        listItems.push(line.trim().substring(2));
      } else {
        if (inList && listItems.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside space-y-1 mb-2 ml-4">
              {listItems.map((item, idx) => (
                <li key={idx} className="text-xs">{item}</li>
              ))}
            </ul>
          );
          listItems = [];
          inList = false;
        }

        // 헤딩
        if (line.startsWith('### ')) {
          elements.push(
            <h3 key={index} className="font-bold text-sm mt-2 mb-1">
              {line.substring(4)}
            </h3>
          );
        } else if (line.startsWith('## ')) {
          elements.push(
            <h2 key={index} className="font-bold text-base mt-2 mb-1">
              {line.substring(3)}
            </h2>
          );
        } else if (line.startsWith('# ')) {
          elements.push(
            <h1 key={index} className="font-bold text-lg mt-2 mb-1">
              {line.substring(2)}
            </h1>
          );
        } else if (line.trim()) {
          // 일반 텍스트
          elements.push(
            <p key={index} className="text-xs mb-2 leading-relaxed">
              {line}
            </p>
          );
        } else {
          // 빈 줄
          elements.push(<br key={index} />);
        }
      }
    });

    // 마지막 리스트 처리
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key="list-final" className="list-disc list-inside space-y-1 mb-2 ml-4">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-xs">{item}</li>
          ))}
        </ul>
      );
    }

    return elements;
  };

  return (
    <div className="markdown-content">
      {parseMarkdown(content)}
    </div>
  );
}

