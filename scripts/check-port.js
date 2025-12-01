#!/usr/bin/env node

/**
 * 포트 사용 여부 확인 및 정리 스크립트
 * Next.js 개발 서버 시작 전에 실행하여 포트 충돌을 방지합니다
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORTS = [3000, 3001];
const LOCK_FILE = path.join(process.cwd(), '.next/dev/lock');

function killProcessOnPort(port) {
  try {
    const pid = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
    if (pid) {
      console.log(`🔪 포트 ${port}의 프로세스 종료 중 (PID: ${pid})...`);
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      return true;
    }
  } catch (error) {
    // 프로세스가 없으면 에러가 발생하지만 정상입니다
  }
  return false;
}

function removeLockFile() {
  if (fs.existsSync(LOCK_FILE)) {
    console.log('🗑️  Lock 파일 삭제 중...');
    fs.unlinkSync(LOCK_FILE);
    return true;
  }
  return false;
}

function cleanup() {
  console.log('🧹 개발 서버 정리 중...\n');
  
  let cleaned = false;
  
  // 포트 정리
  PORTS.forEach(port => {
    if (killProcessOnPort(port)) {
      cleaned = true;
    }
  });
  
  // Lock 파일 정리
  if (removeLockFile()) {
    cleaned = true;
  }
  
  if (!cleaned) {
    console.log('✅ 정리할 항목이 없습니다.\n');
  } else {
    console.log('✅ 정리 완료!\n');
  }
  
  return cleaned;
}

// 직접 실행된 경우
if (require.main === module) {
  cleanup();
}

module.exports = { cleanup, killProcessOnPort, removeLockFile };

