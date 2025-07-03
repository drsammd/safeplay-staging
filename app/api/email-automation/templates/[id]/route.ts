
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailTemplateService } from '@/lib/services/email-template-service';

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['COMPANY_ADMIN', 'VENUE_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await emailTemplateService.getTemplate(params.id);
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);

  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      subject,
      htmlContent,
      textContent,
      templateType,
      category,
      variables,
      metadata,
      designConfig,
      isActive
    } = body;

    // Validate template syntax if content is being updated
    if (htmlContent || textContent) {
      const validation = emailTemplateService.validateTemplate(
        htmlContent || '', 
        textContent
      );
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Template validation failed', details: validation.errors }, 
          { status: 400 }
        );
      }
    }

    const template = await emailTemplateService.updateTemplate(params.id, {
      name,
      subject,
      htmlContent,
      textContent,
      templateType,
      category,
      variables,
      metadata,
      designConfig,
      isActive,
      lastModifiedBy: session.user.id
    });

    return NextResponse.json(template);

  } catch (error) {
    console.error('Error updating template:', error);
    
    if (error instanceof Error && error.message === 'Template not found') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to update template' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await emailTemplateService.deleteTemplate(params.id);

    return NextResponse.json({ message: 'Template deleted successfully' });

  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' }, 
      { status: 500 }
    );
  }
}
