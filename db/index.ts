import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

type D1Binding = Parameters<typeof drizzle>[0];

function resolveD1Binding(binding?: D1Binding) {
  if (binding) return binding;

  const globalBinding = (globalThis as typeof globalThis & {
    DB?: D1Binding;
    env?: { DB?: D1Binding };
  });

  const dbBinding = globalBinding.DB ?? globalBinding.env?.DB;
  if (!dbBinding) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Pass a D1 binding to getDb(DB), configure the `d1` field in .openai/hosting.json, or avoid importing db/index.ts in non-Cloudflare runtimes."
    );
  }

  return dbBinding;
}

export function getDb(binding?: D1Binding) {
  return drizzle(resolveD1Binding(binding), { schema });
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  },
});