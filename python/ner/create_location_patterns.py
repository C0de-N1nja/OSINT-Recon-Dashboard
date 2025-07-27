import json
import os

INPUT_FILE = "raw_locations.txt"
OUTPUT_FILE = "python/pakistani_names.jsonl"

def create_location_patterns():
    if not os.path.exists(INPUT_FILE):
        print(f"[ERROR] '{INPUT_FILE}' not found. Please create the file and add city names.")
        return

    loc_count = 0
    gpe_count = 0

    print(f"Appending LOC and GPE patterns from '{INPUT_FILE}' to '{OUTPUT_FILE}'...")

    with open(INPUT_FILE, 'r', encoding='utf-8') as infile, \
         open(OUTPUT_FILE, 'a', encoding='utf-8') as outfile:

        for line in infile:
            city = line.strip().lower()
            if not city:
                continue

            loc_pattern = {
                "label": "LOC",
                "pattern": [{"LOWER": city}]
            }
            outfile.write(json.dumps(loc_pattern) + "\n")
            loc_count += 1

            gpe_pattern = {
                "label": "GPE",
                "pattern": [{"LOWER": city}]
            }
            outfile.write(json.dumps(gpe_pattern) + "\n")
            gpe_count += 1

    print("-" * 50)
    print(f"Added {loc_count} LOC patterns")
    print(f"Added {gpe_count} GPE patterns")
    print(f"Appended to file: {OUTPUT_FILE}")
    print("-" * 50)

if __name__ == "__main__":
    create_location_patterns()
