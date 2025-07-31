import spacy
from spacy.pipeline import EntityRuler
import json
import sys
import os
import re
import unicodedata

def log(message):
    print(message, file=sys.stderr)

def load_font_mappings(file_path):
    font_map = {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 2:
                    standard_char = parts[-1]
                    fancy_chars = parts[:-1]
                    for char in fancy_chars:
                        font_map[char] = standard_char
        log(f"Loaded font mappings from {file_path}")
    except FileNotFoundError:
        log(f"Font mappings file not found: {file_path}")
    return font_map

def clean_and_normalize_text(text, font_map):
    normalized_text = []
    for char in text:
        if char in font_map:
            normalized_text.append(font_map[char])
            continue
        category = unicodedata.category(char)
        if category.startswith('L') or category.startswith('N') or \
           category.startswith('P') or category.startswith('Z'):
            normalized_text.append(char)
    cleaned_text = "".join(normalized_text)
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
    return cleaned_text

nlp = spacy.load("xx_ent_wiki_sm")
ruler = nlp.add_pipe("entity_ruler", before="ner", config={"overwrite_ents": True})

patterns = []
script_dir = os.path.dirname(os.path.abspath(__file__))
patterns_path = os.path.join(script_dir, "../data/pakistani_names.jsonl")

try:
    with open(patterns_path, "r", encoding="utf-8") as r_file:
        for line in r_file:
            patterns.append(json.loads(line))
    log(f"Loaded {len(patterns)} patterns from {patterns_path}")
except FileNotFoundError:
    log(f"Patterns file not found: {patterns_path}")

ruler.add_patterns(patterns)

font_map_path = os.path.join(script_dir, "../data/font_mappings.txt")
font_mappings = load_font_mappings(font_map_path)

input_text = sys.argv[1]
cleaned_input_text = clean_and_normalize_text(input_text, font_mappings)
log(f"Input text: {input_text}")
log(f"Normalized text: {cleaned_input_text}")

doc = nlp(cleaned_input_text)
log(f"Raw entities: {[(ent.text, ent.label_) for ent in doc.ents]}")

entities_by_label = {
    "PERSON": [],
    "ORG": [],
    "GPE": [],
    "LOC": [],
}

i = 0
while i < len(doc.ents):
    current_entity = doc.ents[i]
    if current_entity.label_ not in entities_by_label:
        log(f"Skipping entity '{current_entity.text}' with label '{current_entity.label_}'")
        i += 1
        continue
    if i + 1 < len(doc.ents):
        next_entity = doc.ents[i + 1]
        if current_entity.label_ == "PERSON" and next_entity.label_ == "PERSON" and \
           (next_entity.start == current_entity.end or next_entity.start == current_entity.end + 1):
            merged_text = current_entity.text + " " + next_entity.text
            entities_by_label["PERSON"].append(merged_text)
            i += 2
        else:
            entities_by_label[current_entity.label_].append(current_entity.text)
            i += 1
    else:
        entities_by_label[current_entity.label_].append(current_entity.text)
        i += 1

for label in entities_by_label:
    entities_by_label[label] = [entity.title() for entity in entities_by_label[label]]

print(json.dumps(entities_by_label, ensure_ascii=False))