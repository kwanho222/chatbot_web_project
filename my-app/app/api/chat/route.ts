// ...existing code...
import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Google API 키가 설정되어 있지 않습니다. .env.local의 GOOGLE_GEMINI_API_KEY 값을 확인하세요.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => null);
    const { messages } = body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'messages 배열이 필요합니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const last = messages[messages.length - 1];
    if (!last || last.role !== 'user' || !last.content) {
      return new Response(
        JSON.stringify({ error: '마지막 메시지는 role: "user" 와 content를 포함해야 합니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // 1) 기본 호출
    let result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: last.content,
    });

    // 서버 로그에 전체 응답 찍기 (디버그용 — 배포시 제거)
    console.log('GenAI raw result:', JSON.stringify(result, null, 2));

    // 응답에서 텍스트 안전하게 추출하는 헬퍼
    // ...existing code...
    // 서버 로그에 전체 응답 찍기 (디버그용 — 배포시 제거)
    console.log('GenAI raw result:', JSON.stringify(result, null, 2));

    // 응답에서 텍스트 안전하게 추출하는 헬퍼
// ...existing code...
    // 서버 로그 (디버그용)
    console.log('GenAI raw result:', JSON.stringify(result, null, 2));

    // 응답에서 텍스트 안전하게 추출하는 간단하고 명확한 헬퍼
    const extractText = (res: any): string => {
      if (!res) return '';

      // 1) candidates -> content.parts 경로(현재 당신의 raw 결과에 일치)
      const cand = res.candidates && Array.isArray(res.candidates) ? res.candidates[0] : null;
      if (cand) {
        const content = cand.content;
        if (!content) return '';

        // content가 객체이고 parts 배열이 있는 경우
        if (content.parts && Array.isArray(content.parts)) {
          return content.parts.map((p: any) => p?.text || '').join('');
        }

        // content가 문자열인 경우
        if (typeof content === 'string') return content;

        // content가 배열(각 항목이 parts 또는 text 가질 수 있음)
        if (Array.isArray(content)) {
          return content
            .map((c: any) => {
              if (typeof c === 'string') return c;
              if (c.text) return c.text;
              if (c.parts && Array.isArray(c.parts)) return c.parts.map((p: any) => p?.text || '').join('');
              return '';
            })
            .join('');
        }
      }

      // 2) 간단한/다른 형식들에 대한 폴백
      if (typeof res === 'string') return res;
      if (res.text) return res.text;
      if (res.output && Array.isArray(res.output)) {
        return res.output
          .map((o: any) => {
            if (typeof o === 'string') return o;
            if (o.content && Array.isArray(o.content)) return o.content.map((c: any) => c?.text || '').join('');
            return '';
          })
          .join('\n');
      }
      if (res.choices && res.choices[0] && res.choices[0].text) return res.choices[0].text;

      return '';
    };
// ...existing code...

    let text = extractText(result);

    // 2) 만약 빈 문자열이면 다른 요청 형식으로 재시도 (contents 배열 형태)
    // ...existing code...
    if (!text) {
      console.log('응답 텍스트가 비어있어 재시도함: contents 문자열 형식으로 요청');
      const retry = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        // 변경: 객체 대신 문자열 또는 문자열 배열 사용
        contents: last.content, // 또는 contents: [last.content]
      });
      console.log('GenAI retry raw result:', JSON.stringify(retry, null, 2));
      text = extractText(retry);
    }
// ...existing code...

    // 3) 그래도 비어있으면 디버그 메시지 반환
    if (!text) {
      return new Response(
        JSON.stringify({ error: '모델이 빈 응답을 반환했습니다. 서버 로그의 raw result를 확인하세요.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ content: text }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '서버 오류';
    console.error('API route error:', err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
// ...existing code...