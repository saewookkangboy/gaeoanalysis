/**
 * 사용자 role을 admin으로 설정하는 스크립트
 * 
 * 사용법:
 * npx tsx scripts/set-admin-role.ts <email>
 * 
 * 예시:
 * npx tsx scripts/set-admin-role.ts chunghyo@troe.kr
 */

import { query } from '../lib/db-adapter';
import { getUserByEmail } from '../lib/db-helpers';

async function setAdminRole(email: string) {
  try {
    // 이메일 정규화
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log(`\n🔍 사용자 검색 중: ${normalizedEmail}`);
    
    // 사용자 확인
    const user = await getUserByEmail(normalizedEmail);
    
    if (!user) {
      console.error(`❌ 사용자를 찾을 수 없습니다: ${normalizedEmail}`);
      console.error('이메일 주소를 확인하고 다시 시도하세요.\n');
      
      // 데이터베이스에 있는 사용자 목록 표시
      try {
        console.log('📋 데이터베이스에 등록된 사용자 목록:');
        const usersResult = await query(
          'SELECT id, email, role, provider, created_at FROM users ORDER BY created_at DESC LIMIT 20'
        );
        
        if (usersResult.rows.length === 0) {
          console.log('  (등록된 사용자가 없습니다)');
        } else {
          usersResult.rows.forEach((row: any, index: number) => {
            console.log(`  ${index + 1}. ${row.email} (role: ${row.role || 'user'}, provider: ${row.provider || 'N/A'})`);
          });
        }
        
        // 유사한 이메일 찾기
        const emailPrefix = normalizedEmail.split('@')[0];
        if (emailPrefix) {
          const similarResult = await query(
            'SELECT email, role FROM users WHERE LOWER(email) LIKE $1 LIMIT 5',
            [`%${emailPrefix}%`]
          );
          
          if (similarResult.rows.length > 0) {
            console.log(`\n💡 유사한 이메일 (${emailPrefix} 포함):`);
            similarResult.rows.forEach((row: any) => {
              console.log(`  - ${row.email} (role: ${row.role || 'user'})`);
            });
          }
        }
      } catch (listError: any) {
        console.error('⚠️  사용자 목록 조회 중 오류:', listError.message);
      }
      
      process.exit(1);
    }
    
    console.log(`✅ 사용자 찾음:`, {
      id: user.id,
      email: user.email,
      currentRole: user.role || 'user',
      provider: user.provider,
    });
    
    // 이미 admin인지 확인
    if (user.role === 'admin') {
      console.log(`\nℹ️  사용자는 이미 관리자 권한을 가지고 있습니다.`);
      process.exit(0);
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
    } else {
      console.error(`\n⚠️  업데이트는 완료되었지만 확인 중 문제가 발생했습니다.`);
      console.error(`데이터베이스를 직접 확인해주세요.`);
    }
    
  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error);
    process.exit(1);
  }
}

async function main() {
  let email = process.argv[2];
  
  if (!email) {
    console.error('❌ 사용법: npx tsx scripts/set-admin-role.ts <email>');
    console.error('예시: npx tsx scripts/set-admin-role.ts chunghyo@troe.kr');
    process.exit(1);
  }
  
  // 이메일 정리 (백슬래시, 따옴표 등 제거)
  email = email.replace(/^[\\'"\s]+|[\\'"\s]+$/g, '').trim();
  
  if (!email || !email.includes('@')) {
    console.error('❌ 올바른 이메일 주소를 입력해주세요.');
    console.error('입력된 값:', process.argv[2]);
    console.error('정리된 값:', email);
    process.exit(1);
  }
  
  await setAdminRole(email);
}

main().catch((error) => {
  console.error('❌ 스크립트 실행 오류:', error);
  process.exit(1);
});

