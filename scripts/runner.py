import os
import json
from dotenv import load_dotenv
from datetime import datetime, timezone  # ✅ place it here at the top
from openai import OpenAI

# Load your OpenAI API key from .env
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

LOG_FILE = "logs/logs.json"

def log_prompt_response(prompt, response):
    os.makedirs("logs", exist_ok=True)
    log_data = {
        "timestamp": datetime.now(timezone.utc).isoformat(),  # ✅ proper timestamp
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

def run_prompt(prompt):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5
    )
    reply = response.choices[0].message.content
    log_prompt_response(prompt, reply)
    print("\n🧠 GPT-4 Response:\n", reply)

if __name__ == "__main__":
    user_input = input("Enter your prompt:\n> ")
    run_prompt(user_input)
