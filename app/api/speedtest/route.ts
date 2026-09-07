import { NextResponse } from 'next/server';

/**
 * GET /api/speedtest
 * Returns a 2.5 MB uncompressed payload to measure real client-side download throughput.
 */
export async function GET(): Promise<NextResponse> {
  const sizeInBytes = 2.5 * 1024 * 1024; // 2.5 MB
  const dummyBuffer = Buffer.alloc(sizeInBytes, 0x41);

  return new NextResponse(dummyBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': sizeInBytes.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
