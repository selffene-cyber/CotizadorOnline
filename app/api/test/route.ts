// API route simple para probar que el servidor responde
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[API Test] Petición recibida');
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Servidor funcionando',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API Test] Error:', error);
    return NextResponse.json(
      { error: 'Error en el servidor', details: String(error) },
      { status: 500 }
    );
  }
}

