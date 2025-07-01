
import { NextRequest } from 'next/server';
import { WebSocketService } from '@/lib/services/websocket-service';

export async function GET(request: NextRequest) {
  // This endpoint is just for WebSocket upgrade
  // The actual WebSocket handling is done in the WebSocket service
  return new Response('WebSocket endpoint - use socket.io client', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
