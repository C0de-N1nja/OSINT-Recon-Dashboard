import json
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(SCRIPT_DIR, '..', 'data', 'raw_organizations.txt')
OUTPUT_FILE = os.path.join(SCRIPT_DIR, '..', 'data', 'pakistani_names.jsonl')

def create_org_patterns():
    if not os.path.exists(INPUT_FILE):
        print(f"[ERROR] '{INPUT_FILE}' not found. Please create the file and add organization names.")
        return

    org_count = 0
    processed_org_names = set()

    print(f"Processing and appending ORG patterns from '{INPUT_FILE}' to '{OUTPUT_FILE}'...")

    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as infile:
            for line in infile:
                stripped_line = line.strip()
                if not stripped_line:
                    continue

                cleaned_name = re.sub(r'^\d+\.\s*', '', stripped_line).strip().rstrip(',')
                
                if cleaned_name:
                    processed_org_names.add(cleaned_name)

        with open(OUTPUT_FILE, 'a', encoding='utf-8') as outfile:
            for org_name in sorted(list(processed_org_names)):
                pattern_tokens = [{"LOWER": token.lower()} for token in org_name.split()]

                org_pattern = {
                    "label": "ORG",
                    "pattern": pattern_tokens
                }

                outfile.write(json.dumps(org_pattern) + "\n")
                org_count += 1

    except Exception as e:
        print(f"ERROR: Failed to create ORG patterns. Reason: {e}")
        return

    print("-" * 50)
    print(f"Added {org_count} UNIQUE ORG patterns (after cleaning and deduplication).")
    print(f"Appended to file: {OUTPUT_FILE}")
    print("-" * 50)

if __name__ == "__main__":
    create_org_patterns()