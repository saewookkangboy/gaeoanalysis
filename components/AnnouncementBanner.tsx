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
      <div className="announcement-container">
        <div className="announcement-text">
          <span className="text-sm sm:text-base font-medium text-white whitespace-nowrap px-4">
            {announcement.message}
          </span>
        </div>
      </div>
      <style jsx>{`
        .announcement-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }
        
        .announcement-text {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          animation: slideUp 3s ease-in-out infinite;
          will-change: transform, opacity;
        }
        
        @keyframes slideUp {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          15% {
            transform: translateY(0);
            opacity: 1;
          }
          85% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .announcement-text {
            animation: none;
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

