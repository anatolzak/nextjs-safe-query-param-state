'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';

const fallback = <T,>(value: T): z.Schema<T> => {
  return z.any().transform(() => value);
};

const searchParamsSchema = z.object({
  count: z.coerce.number().min(0).or(fallback(0)),
});

export default function Home() {
  const router = useRouter();
  const [{ count }, createSafeURL] = useSafeSearchParams(searchParamsSchema);

  const incrementCount = () => {
    const url = createSafeURL({ count: count + 1 });
    router.replace(url);
  };

  return (
    <div className='flex flex-col gap-y-3 m-4 items-start'>
      <div>Count: {count}</div>
      <button
        onClick={incrementCount}
        className='bg-white rounded-full px-3 py-2 text-slate-900'
      >
        increment count button
      </button>
      <Link
        href={createSafeURL({ count: count + 1 })}
        className='underline'
      >
        increment count link
      </Link>
    </div>
  );
}
