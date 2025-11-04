'use client';

import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types/chat';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const STORAGE_KEY = 'chat-history';

type ChatInterfaceProps = {
  fullScreen?: boolean;
};

export default function ChatInterface({ fullScreen = true }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    } catch (err) {
      console.error('Failed to load messages from localStorage:', err);
    }
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.error('Failed to save messages to localStorage:', err);
    }
  }, [messages]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setError(null);
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear localStorage:', err);
    }
  }, [abortController]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content,
      id: `user-${Date.now()}`,
      timestamp: Date.now(),
    };

    // Heuristic: open James Cameron panel when user asks for it
    try {
      const q = content.toLowerCase();
      const hasName = q.includes('제임스 카메론') || q.includes('제임스카메론') || q.includes('james cameron');
      const intent = q.includes('영화') || q.includes('작품') || q.includes('리스트') || q.includes('보여줘') || q.includes('추천');
      if (typeof window !== 'undefined' && hasName && intent) {
        window.dispatchEvent(new CustomEvent('open-james-cameron'));
      }
    } catch {}

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({
            role,
            content,
          })),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON, try to get text
          try {
            const text = await response.text();
            errorMessage = text || errorMessage;
          } catch (textError) {
            // Provide user-friendly messages for common status codes
            if (response.status === 429) {
              errorMessage = '할당량 초과: API 사용 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
            } else if (response.status === 401) {
              errorMessage = '인증 실패: API 키를 확인해주세요.';
            } else if (response.status === 500) {
              errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            }
          }
        }
        throw new Error(errorMessage);
      }

      // Fallback: if server returned JSON (non-stream), append once
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.content || data.answer || data.text || '',
          id: `assistant-${Date.now()}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        return; // Done for JSON response
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        id: `assistant-${Date.now()}`,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.content) {
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content += parsed.content;
                  }
                  return newMessages;
                });
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, which is fine
        return;
      }
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setMessages((prev) => prev.slice(0, -1)); // Remove the user message if there's an error
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  }, [messages, isLoading]);

  const handleStop = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  }, [abortController]);

  return (
    <div className={`flex ${fullScreen ? 'h-screen' : 'h-full'} flex-col bg-white dark:bg-gray-900`}>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 sm:text-xl">
          대화창
        </h1>
        <div className="flex gap-2">
          {isLoading && (
            <button
              onClick={handleStop}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              중지
            </button>
          )}
          <button
            onClick={handleNewChat}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            새 채팅
          </button>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <div className="mx-auto flex max-w-4xl items-start justify-between gap-4">
            <div className="flex-1">
              <div className="font-medium">{error}</div>
              {error.includes('할당량') && (
                <div className="mt-2 text-xs text-red-700 dark:text-red-500">
                  💡 해결 방법: <a 
                    href="https://makersuite.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    Google AI Studio
                  </a>에서 API 키를 확인하거나 <a 
                    href="https://ai.google.dev/pricing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    가격 정책
                  </a>을 확인하세요.
                </div>
              )}
            </div>
            <button
              onClick={() => setError(null)}
              className="shrink-0 text-red-600 transition-colors hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              aria-label="Close error message"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
}

