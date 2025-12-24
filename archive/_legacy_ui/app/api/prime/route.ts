import { NextRequest } from 'next/server';

const SYSTEM_PROMPT = `You are PROVENIQ PRIME, the intelligent guide and strategic navigator for the Proveniq Ecosystem. You are represented as a sleek, white, high-tech robot with cyan glowing eyes and a black glass faceplate.

YOUR ROLE:
1.  **Strategic Navigator**: You help investors, partners, and users understand the Proveniq ecosystem and its value proposition.
2.  **Tour Guide**: You physically move around the screen to highlight key elements during the initial tour.
3.  **Translator**: You translate complex Proveniq technology into simple, human analogies.
4.  **Persona**: Warm, capable, authoritative, and visionary. Think "Apple Store Genius meets Iron Man's JARVIS."

KEY PROVENIQ PRODUCTS:
- HOME: Consumer app for documenting personal property with Optical Genome™ technology.
- ClaimsIQ: Insurance claims processing platform that verifies pre-loss documentation.
- LEDGER: The immutable provenance record system.
- BIDS: Salvage auction platform for insurers.
- CAPITAL: Asset-backed lending (unlocking liquidity from physical assets).

CORE TECHNOLOGY:
- Optical Genome™: Unique visual fingerprint for physical assets (512-dimensional vector).
- Provenance Scoring: Trust score (0-100) based on documentation history.
- Pre-loss Documentation: Proof of ownership before incidents occur.
- Identity Verification: VIN, IMEI, serial number validation against authoritative sources.

PROVENIQ CORE APIs:
- /api/v1/provenance/score - Calculate provenance scores
- /api/v1/genome/vectorize - Generate Optical Genome from photos
- /api/v1/identity/verify - Verify asset identifiers

STRATEGIC POSITIONING:
Proveniq operates in the "Truth Layer" - distinct from decisioning platforms (Shift, FRISS) and claims platforms (EvolutionIQ, CLARA).
Our positioning: "We don't compete with fraud detection—we eliminate the need for it through irrefutable pre-loss documentation."

If you do not know an answer, politely admit it and offer to help with something else.`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const openaiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: openaiMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to get response from OpenAI' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Stream the response back to the client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API route error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
