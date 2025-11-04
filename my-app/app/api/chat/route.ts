// app/api/chat/route.ts
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { ChatRequest } from '@/types/chat';

export const dynamic = 'force-dynamic'; // 빌드 시 프리렌더 방지
export const runtime = 'nodejs';        // (선택) 노드 런타임 명시

export async function POST(req: NextRequest) {
  try {
    const { messages }: ChatRequest = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ✅ 핸들러 내부에서 OpenAI 클라이언트 생성 (빌드 타임 실행 방지)
    const openai = new OpenAI({ apiKey });

    // 필요 시 모델은 환경에 맞게 교체 가능 ('gpt-4o-mini' 등)
    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages.map(({ role, content }) => ({ role, content })),
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            // v4 SDK 스트림 청크 호환 처리
            const content =
              // 일반적인 delta.content
              (chunk as any)?.choices?.[0]?.delta?.content ??
              // 혹시 message.content로 오는 경우 대비
              (chunk as any)?.choices?.[0]?.message?.content ??
              '';

            if (content) {
              const data = `data: ${JSON.stringify({ content })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred';
          const errorData = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
