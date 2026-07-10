'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfcfc] text-black px-4">
          <h2 className="text-2xl font-bold mb-2">A critical error occurred!</h2>
          <p className="text-gray-500 mb-6">{error.message || "A fatal system error occurred."}</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
