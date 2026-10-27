import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
import path from 'node:path';

export default function config(phase: string): NextConfig {
  return {
    outputFileTracingRoot: path.resolve(process.cwd()),
    // Keep production checks from overwriting an open development preview.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next' : '.next-production',
  };
}
