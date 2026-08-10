import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Realtime is configured via Supabase dashboard.',
    tables_with_realtime: ['alertes', 'chantiers', 'factures'],
  })
}
