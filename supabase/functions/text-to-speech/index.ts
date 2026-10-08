import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_CLOUD_TTS_API_KEY');
    
    const { text, voiceName, voiceGender } = await req.json();
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required');
    }

    // Clean text: remove emojis, markdown formatting, and excessive punctuation
    const cleanText = text
      // Remove emojis and symbols
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}✅❌⚠️🔍📋📌🔒⚖️👨👩🏛️📊💡🚗🚦✨🎯💰📝🔑⭐]/gu, '')
      // Remove markdown bold/italic markers
      .replace(/\*{1,3}/g, '')
      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove markdown links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove markdown bullet points
      .replace(/^[-*+]\s+/gm, '')
      // Collapse multiple spaces/newlines
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Truncate to ~5000 chars to stay within API limits
    const truncatedText = cleanText.substring(0, 5000);

    // If no Google Cloud API key, return a flag to use browser TTS
    if (!apiKey) {
      console.log('GOOGLE_CLOUD_TTS_API_KEY not configured, returning useBrowserTTS flag');
      return new Response(
        JSON.stringify({ 
          useBrowserTTS: true,
          text: truncatedText,
          voiceName: voiceName || 'es-ES',
          voiceGender: voiceGender || 'female'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const selectedVoiceName = voiceName || 'es-US-Standard-A';
    const selectedGender = voiceGender || 'FEMALE';

    // Extract language code from voice name (e.g., "es-US-Standard-A" -> "es-US")
    const languageCode = selectedVoiceName.split('-').slice(0, 2).join('-') || 'es-US';

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: truncatedText },
          voice: {
            languageCode,
            name: selectedVoiceName,
            ssmlGender: selectedGender,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0,
          },
        }),
      }
    );
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Google TTS API error [${response.status}]: ${errorData}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ audioContent: data.audioContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('TTS Error:', error);
    // Fallback: return useBrowserTTS flag on any error
    return new Response(
      JSON.stringify({ 
        useBrowserTTS: true,
        text: text.substring(0, 5000),
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});