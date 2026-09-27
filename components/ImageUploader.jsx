'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from 'lucide-react';
import { useApi } from '@/lib/api-client';

// Uploads straight from the browser to Cloudinary using a signature from the backend,
// so large photos never pass through Render.
export default function ImageUploader({ images, onChange }) {
  const api = useApi();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState(null);

  async function uploadOne(file) {
    const sig = await api('/api/admin/uploads/sign', { method: 'POST' });
    const data = new FormData();
    data.append('file', file);
    data.append('api_key', sig.apiKey);
    data.append('timestamp', sig.timestamp);
    data.append('signature', sig.signature);
    if (sig.folder) data.append('folder', sig.folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: data });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || 'Cloudinary rejected the upload.');
    return { url: json.secure_url, alt: '' };
  }

  async function handleFiles(fileList) {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'));
    const tooBig = files.find((f) => f.size > 10 * 1024 * 1024);
    if (tooBig) {
      setError(`${tooBig.name} is over 10 MB. Resize it and try again.`);
      return;
    }
    setError(null);
    setUploading(files.length);
    const added = [];
    for (const file of files) {
      try {
        added.push(await uploadOne(file));
      } catch (err) {
        setError(`${file.name}: ${err.message}`);
      }
      setUploading((n) => n - 1);
    }
    onChange([...images, ...added]);
    if (inputRef.current) inputRef.current.value = '';
  }

  const move = (from, to) => {
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div>
      {images.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          {images.map((img, i) => (
            <li key={img.url} className="border border-stone-200 rounded-md overflow-hidden bg-white">
              <div className="relative aspect-[4/5] bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                {i === 0 && <span className="absolute top-2 left-2 bg-espresso text-gold text-xs px-2 py-0.5 rounded">Main photo</span>}
              </div>
              <div className="p-2 space-y-2">
                <label className="sr-only" htmlFor={`alt-${i}`}>Photo description</label>
                <input
                  id={`alt-${i}`}
                  className="field text-xs py-1"
                  placeholder="Describe the photo"
                  value={img.alt}
                  onChange={(e) => onChange(images.map((im, j) => (j === i ? { ...im, alt: e.target.value } : im)))}
                />
                <div className="flex justify-between">
                  <div className="flex">
                    <IconBtn label="Move earlier" disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowLeft className="w-4 h-4" /></IconBtn>
                    <IconBtn label="Move later" disabled={i === images.length - 1} onClick={() => move(i, i + 1)}><ArrowRight className="w-4 h-4" /></IconBtn>
                  </div>
                  <IconBtn label="Remove photo" onClick={() => onChange(images.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></IconBtn>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-stone-300 rounded-md p-6 text-sm text-stone-600 cursor-pointer hover:border-gold"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <ImagePlus className="w-6 h-6 text-stone-400" aria-hidden />
        {uploading > 0 ? `Uploading ${uploading} photo${uploading > 1 ? 's' : ''}…` : 'Drop photos here or click to choose'}
        <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => handleFiles(e.target.files)} disabled={uploading > 0} />
      </label>
      {error && <p className="text-sm text-rose-700 mt-2">{error}</p>}
    </div>
  );
}

function IconBtn({ label, children, ...props }) {
  return (
    <button type="button" aria-label={label} title={label} className="p-1.5 text-stone-500 hover:text-espresso disabled:opacity-30" {...props}>
      {children}
    </button>
  );
}
