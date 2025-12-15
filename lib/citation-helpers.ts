import { CitationSource } from './citation-extractor';
import { v4 as uuidv4 } from 'uuid';
import db from './db';
import { isPostgreSQL, query, transaction } from './db-adapter';

/**
 * 인용 소스를 데이터베이스에 저장
 */
export async function saveCitations(
  analysisId: string,
  sources: CitationSource[]
): Promise<void> {
  if (sources.length === 0) {
    return;
  }

  if (isPostgreSQL()) {
    try {
      await transaction(async (client) => {
        // 기존 인용 소스 삭제 (중복 방지)
        await client.query('DELETE FROM citations WHERE analysis_id = $1', [analysisId]);

        // 새 인용 소스 삽입
        for (const source of sources) {
          const citationId = uuidv4();
          await client.query(
            `INSERT INTO citations (
              id, analysis_id, url, domain, anchor_text, position, 
              is_target_url, link_type, context
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              citationId,
              analysisId,
              source.url,
              source.domain,
              source.anchorText,
              source.position,
              source.isTargetUrl ? 1 : 0,
              source.linkType,
              source.context || null,
            ]
          );
        }
      });
      console.log(`✅ [saveCitations] ${sources.length}개의 인용 소스 저장 완료 (analysisId: ${analysisId})`);
    } catch (error: any) {
      console.error('❌ [saveCitations] PostgreSQL 저장 실패:', {
        analysisId,
        error: error.message,
        code: error.code,
      });
      throw error;
    }
  } else {
    try {
      // SQLite 트랜잭션
      db.transaction(() => {
        // 기존 인용 소스 삭제
        const deleteStmt = db.prepare('DELETE FROM citations WHERE analysis_id = ?');
        deleteStmt.run(analysisId);

        // 새 인용 소스 삽입
        const insertStmt = db.prepare(`
          INSERT INTO citations (
            id, analysis_id, url, domain, anchor_text, position, 
            is_target_url, link_type, context
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const source of sources) {
          const citationId = uuidv4();
          insertStmt.run(
            citationId,
            analysisId,
            source.url,
            source.domain,
            source.anchorText,
            source.position,
            source.isTargetUrl ? 1 : 0,
            source.linkType,
            source.context || null
          );
        }
      })();
      console.log(`✅ [saveCitations] ${sources.length}개의 인용 소스 저장 완료 (analysisId: ${analysisId})`);
    } catch (error: any) {
      console.error('❌ [saveCitations] SQLite 저장 실패:', {
        analysisId,
        error: error.message,
        code: error.code,
      });
      throw error;
    }
  }
}

/**
 * 분석 ID로 인용 소스 조회
 */
export async function getCitationsByAnalysisId(analysisId: string): Promise<CitationSource[]> {
  try {
    let results;
    
    if (isPostgreSQL()) {
      const queryResult = await query(
        `SELECT id, url, domain, anchor_text, position, 
         is_target_url, link_type, context
         FROM citations 
         WHERE analysis_id = $1 
         ORDER BY position ASC`,
        [analysisId]
      );
      results = queryResult.rows;
    } else {
      const stmt = db.prepare(`
        SELECT id, url, domain, anchor_text, position, 
               is_target_url, link_type, context
        FROM citations 
        WHERE analysis_id = ? 
        ORDER BY position ASC
      `);
      results = stmt.all(analysisId) as any[];
    }

    return results.map((row: any) => ({
      url: row.url,
      domain: row.domain,
      anchorText: row.anchor_text || '',
      position: row.position || 0,
      isTargetUrl: row.is_target_url === 1 || row.is_target_url === true,
      linkType: row.link_type as CitationSource['linkType'],
      context: row.context || undefined,
    }));
  } catch (error: any) {
    console.error('❌ [getCitationsByAnalysisId] 조회 실패:', {
      analysisId,
      error: error.message,
    });
    return [];
  }
}

