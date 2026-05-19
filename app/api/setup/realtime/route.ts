import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Realtime is configured via Supabase dashboard.',
    instructions: [
      '1. Go to your Supabase project dashboard',
      '2. Navigate to Table Editor > alertes',
      '3. Enable Realtime for the alertes table',
      '4. Use supabase.channel() in your client components',
    ],
    tables_with_realtime: ['alertes', 'chantiers', 'factures'],
  })
}
