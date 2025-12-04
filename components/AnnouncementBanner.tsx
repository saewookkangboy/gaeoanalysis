'use client';

import { useEffect, useState } from 'react';

interface Announcement {
  id: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const fetchAnnouncement = async () => {
    try {
      const response = await fetch('/api/announcements');
      const data = await response.json();
      
      if (data.announcement) {
        setAnnouncement(data.announcement);
      }
    } catch (error) {
      console.error('공지사항 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !announcement) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-r from-sky-500 to-indigo-500 dark:from-sky-600 dark:to-indigo-600 py-2.5">
      <div className="marquee-container">
        <div className="marquee-content">
          <span className="text-sm sm:text-base font-medium text-white whitespace-nowrap px-4">
            {announcement.message}
          </span>
        </div>
        {/* 무한 스크롤을 위한 복제 */}
        <div className="marquee-content" aria-hidden="true">
          <span className="text-sm sm:text-base font-medium text-white whitespace-nowrap px-4">
            {announcement.message}
          </span>
        </div>
      </div>
      <style jsx>{`
        .marquee-container {
          display: flex;
          width: 100%;
          overflow: hidden;
          position: relative;
        }
        
        .marquee-content {
          display: flex;
          animation: marquee 40s linear infinite;
          white-space: nowrap;
          flex-shrink: 0;
        }
        
        .marquee-content:first-child {
          animation-delay: 0s;
        }
        
        .marquee-content:last-child {
          animation-delay: 20s;
        }
        
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .marquee-content {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

