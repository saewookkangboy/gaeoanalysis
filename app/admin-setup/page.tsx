'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Admin 권한 설정 페이지
 * 웹에서 쉽게 admin 권한을 설정할 수 있는 간단한 인터페이스
 */
export default function AdminSetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('chunghyo@troe.kr');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSetAdmin = async () => {
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: '올바른 이메일 주소를 입력해주세요.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: `✅ ${email} 사용자의 admin 권한이 설정되었습니다! 이제 /admin 페이지로 접근할 수 있습니다.` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Admin 권한 설정에 실패했습니다.' 
        });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: `오류 발생: ${error.message || '알 수 없는 오류'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin 권한 설정</h1>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              이메일 주소
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@domain.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleSetAdmin}
            disabled={loading || !email}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '설정 중...' : 'Admin 권한 설정'}
          </button>

          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">
              Admin 권한이 설정되면:
            </p>
            <a
              href="/admin"
              className="block w-full text-center bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Admin 페이지로 이동 →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

