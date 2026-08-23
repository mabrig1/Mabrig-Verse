import {NextResponse} from 'next/server';
import {phase1Readiness} from '../../../lib/phase1-config';
export const dynamic='force-dynamic';
export async function GET(){const status=phase1Readiness();return NextResponse.json({app:'Mabrig Verse',phase:'Phase 1',...status},{status:status.ready?200:503});}
