-- pgAdmin에서 실행할 올바른 SQL 문

-- 1단계: 사용자 확인
SELECT id, email, role, provider, created_at 
FROM users 
WHERE LOWER(email) = 'chunghyo@troe.kr' AND provider = 'google';

-- 2단계: Admin 권한 부여
UPDATE users 
SET role = 'admin', updated_at = CURRENT_TIMESTAMP 
WHERE LOWER(email) = 'chunghyo@troe.kr' AND provider = 'google';

-- 3단계: 확인
SELECT id, email, role, provider, updated_at 
FROM users 
WHERE LOWER(email) = 'chunghyo@troe.kr' AND provider = 'google';

