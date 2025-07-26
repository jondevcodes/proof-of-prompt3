from prompt_handler import get_response
from db_logger import init_db, log_to_db

init_db()

prompt = input("Enter your AI prompt: ")
answer = get_response(prompt)
log_to_db(prompt, answer)

print("GPT-4 says:", answer)
