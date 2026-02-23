import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/error-utils';
import { ChatService } from '@/lib/services/chat-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history, image } = body;

    if (!message && !image) {
      return NextResponse.json(
        { error: 'Message or image is required' },
        { status: 400 }
      );
    }

    console.log(`Processing chat request: "${message?.substring(0, 50)}..." ${image ? '(with image)' : ''}`);

    const chatService = new ChatService();
    const result = await chatService.chat(message, history, image);

    return NextResponse.json({ response: result.response, model: result.model });
  } catch (error: any) {
    // Log more details if available
    console.error('Chat Error:', error);
    return handleApiError(error, 'Failed to generate response');
  }
}
