import sys
import json
import urllib.parse
import unicodedata
import traceback

def log_error(e):
    print(f"DORK GENERATOR ERROR: {e}", file=sys.stderr)
    print(traceback.format_exc(), file=sys.stderr)

def normalize_for_url(text):
    if not text:
        return ""
    return unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')

def generate_username_dorks(username):
    if not username: return []
    q_user = urllib.parse.quote_plus(f'"{normalize_for_url(username)}"')
    return [
        {"text": "Search Social Media", "url": f"https://www.google.com/search?q={q_user}+site%3Afacebook.com+OR+site%3Ainstagram.com+OR+site%3Alinkedin.com"},
        {"text": "Hunt for Leaks on Paste Sites", "url": f"https://www.google.com/search?q={q_user}+site%3Apastebin.com+OR+site%3Ajustpaste.it"},
        {"text": "Search for Public Documents", "url": f"https://www.google.com/search?q={q_user}+filetype%3Apdf+OR+filetype%3Adocx"}
    ]

def generate_person_dorks(person_name, location=""):
    if not person_name or len(person_name) > 50: return []
    
    q_person = urllib.parse.quote_plus(f'"{normalize_for_url(person_name)}"')
    q_location = urllib.parse.quote_plus(f'"{normalize_for_url(location)}"') if location else ""
    
    dorks = [
        {"text": "Find Resumes/CVs", "url": f"https://www.google.com/search?q={q_person}+filetype%3Apdf+(resume+OR+cv)"},
        {"text": "Find Contact Information", "url": f"https://www.google.com/search?q={q_person}+contact+OR+email"}
    ]
    if location:
        dorks.append({"text": "Search with Location", "url": f"https://www.google.com/search?q={q_person}+{q_location}"})
    return dorks

def generate_org_dorks(org_name, person_name=""):
    if not org_name or len(org_name) > 50: return []

    q_org = urllib.parse.quote_plus(f'"{normalize_for_url(org_name)}"')
    q_person = urllib.parse.quote_plus(f'"{normalize_for_url(person_name)}"') if person_name else ""
    
    return [
        {"text": "Find on LinkedIn", "url": f"https://www.google.com/search?q={q_person}+{q_org}+site%3Alinkedin.com"},
        {"text": "Search for Internal Documents", "url": f"https://www.google.com/search?q={q_person}+{q_org}+filetype%3Apdf"}
    ]

if __name__ == "__main__":
    try:
        input_data = json.loads(sys.argv[1])
        username = input_data.get("primaryUsername", "")
        entities = input_data.get("extractedEntities", {})
        
        primary_person_list = entities.get("PERSON", [])
        primary_location_list = entities.get("GPE", [])
        
        primary_person = primary_person_list[0] if primary_person_list else ""
        primary_location = primary_location_list[0] if primary_location_list else ""
        
        dorks = {
            "username_dorks": generate_username_dorks(username),
            "entity_dorks": {}
        }
        
        for person in primary_person_list:
             dorks["entity_dorks"][person] = generate_person_dorks(person, primary_location)
        
        for org in entities.get("ORG", []):
            dorks["entity_dorks"][org] = generate_org_dorks(org, primary_person)

        print(json.dumps(dorks))

    except Exception as e:
        log_error(e)
        print(json.dumps({"error": str(e)}))