'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Announcement {
  id: string;
  message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AnnouncementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      // 관리자 권한 확인은 서버에서 처리
      fetchAnnouncements();
    }
  }, [status, router]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/announcements');
      
      if (response.status === 403) {
        setError('관리자 권한이 필요합니다');
        return;
      }

      if (!response.ok) {
        throw new Error('공지사항 조회 실패');
      }

      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (error: any) {
      console.error('공지사항 조회 오류:', error);
      setError(error.message || '공지사항 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!message.trim()) {
      setError('공지사항 내용을 입력해주세요');
      return;
    }

    try {
      setError(null);
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim(), is_active: isActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '공지사항 생성 실패');
      }

      setSuccess('공지사항이 생성되었습니다');
      setMessage('');
      setIsActive(true);
      fetchAnnouncements();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || '공지사항 생성 실패');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!message.trim()) {
      setError('공지사항 내용을 입력해주세요');
      return;
    }

    try {
      setError(null);
      const response = await fetch('/api/announcements', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, message: message.trim(), is_active: isActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '공지사항 수정 실패');
      }

      setSuccess('공지사항이 수정되었습니다');
      setEditingId(null);
      setMessage('');
      setIsActive(true);
      fetchAnnouncements();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || '공지사항 수정 실패');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/announcements?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '공지사항 삭제 실패');
      }

      setSuccess('공지사항이 삭제되었습니다');
      fetchAnnouncements();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || '공지사항 삭제 실패');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setMessage(announcement.message);
    setIsActive(announcement.is_active);
  };

  const handleCancel = () => {
    setEditingId(null);
    setMessage('');
    setIsActive(true);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-600">공지사항을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">공지사항 관리</h2>
          <p className="mt-1 text-sm text-gray-600">
            서비스 전체에 표시될 공지사항을 관리합니다.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← 대시보드로
        </Link>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* 성공 메시지 */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-green-800">{success}</p>
            <Link
              href="/admin"
              className="ml-4 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              대시보드로 이동
            </Link>
          </div>
        </div>
      )}

      {/* 공지사항 생성/수정 폼 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {editingId ? '공지사항 수정' : '새 공지사항 생성'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              공지사항 내용
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="공지사항 내용을 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              활성화 (활성화된 공지사항만 표시됩니다)
            </label>
          </div>
          <div className="flex gap-2">
            {editingId ? (
              <>
                <button
                  onClick={() => handleUpdate(editingId)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  생성
                </button>
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors inline-flex items-center"
                >
                  대시보드로
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 공지사항 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            공지사항 목록
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {announcements.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              등록된 공지사항이 없습니다.
            </div>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.is_active && (
                        <span className="px-2 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                          활성
                        </span>
                      )}
                      {!announcement.is_active && (
                        <span className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 rounded">
                          비활성
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 dark:text-gray-100 mb-2">
                      {announcement.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      생성: {new Date(announcement.created_at).toLocaleString('ko-KR')}
                      {announcement.updated_at !== announcement.created_at && (
                        <> | 수정: {new Date(announcement.updated_at).toLocaleString('ko-KR')}</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="px-3 py-1.5 text-sm bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

