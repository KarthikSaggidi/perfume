import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
import path from 'node:path';

export default function config(phase: string): NextConfig {
  return {
    outputFileTracingRoot: path.resolve(process.cwd()),
    // Vercel expects production output in .next; isolate development previews.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  };
}
