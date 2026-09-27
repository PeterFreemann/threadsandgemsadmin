import Link from 'next/link';

export default function Pagination({ page = 1, pages = 1, total, basePath, searchParams = {} }) {
  if (pages <= 1) return total ? <p className="text-sm text-stone-500 mt-4">{total} in total</p> : null;

  const hrefFor = (p) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (v && k !== 'page') params.set(k, v);
    params.set('page', String(p));
    return `${basePath}?${params.toString()}`;
  };

  const btn = 'px-3 py-1.5 rounded-md border border-stone-300 text-sm bg-white hover:border-espresso';
  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <p className="text-stone-500">
        Page {page} of {pages}
        {total ? `, ${total} in total` : ''}
      </p>
      <div className="flex gap-2">
        {page > 1 ? <Link className={btn} href={hrefFor(page - 1)}>Previous</Link> : null}
        {page < pages ? <Link className={btn} href={hrefFor(page + 1)}>Next</Link> : null}
      </div>
    </div>
  );
}
