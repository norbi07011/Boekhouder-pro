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
