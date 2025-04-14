import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authentication required');
    }

    // Get the JWT token
    const token = authHeader.replace('Bearer ', '');

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Get the request body
    const { contact, lastMessage } = await req.json();
    if (!contact) {
      throw new Error('Contact information is required');
    }

    // Check if we have an OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key is not configured');
    }
    console.log('OpenAI API key found');

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    console.log('Sending request to OpenAI');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that generates friendly, personalized messages for keeping in touch with friends and family. Your messages should be warm, natural, and appropriate for the contact frequency.',
        },
        {
          role: 'user',
          content: `Generate a friendly message to send to ${contact.name}.
Context:
- Last contacted: ${contact.lastContact}
- Contact frequency: ${contact.frequency}
- Previous message (if any): ${lastMessage || 'None'}

The message should be casual and friendly, asking about their well-being and suggesting to catch up. Keep it concise and natural.`,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
      presence_penalty: 0.6,
      frequency_penalty: 0.6,
    });

    console.log('OpenAI response received');

    const message = completion.choices[0].message?.content;
    if (!message) {
      console.error('No message in OpenAI response');
      throw new Error('No message was generated');
    }

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);

    // Provide more user-friendly error messages
    let errorMessage = 'Failed to generate message';
    if (error.message && error.message.includes('API key')) {
      errorMessage = 'Server configuration error';
    } else if (error.message && error.message.includes('Authentication')) {
      errorMessage = 'Please sign in again';
    } else if (error.message && error.message.includes('model')) {
      errorMessage = 'Model not available. Please check your OpenAI access.';
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
