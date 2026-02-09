/**
 * Next.js API Route for Medical RAG Integration
 */

import { NextRequest, NextResponse } from 'next/server';

const LOCAL_FLASK_API_URL = 'http://localhost:5000';
const RENDER_FLASK_API_URL = 'https://testing-9obu.onrender.com';
const FLASK_API_URL = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NODE_ENV === 'production'
    ? RENDER_FLASK_API_URL
    : LOCAL_FLASK_API_URL)
).replace(/\/+$/, '');

type FlaskProxyError = Error & { status?: number };

function createProxyError(message: string, status: number): FlaskProxyError {
  const error = new Error(message) as FlaskProxyError;
  error.status = status;
  return error;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

async function callFlask(endpoint: string, method: string, body?: unknown) {
  const url = `${FLASK_API_URL}${endpoint}`;
  
  console.log(`📡 [Next.js API] Calling Flask: ${method} ${url}`);
  
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';
    const responseText = await response.text();
    const trimmedResponseText = responseText.trimStart();
    
    if (
      contentType.includes('application/json') ||
      trimmedResponseText.startsWith('{') ||
      trimmedResponseText.startsWith('[')
    ) {
      try {
        const data = JSON.parse(trimmedResponseText);
        console.log(`✅ [Next.js API] Flask response OK`);
        return { status: response.status, data };
      } catch {
        throw createProxyError(
          `Flask returned invalid JSON (${response.status}) from ${url}`,
          502
        );
      }
    }

    const bodyPreview =
      trimmedResponseText.slice(0, 160).replace(/\s+/g, ' ') || '<empty>';
    throw createProxyError(
      `Flask returned non-JSON (${response.status}) from ${url}. Set BACKEND_URL/NEXT_PUBLIC_BACKEND_URL correctly. Response starts with: ${bodyPreview}`,
      502
    );
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('❌ [Next.js API] Error:', errorMessage);
    if (error instanceof Error && 'status' in error && typeof error.status === 'number') {
      throw error;
    }

    throw createProxyError(
      `Failed to reach Flask at ${url}: ${errorMessage}`,
      503
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 [Next.js API] POST /api/medical');
    
    const body = await request.json();
    const {
      action,
      folder_type,
      use_cache,
      force_regenerate,
      max_new_structured_extractions,
      user_id
    } = body;
    
    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }
    
    console.log(`📋 [Next.js API] Action: ${action}, User: ${user_id}`);
    
    if (action === 'process') {
      const result = await callFlask('/api/process-files', 'POST', {
        user_id,
        folder_type: folder_type || 'reports'
      });
      return NextResponse.json(result.data, { status: result.status });
    }
    
    else if (action === 'generate-summary') {
      const result = await callFlask('/api/generate-summary', 'POST', {
        user_id,
        folder_type,
        use_cache: use_cache !== false,
        force_regenerate: force_regenerate === true,
        max_new_structured_extractions
      });
      return NextResponse.json(result.data, { status: result.status });
    }
    
    else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
    
  } catch (error: unknown) {
    console.error('❌ [Next.js API] Error:', error);
    const status =
      error instanceof Error && 'status' in error && typeof error.status === 'number'
        ? error.status
        : 500;
    return NextResponse.json(
      { success: false, error: getErrorMessage(error), backend_url: FLASK_API_URL },
      { status }
    );
  }
}
