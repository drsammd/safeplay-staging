
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      }
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
