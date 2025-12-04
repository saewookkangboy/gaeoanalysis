'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">통계 대시보드</h2>
        <Link
          href="/admin"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← 대시보드로
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          통계 기능은 곧 추가될 예정입니다.
        </p>
      </div>
    </div>
  );
}

