import { NextResponse } from 'next/server';
import { phase1Readiness } from '../../../lib/phase1-config';
import { runtimeStatesFromEnvironment } from '../../../lib/video-router/provider-registry';
import { videoCircuitBreakers } from '../../../lib/video-router/circuit-breaker';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = phase1Readiness();
  return NextResponse.json(
    {
      app: 'Mabrig Verse',
      phase: 'Phase 1',
      ...status,
      videoRouter: {
        providers: runtimeStatesFromEnvironment(),
        circuits: videoCircuitBreakers.snapshot(),
      },
    },
    { status: status.ready ? 200 : 503 },
  );
}
