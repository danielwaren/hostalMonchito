export async function GET() {
  console.log('Test endpoint hit!');
  return new Response(JSON.stringify({ message: 'Test successful!', timestamp: new Date().toISOString() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export const prerender = false;
