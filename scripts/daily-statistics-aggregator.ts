#!/usr/bin/env node

/**
 * 일일 통계 집계 스크립트
 * 
 * 사용법:
 *   npm run stats:aggregate
 *   또는
 *   npx tsx scripts/daily-statistics-aggregator.ts
 */

import { aggregateDailyStatistics } from '../lib/statistics-helpers';

async function main() {
  console.log('📊 일일 통계 집계 시작...');
  
  try {
    // 오늘 날짜로 집계 (또는 전날)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateStr = process.argv[2] || yesterday.toISOString().split('T')[0];
    
    console.log(`📅 집계 대상 날짜: ${dateStr}`);
    
    aggregateDailyStatistics(dateStr);
    
    console.log('✅ 일일 통계 집계 완료');
  } catch (error) {
    console.error('❌ 일일 통계 집계 오류:', error);
    process.exit(1);
  }
}

main();

