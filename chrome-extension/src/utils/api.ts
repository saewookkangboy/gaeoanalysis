const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://gaeoanalysis.vercel.app'
  : 'http://localhost:3000';

export async function analyzeUrl(url: string): Promise<any> {
  try {
    // 세션 쿠키 가져오기
    const cookies = await chrome.cookies.getAll({
      domain: '.gaeoanalysis.vercel.app',
      name: 'authjs.session-token'
    });
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // 쿠키가 있으면 포함
    if (cookies.length > 0 && cookies[0].value) {
      headers['Cookie'] = `${cookies[0].name}=${cookies[0].value}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '분석 중 오류가 발생했습니다.' }));
      throw new Error(errorData.error?.message || errorData.error || '분석 중 오류가 발생했습니다.');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API 호출 오류:', error);
    throw error;
  }
}

export async function checkAuthStatus(): Promise<boolean> {
  try {
    const cookies = await chrome.cookies.getAll({
      domain: '.gaeoanalysis.vercel.app',
      name: 'authjs.session-token'
    });
    
    return cookies.length > 0 && cookies[0].value !== '';
  } catch (error) {
    console.error('인증 상태 확인 오류:', error);
    return false;
  }
}

