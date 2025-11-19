/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  JWT_SECRET: string;
  LIVEKIT_API_KEY: string;
  LIVEKIT_API_SECRET: string;
  LIVEKIT_WS_URL: string;
}

declare module '@cloudflare/next-on-pages' {
  interface RequestContext<
    CfProperties extends Record<string, unknown> = IncomingRequestCfProperties,
    Context = ExecutionContext
  > {
    env: CloudflareEnv;
    cf: CfProperties;
    ctx: Context;
  }

  export function getRequestContext<
    CfProperties extends Record<string, unknown> = IncomingRequestCfProperties,
    Context = ExecutionContext
  >(): RequestContext<CfProperties, Context>;

  export function getOptionalRequestContext<
    CfProperties extends Record<string, unknown> = IncomingRequestCfProperties,
    Context = ExecutionContext
  >(): RequestContext<CfProperties, Context> | undefined;
}
