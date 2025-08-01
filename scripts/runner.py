import os
import json
from dotenv import load_dotenv
from datetime import datetime, timezone
from openai import OpenAI

# Load your OpenAI API key from .env
load_dotenv()
if not os.getenv("OPENAI_API_KEY"):
    raise EnvironmentError("Missing OPENAI_API_KEY in environment variables")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

LOG_FILE = "logs/logs.json"

def log_prompt_response(prompt, response):
    try:
        os.makedirs("logs", exist_ok=True)
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "prompt": prompt,
            "response": response
        }

        if os.path.exists(LOG_FILE):
            with open(LOG_FILE, "r") as f:
                logs = json.load(f)
        else:
            logs = []

        logs.append(log_data)

        with open(LOG_FILE, "w") as f:
            json.dump(logs, f, indent=2)

        print(f"Logged prompt-response pair at {log_data['timestamp']}")
    except Exception as e:
        print(f"Error logging prompt-response pair: {e}")

def run_prompt(prompt):
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5
        )
        reply = response.choices[0].message.content
        log_prompt_response(prompt, reply)
        print("\n🧠 GPT-4 Response:\n", reply)
    except Exception as e:
        print(f"Error interacting with OpenAI API: {e}")

if __name__ == "__main__":
    try:
        user_input = input("Enter your prompt:\n> ")
        run_prompt(user_input)
    except KeyboardInterrupt:
        print("\nExiting...")