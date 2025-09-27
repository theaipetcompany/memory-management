// API route for general application data
// This can be used for health checks or other general endpoints

export const revalidate = 0;

export async function GET(_request: Request) {
  try {
    // Return a simple health check response
    const data = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API is running',
    };

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in API route:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
