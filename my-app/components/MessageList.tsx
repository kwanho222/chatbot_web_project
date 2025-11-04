'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
              대화를 시작해 보세요
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              아래 입력창에 메시지를 입력하고 Enter를 눌러 전송하세요.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {messages.map((message) => (
            <MessageItem key={message.id || `${message.role}-${message.timestamp}`} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

