import { NextRequest, NextResponse } from 'next/server';
import {
  executeWithFallback,
  getExecutionStatus,
} from '../../../lib/video-execution/orchestrator';
import type {
  ExecutionProviderId,
  VideoExecutionInput,
} from '../../../lib/video-execution/types';

function enabled() {
  const value = process.env.VIDEO_EXECUTION_ENABLED?.trim().toLowerCase();
  return value === 'true' || value === '1';
}

function authorized(req: NextRequest) {
  const configured = process.env.VIDEO_EXECUTION_TOKEN?.trim();
  if (!configured) return false;

  const bearer = req.headers.get('authorization');
  const explicit = req.headers.get('x-video-execution-token');
  return bearer === `Bearer ${configured}` || explicit === configured;
}

function deny() {
  return NextResponse.json(
    {
      error:
        'Video execution is disabled or unauthorized. Routing remains available without spending provider credits.',
    },
    { status: 403 },
  );
}

export async function POST(req: NextRequest) {
  if (!enabled() || !authorized(req)) return deny();

  try {
    const body = (await req.json()) as { input?: VideoExecutionInput };
    if (!body?.input) {
      return NextResponse.json({ error: 'input is required' }, { status: 400 });
    }

    const result = await executeWithFallback(body.input);
    return NextResponse.json(result, {
      status: result.submission ? 202 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Invalid video execution request',
      },
      { status: 400 },
    );
  }
}

export async function GET(req: NextRequest) {
  if (!enabled() || !authorized(req)) return deny();

  const providerId = req.nextUrl.searchParams.get(
    'providerId',
  ) as ExecutionProviderId | null;
  const providerJobId = req.nextUrl.searchParams.get('providerJobId');

  if (!providerId || !providerJobId) {
    return NextResponse.json(
      { error: 'providerId and providerJobId are required' },
      { status: 400 },
    );
  }

  try {
    const status = await getExecutionStatus(providerId, providerJobId);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Provider status failed',
      },
      { status: 502 },
    );
  }
}
