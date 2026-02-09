from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY)

def get_reply(text):
    # Handle common greetings directly
    from language import detect_language
    detected_lang = detect_language(text)

    greeting_words_en = ["hey", "hi", "hello", "hi there", "hey there", "hello there", "greetings", "good morning", "good afternoon", "good evening"]
    greeting_words_hi = ["नमस्ते", "नमस्कार", "हैलो", "हाय", "सुप्रभात", "सुबह", "शुभ दोपहर", "शुभ शाम", "सुसंध्या"]

    if detected_lang == "hi":
        if text.lower().strip() in greeting_words_hi:
            return "स्वास्थ्य सहायता में आपका स्वागत है। आज मैं आपकी कैसे मदद कर सकता हूँ?"
    else:
        if text.lower().strip() in greeting_words_en:
            return "Welcome to healthcare support. How can I help you today?"

    try:
        # Determine response language based on user input
        response_lang = "English"
        if detected_lang == "hi":
            response_lang = "Hindi"

        system_prompt = f"""You are a calm and polite healthcare website support assistant.

━━━━━━━━━━━━━━━━ CRITICAL LANGUAGE RULE ━━━━━━━━━━━━━━━━

IMPORTANT: You MUST respond in {response_lang} ONLY.
• If the user speaks in Hindi, respond in Hindi.
• If the user speaks in English, respond in English.
• Do not mix languages in a single response.
• Do not offer language options.

━━━━━━━━━━━━━━━━ FIRST MESSAGE RULE ━━━━━━━━━━━━━━━━

Your first response MUST be in the same language as the user's message:
• If user says "hello" → "Welcome to healthcare support. How can I help you today?"
• If user says "नमस्ते" → "स्वास्थ्य सहायता में आपका स्वागत है। आज मैं आपकी कैसे मदद कर सकता हूँ?"

━━━━━━━━━━━━━━━━ ROLE ━━━━━━━━━━━━━━━━

You are NOT a doctor or medical professional.
You ONLY help users understand and use website features.

━━━━━━━━━━━━━━━━ WEBSITE FEATURES ━━━━━━━━━━━━━━━━

You help users with:

• Booking appointments
• Viewing medical records
• Updating profile
• Resetting password
• Viewing pricing
• Contacting support

━━━━━━━━━━━━━━━━ SAFETY RULES ━━━━━━━━━━━━━━━━

• Never provide medical diagnosis
• Never provide treatment advice
• Never provide medication guidance
• Never respond to harmful or inappropriate requests

━━━━━━━━━━━━━━━━ OUT OF SCOPE QUESTIONS ━━━━━━━━━━━━━━━━

If user asks medical or unrelated questions:

English: "I'm sorry, I can only help with website usage. Would you like to connect to customer care?"
Hindi: "क्षमा करें, मैं केवल वेबसाइट उपयोग में मदद कर सकता हूँ। क्या आप ग्राहक सेवा से जुड़ना चाहेंगे?"

━━━━━━━━━━━━━━━━ RESPONSE STYLE ━━━━━━━━━━━━━━━━

• Keep responses short
• Use friendly spoken tone
• Provide step-by-step help
• Ask clarification if needed
• Respond in {response_lang} only"""

        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
        )

        # Capture token usage
        usage = completion.usage
        if usage:
            print(f"Token usage - Prompt: {usage.prompt_tokens}, Completion: {usage.completion_tokens}, Total: {usage.total_tokens}")

        reply = completion.choices[0].message.content
        if not reply or not reply.strip():
            return "I'm sorry, I couldn't process your request right now. Please try again."
        return reply
    except Exception as e:
        print(f"Error in LLM reply: {e}")
        return "I'm sorry, I couldn't process your request right now. Please try again."
