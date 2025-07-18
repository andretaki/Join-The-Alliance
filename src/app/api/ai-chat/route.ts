import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid messages format'
      }, { status: 400 });
    }

    // Check if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured'
      }, { status: 500 });
    }

    console.log('🤖 Making OpenAI API call...');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json({
        success: false,
        error: `OpenAI API error: ${response.status}`
      }, { status: response.status });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json({
        success: false,
        error: 'Invalid response from OpenAI'
      }, { status: 500 });
    }

    const content = data.choices[0].message.content;
    
    // Try to parse as JSON for AI agents
    try {
      const jsonResponse = JSON.parse(content);
      return NextResponse.json({
        success: true,
        response: jsonResponse
      });
    } catch {
      // If not valid JSON, return as text
      return NextResponse.json({
        success: true,
        response: content
      });
    }

  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}