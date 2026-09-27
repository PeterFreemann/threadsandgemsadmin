export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 bg-stone-200 rounded mb-8 animate-pulse" />
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-white border border-stone-200 rounded-lg animate-pulse" />
        ))}
      </div>
      <p className="text-sm text-stone-500 mt-6">
        Loading. If the backend has been asleep on Render, the first load can take up to a minute.
      </p>
    </div>
  );
}
