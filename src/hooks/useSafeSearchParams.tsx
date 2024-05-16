'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { z } from 'zod';

/**
 * Custom hook to safely parse and update URL search parameters based on a given Zod schema.
 *
 * @template T - The Zod schema type extending AnyZodObject.
 * @param {T} schema - The Zod schema to validate the search parameters against.
 * @returns {[z.infer<T>, (newParams: Partial<z.infer<T>>) => string]} A tuple where the first element is the parsed search parameters matching the schema, and the second element is a function to create a URL with updated search parameters.
 *
 * @example
 * const mySchema = z.object({ count: z.coerce.number() })
 * const [params, createURL] = useSafeSearchParams(mySchema);
 * params.count; // number
 * const incrementedCountUrl = createURL({ count: params.count + 1 });
 */
export const useSafeSearchParams = <T extends z.AnyZodObject>(
  schema: T,
): [z.infer<T>, (newParams: Partial<z.infer<T>>) => string] => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const safeSearchParams = useMemo(() => {
    return schema.parse(Object.fromEntries(searchParams));
  }, [schema, searchParams]);

  const createSafeURL = useCallback(
    (newParams: Partial<z.infer<T>>): string => {
      const updatedParams = new URLSearchParams(searchParams);

      for (const key in newParams) {
        updatedParams.set(key, JSON.stringify(newParams[key]));
      }

      return pathname + '?' + updatedParams.toString();
    },
    [pathname, searchParams],
  );

  return [safeSearchParams, createSafeURL];
};
