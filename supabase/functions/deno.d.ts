// Type declarations for Deno runtime
declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): { [key: string]: string };
  }
  const env: Env;
}

declare function serve(handler: (req: Request) => Response | Promise<Response>): void;

// Module declarations for Deno imports
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
  export { createClient } from "@supabase/supabase-js";
}

// Fix for Uint8Array as BodyInit
interface Body {
  readonly body: ReadableStream<Uint8Array> | null;
}

interface RequestInit {
  body?: BodyInit | Uint8Array | null;
}

type BodyInit = ReadableStream<Uint8Array> | XMLHttpRequestBodyInit | Uint8Array;
