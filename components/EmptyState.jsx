export default function EmptyState({ title, children }) {
  return (
    <div className="bg-white border border-dashed border-stone-300 rounded-lg p-10 text-center">
      <p className="text-espresso font-medium">{title}</p>
      {children && <div className="text-stone-500 text-sm mt-2">{children}</div>}
    </div>
  );
}
