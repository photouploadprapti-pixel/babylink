'use client'

/**
 * Route-level error UI for unexpected server/render failures.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-3xl text-teal-950">Something went wrong</h1>
      <p className="mt-3 text-sm text-teal-900/70">
        {error.message || 'An unexpected error occurred while loading this page.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-teal-800 px-5 py-2.5 text-sm text-[#f7f3eb]"
      >
        Try again
      </button>
    </div>
  )
}
