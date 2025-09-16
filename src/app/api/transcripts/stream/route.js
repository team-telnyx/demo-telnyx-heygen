import { transcriptStreamManager } from '@/lib/transcript-stream';

export async function GET(request) {
  console.log('SSE transcript stream connection requested');
  console.log('Current stream manager state:', transcriptStreamManager.getCurrentState());

  // Create SSE response
  const response = new Response(
    new ReadableStream({
      start(controller) {
        // Mock response object for our stream manager
        const mockResponse = {
          write: (data) => {
            try {
              controller.enqueue(new TextEncoder().encode(data));
            } catch (error) {
              console.error('Error writing to SSE stream:', error);
            }
          },
          // Add a flag to track if this connection is closed
          closed: false
        };

        // Add connection to stream manager
        transcriptStreamManager.addConnection(mockResponse);

        // Send initial connection message
        mockResponse.write(`data: ${JSON.stringify({
          type: 'connected',
          message: 'Connected to transcript stream',
          timestamp: new Date().toISOString()
        })}\n\n`);

        // Handle client disconnect
        request.signal?.addEventListener('abort', () => {
          console.log('SSE client disconnected');
          mockResponse.closed = true;
          transcriptStreamManager.removeConnection(mockResponse);
          try {
            controller.close();
          } catch (error) {
            // Stream already closed
          }
        });

        // Keep connection alive with periodic heartbeat
        const heartbeatInterval = setInterval(() => {
          if (mockResponse.closed) {
            clearInterval(heartbeatInterval);
            return;
          }

          try {
            mockResponse.write(`data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`);
          } catch (error) {
            console.log('Heartbeat failed, cleaning up connection');
            clearInterval(heartbeatInterval);
            transcriptStreamManager.removeConnection(mockResponse);
          }
        }, 30000); // 30 second heartbeat
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    }
  );

  return response;
}