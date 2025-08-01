from openai import OpenAI
from openai import OpenAIError, APIConnectionError, RateLimitError
from dotenv import load_dotenv
import os
import hashlib
from typing import Tuple
import logging
from tenacity import retry, stop_after_attempt, wait_exponential

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PromptHandler")

# Load env
load_dotenv()

# Validate critical env vars
if not os.getenv("OPENAI_API_KEY"):
    raise EnvironmentError("Missing OPENAI_API_KEY in environment variables")

client = OpenAI(timeout=15.0, max_retries=3)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    reraise=True
)
def generate_proof(
    prompt: str,
    model: str = "gpt-4o",
    temperature: float = 0.7,
    max_tokens: int = 1000,
    stream: bool = False
) -> Tuple[str, bytes]:
    if not prompt.strip():
        raise ValueError("Prompt cannot be empty")
    if len(prompt) > 10000:
        raise ValueError("Prompt exceeds 10,000 character limit")

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a precise technical assistant. Respond concisely."},
                {"role": "user", "content": prompt}
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=0.9,
            stream=stream
        )
        if stream:
            collected_chunks = []
            for chunk in response:
                if chunk.choices[0].delta.content:
                    collected_chunks.append(chunk.choices[0].delta.content)
            response_content = "".join(collected_chunks)
        else:
            response_content = response.choices[0].message.content

        proof_data = f"{prompt}{response_content}".encode('utf-8')
        proof_hash = hashlib.sha256(proof_data).digest()

        # Enhanced logging
        logger.info(f"Generated proof for {model} (prompt_len={len(prompt)}, response_len={len(response_content)})")
        logger.info(f"Prompt: {prompt[:50]}...")  # Log the first 50 characters of the prompt
        logger.info(f"Response: {response_content[:50]}...")  # Log the first 50 characters of the response
        logger.info(f"Proof hash: {proof_hash.hex()}")  # Log the proof hash in hexadecimal

        return response_content, proof_hash

    except (APIConnectionError, RateLimitError, OpenAIError) as e:
        logger.error(f"OpenAI error: {e}")
        raise RuntimeError(f"AI processing failed: {str(e)}") from e
    except Exception as e:
        logger.exception("Unexpected error in generate_proof")
        raise RuntimeError(f"AI processing failed: {str(e)}") from e