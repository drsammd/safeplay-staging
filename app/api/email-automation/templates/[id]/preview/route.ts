
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailTemplateService } from '@/lib/services/email-template-service';

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['COMPANY_ADMIN', 'VENUE_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { variables } = body;

    const preview = await emailTemplateService.previewTemplate(params.id, {
      variables: variables || {}
    });

    return NextResponse.json(preview);

  } catch (error) {
    console.error('Error previewing template:', error);
    
    if (error instanceof Error && error.message === 'Template not found') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to preview template' }, 
      { status: 500 }
    );
  }
}
