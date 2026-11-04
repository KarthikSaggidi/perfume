import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
import path from 'node:path';

export default function config(phase: string): NextConfig {
  return {
    devIndicators: false,
    // Preserve the admin's 127.0.0.1 origin when canonicalizing local redirects.
    skipMiddlewareUrlNormalize: true,
    images: { qualities: [75, 90] },
    outputFileTracingRoot: path.resolve(process.cwd()),
    // Vercel expects production output in .next; isolate development previews.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? (process.env.VELORA_DEV_DIST||'.next-dev') : '.next',
  };
}
