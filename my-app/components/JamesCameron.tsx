'use client';

import { useEffect, useMemo, useState } from 'react';

type Movie = {
  title: string;
  year?: number;
  poster?: string;
};

// Static fallback list; can be swapped to TMDB/OMDb later
const STATIC_MOVIES: Movie[] = [
  { title: 'The Terminator', year: 1984 },
  { title: 'Aliens', year: 1986 },
  { title: 'The Abyss', year: 1989 },
  { title: 'Terminator 2: Judgment Day', year: 1991 },
  { title: 'True Lies', year: 1994 },
  { title: 'Titanic', year: 1997 },
  { title: 'Avatar', year: 2009 },
  { title: 'Avatar: The Way of Water', year: 2022 },
];

export default function JamesCameron() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...movies].sort((a, b) => (b.year || 0) - (a.year || 0)),
    [movies]
  );

  const loadMovies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Placeholder for future web fetch; use static for now
      await new Promise((r) => setTimeout(r, 400));
      setMovies(STATIC_MOVIES);
    } catch (e) {
      setError('목록을 불러오는 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && movies.length === 0 && !isLoading) {
      loadMovies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Listen to chat trigger to auto-open
  useEffect(() => {
    const handler = () => {
      setIsOpen(true);
      // small delay to ensure open state applied before scrolling
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('open-james-cameron', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-james-cameron', handler);
      }
    };
  }, []);

  return (
    <div className="flex w-full items-center justify-center">
      <div className="text-center">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
        >
          {isOpen ? '목록 숨기기' : '제임스 카메론 작품 보기'}
        </button>

        {isOpen && (
          <div className="mt-6 w-[min(820px,90vw)] rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              감독: 제임스 카메론
            </h2>
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
            {isLoading ? (
              <div className="py-6 text-sm text-gray-600 dark:text-gray-300">불러오는 중…</div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {sorted.map((m, idx) => (
                  <li
                    key={`${m.title}-${idx}`}
                    className="flex items-center gap-4 py-3 animate-fade-in"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="h-10 w-10 shrink-0 rounded-md bg-gray-100 text-center text-xs leading-10 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {m.year || ''}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">제임스 카메론 작품</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


