# Store State in Search Params with Enhanced Validation & Type Safety

Many applications benefit from storing certain state in the URL search params. This allows the user to reload the page without losing their previous state.

However, having to sync state between local state and search params can be painful and very prone to bugs.

This example repo showcases a `useSafeSearchParams` hook that helps storing state in search params with validation using Zod, fallbacks, and E2E type safety.

Keep in mind, this hook only works in Next.js because we are relying on hooks provided by Next.js. But this approach can be easily adopted to any other framework.

Simply pass a zod object schema to `useSafeSearchParams`.

```typescript
const schema = z.object({ count: z.coerce.number() })

function Component() {
  const [params] = useSafeSearchParams(schema)
  params.count // number
}
```

There is one problem with the code above. An error will be thrown if `count` is not in the search params.

To enable fallbacks with Zod, you can use the following code ([credit](https://github.com/colinhacks/zod/issues/316#issuecomment-850906479)):

```typescript
const fallback = <T,>(value: T): z.Schema<T> => {
  return z.any().transform(() => value)
}

const schema = z.object({
  count: z.coerce.number().or(fallback(0))
});
```

We could even add additional validation like `min` and `max`, and Zod will fallback to using the fallback value if the validation fails.

In order to update the search params, `useSearchParams` returns a second value, `createSafeURL`, which is a function, given new search params, returns a url that can be passed to `router.push()` or `router.replace()` or even to a `<Link />` component.


```tsx
const schema = z.object({ count: z.coerce.number() })

// current url - /about?hello=world
function Component() {
  const [params, createSafeURL] = useSafeSearchParams(schema)

  const incrementCountUrl = createSafeURL({ count: params.count + 1 }) // -> /about?hello=world&count=1

  const incrementCountHandler = () => {
    router.replace(incrementCountUrl)
  }

  return (
    <>
      <Link href={incrementCountUrl}>
        Increment count
      <Link>
      <button onClick={incrementCountHandler}>
        Increment count
      </button>
    </>
  )
}
```

## Source Code

```typescript
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { z } from 'zod';

/**
 * Custom hook to safely parse and update URL search parameters based on a given Zod schema.
 *
 * @template T - The Zod schema type extending AnyZodObject.
 * @param {T} schema - The Zod schema to validate the search parameters against.
 * @returns {[z.infer<T>, (newParams: z.infer<T>) => string]} A tuple where the first element is the parsed search parameters matching the schema, and the second element is a function to create a URL with updated search parameters.
 *
 * @example
 * const mySchema = z.object({ count: z.coerce.number() })
 * const [params, createURL] = useSafeSearchParams(mySchema);
 * params.count; // number
 * const incrementedCountUrl = createURL({ count: params.count + 1 });
 */
export const useSafeSearchParams = <T extends z.AnyZodObject>(
  schema: T,
): [z.infer<T>, (newParams: z.infer<T>) => string] => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const safeSearchParams = useMemo(() => {
    return schema.parse(Object.fromEntries(searchParams));
  }, [schema, searchParams]);

  const createSafeURL = useCallback(
    (newParams: z.infer<T>): string => {
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
```
