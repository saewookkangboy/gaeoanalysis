/**
 * Admin 권한을 가진 사용자를 생성하거나 기존 사용자를 admin으로 설정하는 스크립트
 * 
 * 사용법:
 * npx tsx scripts/create-admin-user.ts <email> [userId]
 * 
 * 예시:
 * npx tsx scripts/create-admin-user.ts chunghyo@troe.kr
 * 
 * 참고: 사용자가 데이터베이스에 없으면 임시 사용자를 생성하고 admin 권한을 부여합니다.
 * 하지만 실제 로그인을 위해서는 Firebase 인증이 필요합니다.
 */

import { query } from '../lib/db-adapter';
import { getUserByEmail } from '../lib/db-helpers';
import { v4 as uuidv4 } from 'uuid';

async function createOrUpdateAdminUser(email: string, userId?: string) {
  try {
    // 이메일 정규화
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log(`\n🔍 사용자 검색 중: ${normalizedEmail}`);
    
    // 기존 사용자 확인
    let user = await getUserByEmail(normalizedEmail);
    
    if (user) {
      console.log(`✅ 기존 사용자 발견:`, {
        id: user.id,
        email: user.email,
        currentRole: user.role || 'user',
        provider: user.provider,
      });
      
      // 이미 admin인지 확인
      if (user.role === 'admin') {
        console.log(`\nℹ️  사용자는 이미 관리자 권한을 가지고 있습니다.`);
        return;
      }
      
      // role을 admin으로 업데이트
      console.log(`\n🔄 사용자 role을 'admin'으로 업데이트 중...`);
      
      const updateQuery = 'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
      await query(updateQuery, ['admin', user.id]);
      
      console.log(`✅ 사용자 role이 'admin'으로 업데이트되었습니다.`);
      
      // 업데이트 확인
      const updatedUser = await getUserByEmail(normalizedEmail);
      if (updatedUser && updatedUser.role === 'admin') {
        console.log(`\n✅ 확인 완료:`, {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
        });
        console.log(`\n이제 /admin 경로로 접근할 수 있습니다.`);
      }
    } else {
      // 사용자가 없으면 임시 사용자 생성 (실제 로그인은 Firebase 필요)
      console.log(`\n⚠️  사용자를 찾을 수 없습니다.`);
      console.log(`임시 사용자를 생성하겠습니다. (실제 로그인을 위해서는 Firebase 인증이 필요합니다.)`);
      
      const tempUserId = userId || uuidv4();
      
      console.log(`\n🔄 임시 사용자 생성 중...`);
      
      // SQLite와 PostgreSQL 모두 지원하는 방식으로 사용자 생성
      const { isPostgreSQL, isSQLite } = await import('../lib/db-adapter');
      
      if (isPostgreSQL()) {
        // PostgreSQL: 먼저 확인 후 INSERT 또는 UPDATE
        const checkQuery = 'SELECT id FROM users WHERE email = $1 LIMIT 1';
        const existing = await query(checkQuery, [normalizedEmail]);
        
        if (existing.rows.length > 0) {
          const updateQuery = 'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2';
          await query(updateQuery, ['admin', normalizedEmail]);
        } else {
          const insertQuery = 'INSERT INTO users (id, email, role, created_at, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)';
          await query(insertQuery, [tempUserId, normalizedEmail, 'admin']);
        }
      } else {
        // SQLite: 먼저 확인 후 INSERT 또는 UPDATE
        const checkQuery = 'SELECT id FROM users WHERE email = ? LIMIT 1';
        const existing = await query(checkQuery, [normalizedEmail]);
        
        if (existing.rows.length > 0) {
          const updateQuery = 'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?';
          await query(updateQuery, ['admin', normalizedEmail]);
        } else {
          const insertQuery = 'INSERT INTO users (id, email, role, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)';
          await query(insertQuery, [tempUserId, normalizedEmail, 'admin']);
        }
      }
      
      console.log(`✅ 임시 사용자 생성 완료:`, {
        id: tempUserId,
        email: normalizedEmail,
        role: 'admin',
      });
      
      console.log(`\n⚠️  주의사항:`);
      console.log(`1. 이 사용자는 데이터베이스에만 존재하며, Firebase 인증이 필요합니다.`);
      console.log(`2. 실제 로그인을 위해서는 Firebase Console에서 사용자를 생성하거나,`);
      console.log(`   웹 애플리케이션에서 로그인을 통해 사용자를 생성해야 합니다.`);
      console.log(`3. Firebase 사용자 ID와 데이터베이스 사용자 ID가 일치해야 정상적으로 작동합니다.`);
    }
    
  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error);
    process.exit(1);
  }
}

async function main() {
  const email = process.argv[2];
  const userId = process.argv[3];
  
  if (!email) {
    console.error('❌ 사용법: npx tsx scripts/create-admin-user.ts <email> [userId]');
    console.error('예시: npx tsx scripts/create-admin-user.ts chunghyo@troe.kr');
    console.error('\n옵션:');
    console.error('  email   - 설정할 이메일 주소 (필수)');
    console.error('  userId  - Firebase 사용자 ID (선택, 없으면 UUID 생성)');
    process.exit(1);
  }
  
  // 이메일 정리
  const cleanedEmail = email.replace(/^[\\'"\s]+|[\\'"\s]+$/g, '').trim();
  
  if (!cleanedEmail || !cleanedEmail.includes('@')) {
    console.error('❌ 올바른 이메일 주소를 입력해주세요.');
    process.exit(1);
  }
  
  await createOrUpdateAdminUser(cleanedEmail, userId);
}

main().catch((error) => {
  console.error('❌ 스크립트 실행 오류:', error);
  process.exit(1);
});

