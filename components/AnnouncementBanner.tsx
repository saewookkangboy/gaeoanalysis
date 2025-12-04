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
      <div className="marquee-wrapper">
        <div className="marquee-track">
          <div className="marquee-item">
            <span className="text-sm sm:text-base font-medium text-white whitespace-nowrap px-4">
              {announcement.message}
            </span>
          </div>
          <div className="marquee-item" aria-hidden="true">
            <span className="text-sm sm:text-base font-medium text-white whitespace-nowrap px-4">
              {announcement.message}
            </span>
          </div>
        </div>
      </div>
      <style jsx>{`
        .marquee-wrapper {
          width: 100%;
          overflow: hidden;
          position: relative;
        }
        
        .marquee-track {
          display: flex;
          width: fit-content;
          animation: marquee 20s linear infinite;
          will-change: transform;
        }
        
        .marquee-item {
          display: inline-flex;
          flex-shrink: 0;
          padding-right: 8rem;
        }
        
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

