export default function Card({ title, action, children, className = '' }) {
  return (
    <section className={`bg-white border border-stone-200 rounded-lg ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
          <h2 className="font-medium text-espresso">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
