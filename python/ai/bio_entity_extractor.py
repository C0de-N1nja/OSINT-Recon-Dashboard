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
                    standard_char = parts[-1]; fancy_chars = parts[:-1]
                    for char in fancy_chars: font_map[char] = standard_char
        log(f"Loaded font mappings from {file_path}")
    except FileNotFoundError:
        log(f"Font mappings file not found: {file_path}")
    return font_map

def clean_and_normalize_text(text, font_map):
    cleaned_text = re.sub(r'[\n\r\t]+', ' ', text)
    cleaned_text = re.sub(r'\s{2,}', ' ', cleaned_text)

    normalized_text = "".join([font_map.get(char, char) for char in cleaned_text])

    final_text = "".join([char for char in normalized_text if unicodedata.category(char).startswith(('L', 'N', 'P', 'Z'))])
    return final_text.strip()

try:
    nlp = spacy.load("xx_ent_wiki_sm")
    ruler = nlp.add_pipe("entity_ruler", before="ner", config={"overwrite_ents": True})

    script_dir = os.path.dirname(os.path.abspath(__file__))
    patterns_path = os.path.join(script_dir, "../data/pakistani_names.jsonl")
    patterns = []
    try:
        with open(patterns_path, "r", encoding="utf-8") as r_file:
            for line in r_file: patterns.append(json.loads(line))
        log(f"Loaded {len(patterns)} patterns from {patterns_path}")
    except FileNotFoundError:
        log(f"Patterns file not found: {patterns_path}")
    
    if patterns: ruler.add_patterns(patterns)
    
    font_map_path = os.path.join(script_dir, "../data/font_mappings.txt")
    font_mappings = load_font_mappings(font_map_path)

    input_text = sys.argv[1]
    cleaned_input_text = clean_and_normalize_text(input_text, font_mappings)
    log(f"Input text: {input_text}\nNormalized text: {cleaned_input_text}")

    doc = nlp(cleaned_input_text)
    log(f"Raw entities found by SpaCy: {[(ent.text, ent.label_) for ent in doc.ents]}")

    label_map = {"PER": "PERSON", "PERSON": "PERSON", "ORG": "ORG", "GPE": "GPE", "LOC": "LOC"}
    entities_by_label = {"PERSON": [], "ORG": [], "GPE": [], "LOC": []}

    for ent in doc.ents:
        mapped_label = label_map.get(ent.label_)
        if mapped_label:
            entities_by_label[mapped_label].append(ent.text)

    for label, entities in entities_by_label.items():
        unique_entities = set(entity.title() for entity in entities)
        entities_by_label[label] = sorted(list(unique_entities))

    print(json.dumps(entities_by_label, ensure_ascii=False))

except Exception as e:
    error_output = {"error": "Python NLP script failed.", "message": str(e)}
    log(f"[CRITICAL] NLP Script failed with exception: {e}")
    print(json.dumps(error_output))