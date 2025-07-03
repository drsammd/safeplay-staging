
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailTemplateService } from '@/lib/services/email-template-service';
import { EmailTemplateType, EmailCategory } from '@prisma/client';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['COMPANY_ADMIN', 'VENUE_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const templateType = searchParams.get('templateType') as EmailTemplateType;
    const category = searchParams.get('category') as EmailCategory;
    const isActive = searchParams.get('isActive') === 'true' ? true : 
                    searchParams.get('isActive') === 'false' ? false : undefined;
    const search = searchParams.get('search') || undefined;

    const result = await emailTemplateService.getTemplates({
      templateType,
      category,
      isActive,
      search,
      page,
      limit
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      designConfig
    } = body;

    // Validate required fields
    if (!name || !subject || !htmlContent || !templateType || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Validate template syntax
    const validation = emailTemplateService.validateTemplate(htmlContent, textContent);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Template validation failed', details: validation.errors }, 
        { status: 400 }
      );
    }

    const template = await emailTemplateService.createTemplate({
      name,
      subject,
      htmlContent,
      textContent,
      templateType,
      category,
      variables,
      metadata,
      designConfig,
      createdBy: session.user.id
    });

    return NextResponse.json(template, { status: 201 });

  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' }, 
      { status: 500 }
    );
  }
}
