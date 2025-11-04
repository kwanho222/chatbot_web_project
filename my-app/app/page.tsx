import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-white">
      {/* Chat panel (top-right), less than 1/4 of viewport */}
      <div className="fixed right-4 top-4 z-50 w-[360px] max-w-[90vw] h-[70vh] rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <ChatInterface fullScreen={false} />
      </div>

      {/* Placeholder main area for movie site (kept white background) */}
      <div className="pointer-events-none absolute inset-0" />
    </div>
  );
}
