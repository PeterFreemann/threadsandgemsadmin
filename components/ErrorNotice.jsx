import { AlertTriangle } from 'lucide-react';

export default function ErrorNotice({ message }) {
  return (
    <div role="alert" className="flex gap-3 items-start bg-rose-50 border border-rose-200 text-rose-900 rounded-lg p-4">
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
      <div>
        <p className="font-medium">This page couldn&apos;t load its data.</p>
        <p className="text-sm mt-1">{message}</p>
      </div>
    </div>
  );
}
