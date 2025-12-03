import db from './db';
import { dbHelpers } from './db';

/**
 * 통계 관련 헬퍼 함수들
 */

/**
 * 분석 항목별 통계 업데이트
 */
export function updateAnalysisItemStatistics(
  itemType: 'aeo' | 'geo' | 'seo' | 'chatgpt' | 'perplexity' | 'gemini' | 'claude',
  score: number
) {
  return dbHelpers.transaction(() => {
    const today = new Date().toISOString().split('T')[0];
    const scoreRange = getScoreRange(score);
    
    // 기존 통계 확인
    const existing = db.prepare(`
      SELECT id, count, avg_score, min_score, max_score
      FROM analysis_item_statistics
      WHERE date = ? AND item_type = ? AND score_range = ?
    `).get(today, itemType, scoreRange) as {
      id: number;
      count: number;
      avg_score: number;
      min_score: number;
      max_score: number;
    } | undefined;
    
    if (existing) {
      // 업데이트
      const newCount = existing.count + 1;
      const newAvg = (existing.avg_score * existing.count + score) / newCount;
      const newMin = Math.min(existing.min_score, score);
      const newMax = Math.max(existing.max_score, score);
      
      db.prepare(`
        UPDATE analysis_item_statistics
        SET 
          count = ?,
          avg_score = ?,
          min_score = ?,
          max_score = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newCount, newAvg, newMin, newMax, existing.id);
    } else {
      // 새로 생성
      db.prepare(`
        INSERT INTO analysis_item_statistics (
          date, item_type, score_range, count, avg_score, min_score, max_score
        )
        VALUES (?, ?, ?, 1, ?, ?, ?)
      `).run(today, itemType, scoreRange, score, score, score);
    }
  });
}

/**
 * 점수 범위 계산
 */
function getScoreRange(score: number): string {
  if (score <= 20) return '0-20';
  if (score <= 40) return '21-40';
  if (score <= 60) return '41-60';
  if (score <= 80) return '61-80';
  return '81-100';
}

/**
 * 사용자 활동 통계 업데이트
 */
export function updateUserActivityStatistics(
  userId: string,
  activityType: 'analysis' | 'chat' | 'export',
  score?: number
) {
  return dbHelpers.transaction(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // 사용자 정보 조회
    const user = db.prepare('SELECT id, provider FROM users WHERE id = ?').get(userId) as {
      id: string;
      provider: string;
    } | undefined;
    
    if (!user) return;
    
    // 기존 통계 확인
    const existing = db.prepare(`
      SELECT id, total_analyses, total_chat_messages, total_exports, avg_analysis_score
      FROM user_activity_statistics
      WHERE date = ? AND user_id = ?
    `).get(today, userId) as {
      id: number;
      total_analyses: number;
      total_chat_messages: number;
      total_exports: number;
      avg_analysis_score: number;
    } | undefined;
    
    if (existing) {
      // 업데이트
      let updates: any = {};
      
      if (activityType === 'analysis') {
        updates.total_analyses = existing.total_analyses + 1;
        if (score !== undefined) {
          const totalScore = existing.avg_analysis_score * existing.total_analyses + score;
          updates.avg_analysis_score = totalScore / updates.total_analyses;
        }
      } else if (activityType === 'chat') {
        updates.total_chat_messages = existing.total_chat_messages + 1;
      } else if (activityType === 'export') {
        updates.total_exports = existing.total_exports + 1;
      }
      
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updates), existing.id];
      
      db.prepare(`
        UPDATE user_activity_statistics
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(...values);
    } else {
      // 새로 생성
      const initialValues = {
        total_analyses: activityType === 'analysis' ? 1 : 0,
        total_chat_messages: activityType === 'chat' ? 1 : 0,
        total_exports: activityType === 'export' ? 1 : 0,
        avg_analysis_score: score !== undefined && activityType === 'analysis' ? score : 0.0,
      };
      
      db.prepare(`
        INSERT INTO user_activity_statistics (
          date, user_id, provider, total_analyses, total_chat_messages, 
          total_exports, avg_analysis_score
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        today,
        userId,
        user.provider || 'unknown',
        initialValues.total_analyses,
        initialValues.total_chat_messages,
        initialValues.total_exports,
        initialValues.avg_analysis_score
      );
    }
  });
}

/**
 * 분석 결과 상세 통계 업데이트
 */
export function updateAnalysisDetailStatistics(url: string, scores: {
  aeoScore: number;
  geoScore: number;
  seoScore: number;
  overallScore: number;
}) {
  return dbHelpers.transaction(() => {
    try {
      const domain = new URL(url).hostname;
      const today = new Date().toISOString().split('T')[0];
      
      // 기존 통계 확인
      const existing = db.prepare(`
        SELECT id, total_analyses, avg_aeo_score, avg_geo_score, 
               avg_seo_score, avg_overall_score
        FROM analysis_detail_statistics
        WHERE date = ? AND domain = ?
      `).get(today, domain) as {
        id: number;
        total_analyses: number;
        avg_aeo_score: number;
        avg_geo_score: number;
        avg_seo_score: number;
        avg_overall_score: number;
      } | undefined;
      
      if (existing) {
        // 업데이트
        const newCount = existing.total_analyses + 1;
        const newAvgAeo = (existing.avg_aeo_score * existing.total_analyses + scores.aeoScore) / newCount;
        const newAvgGeo = (existing.avg_geo_score * existing.total_analyses + scores.geoScore) / newCount;
        const newAvgSeo = (existing.avg_seo_score * existing.total_analyses + scores.seoScore) / newCount;
        const newAvgOverall = (existing.avg_overall_score * existing.total_analyses + scores.overallScore) / newCount;
        
        db.prepare(`
          UPDATE analysis_detail_statistics
          SET 
            total_analyses = ?,
            avg_aeo_score = ?,
            avg_geo_score = ?,
            avg_seo_score = ?,
            avg_overall_score = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newCount, newAvgAeo, newAvgGeo, newAvgSeo, newAvgOverall, existing.id);
      } else {
        // 새로 생성
        db.prepare(`
          INSERT INTO analysis_detail_statistics (
            date, domain, total_analyses, avg_aeo_score, avg_geo_score,
            avg_seo_score, avg_overall_score
          )
          VALUES (?, ?, 1, ?, ?, ?, ?)
        `).run(
          today,
          domain,
          scores.aeoScore,
          scores.geoScore,
          scores.seoScore,
          scores.overallScore
        );
      }
    } catch (error) {
      // URL 파싱 실패 시 무시
      console.warn('⚠️ [updateAnalysisDetailStatistics] URL 파싱 실패:', error);
    }
  });
}

/**
 * 일일 통계 집계
 */
export function aggregateDailyStatistics(date?: string) {
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  return dbHelpers.transaction(() => {
    // 전날 통계 집계
    const prevDate = new Date(targetDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    
    // 사이트 통계 업데이트
    const newUsers = db.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE DATE(created_at) = ?
    `).get(prevDateStr) as { count: number };
    
    const newAnalyses = db.prepare(`
      SELECT COUNT(*) as count
      FROM analyses
      WHERE DATE(created_at) = ?
    `).get(prevDateStr) as { count: number };
    
    const newChats = db.prepare(`
      SELECT COUNT(*) as count
      FROM chat_conversations
      WHERE DATE(created_at) = ?
    `).get(prevDateStr) as { count: number };
    
    // site_statistics 업데이트
    const existing = db.prepare(`
      SELECT id FROM site_statistics WHERE date = ?
    `).get(prevDateStr) as { id: number } | undefined;
    
    if (existing) {
      db.prepare(`
        UPDATE site_statistics
        SET 
          new_users = ?,
          new_analyses = ?,
          new_chat_conversations = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newUsers.count, newAnalyses.count, newChats.count, existing.id);
    } else {
      // 전체 통계 계산
      const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
      const totalAnalyses = db.prepare('SELECT COUNT(*) as count FROM analyses').get() as { count: number };
      const totalChats = db.prepare('SELECT COUNT(*) as count FROM chat_conversations').get() as { count: number };
      
      db.prepare(`
        INSERT INTO site_statistics (
          date, total_users, new_users, total_analyses, new_analyses,
          total_chat_conversations, new_chat_conversations
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        prevDateStr,
        totalUsers.count,
        newUsers.count,
        totalAnalyses.count,
        newAnalyses.count,
        totalChats.count,
        newChats.count
      );
    }
  });
}

/**
 * 통계 조회 함수들
 */
export function getAnalysisItemStatistics(
  itemType: 'aeo' | 'geo' | 'seo' | 'chatgpt' | 'perplexity' | 'gemini' | 'claude',
  startDate?: string,
  endDate?: string
) {
  const start = startDate || new Date().toISOString().split('T')[0];
  const end = endDate || start;
  
  return db.prepare(`
    SELECT date, score_range, count, avg_score, min_score, max_score
    FROM analysis_item_statistics
    WHERE item_type = ? AND date BETWEEN ? AND ?
    ORDER BY date DESC, score_range
  `).all(itemType, start, end) as Array<{
    date: string;
    score_range: string;
    count: number;
    avg_score: number;
    min_score: number;
    max_score: number;
  }>;
}

export function getUserActivityStatistics(
  userId: string,
  startDate?: string,
  endDate?: string
) {
  const start = startDate || new Date().toISOString().split('T')[0];
  const end = endDate || start;
  
  return db.prepare(`
    SELECT date, total_analyses, total_chat_messages, total_exports, avg_analysis_score
    FROM user_activity_statistics
    WHERE user_id = ? AND date BETWEEN ? AND ?
    ORDER BY date DESC
  `).all(userId, start, end) as Array<{
    date: string;
    total_analyses: number;
    total_chat_messages: number;
    total_exports: number;
    avg_analysis_score: number;
  }>;
}

export function getAnalysisDetailStatistics(
  domain?: string,
  startDate?: string,
  endDate?: string
) {
  const start = startDate || new Date().toISOString().split('T')[0];
  const end = endDate || start;
  
  if (domain) {
    return db.prepare(`
      SELECT date, domain, total_analyses, avg_aeo_score, avg_geo_score,
             avg_seo_score, avg_overall_score
      FROM analysis_detail_statistics
      WHERE domain = ? AND date BETWEEN ? AND ?
      ORDER BY date DESC
    `).all(domain, start, end) as Array<{
      date: string;
      domain: string;
      total_analyses: number;
      avg_aeo_score: number;
      avg_geo_score: number;
      avg_seo_score: number;
      avg_overall_score: number;
    }>;
  } else {
    return db.prepare(`
      SELECT date, domain, total_analyses, avg_aeo_score, avg_geo_score,
             avg_seo_score, avg_overall_score
      FROM analysis_detail_statistics
      WHERE date BETWEEN ? AND ?
      ORDER BY date DESC, total_analyses DESC
    `).all(start, end) as Array<{
      date: string;
      domain: string;
      total_analyses: number;
      avg_aeo_score: number;
      avg_geo_score: number;
      avg_seo_score: number;
      avg_overall_score: number;
    }>;
  }
}

