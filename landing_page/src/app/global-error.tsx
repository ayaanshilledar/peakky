"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#08080a] text-white flex min-h-screen items-center justify-center">
        <div className="text-center p-6">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-white text-black rounded text-sm font-medium hover:bg-zinc-200"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
