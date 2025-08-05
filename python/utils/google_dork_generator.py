import sys
import json
import urllib.parse

def generate_username_dorks(username):
    """Generates general dorks for the username."""
    if not username:
        return []
    
    q_user = urllib.parse.quote_plus(f'"{username}"')
    
    dorks = [
        {"text": "Search Social Media", "url": f"https://www.google.com/search?q={q_user}+site%3Afacebook.com+OR+site%3Ainstagram.com+OR+site%3Alinkedin.com+OR+site%3Atwitter.com"},
        {"text": "Hunt for Leaks on Paste Sites", "url": f"https://www.google.com/search?q={q_user}+site%3Apastebin.com+OR+site%3Ajustpaste.it"},
        {"text": "Search for Public Documents", "url": f"https://www.google.com/search?q={q_user}+filetype%3Apdf+OR+filetype%3Adocx+OR+filetype%3Axlsx"},
        {"text": "Find in URLs", "url": f"https://www.google.com/search?q=allinurl%3A{urllib.parse.quote_plus(username)}"}
    ]
    return dorks

def generate_person_dorks(person_name, location=""):
    """Generates specific dorks for an extracted full name."""
    if not person_name:
        return []

    q_person = urllib.parse.quote_plus(f'"{person_name}"')
    q_location = urllib.parse.quote_plus(f'"{location}"') if location else ""

    dorks = [
        {"text": "Find Resumes/CVs", "url": f"https://www.google.com/search?q={q_person}+filetype%3Apdf+(resume+OR+cv)"},
        {"text": "Find Contact Information", "url": f"https://www.google.com/search?q={q_person}+contact+OR+email+OR+phone"}
    ]
    if location:
        dorks.append({"text": "Search with Location", "url": f"https://www.google.com/search?q={q_person}+{q_location}"})
    return dorks

def generate_org_dorks(org_name, person_name=""):
    """Generates dorks for an organization, optionally with a person's name."""
    if not org_name:
        return []
        
    q_org = urllib.parse.quote_plus(f'"{org_name}"')
    q_person = urllib.parse.quote_plus(f'"{person_name}"') if person_name else ""

    dorks = [
        {"text": "Find on LinkedIn", "url": f"https://www.google.com/search?q={q_person}+{q_org}+site%3Alinkedin.com"},
        {"text": "Search for Internal Documents", "url": f"https://www.google.com/search?q={q_person}+{q_org}+filetype%3Apdf+OR+filetype%3Axlsx"}
    ]
    return dorks

if __name__ == "__main__":
    try:
        input_data = json.loads(sys.argv[1])

        username = input_data.get("primaryUsername", "")
        entities = input_data.get("extractedEntities", {})
        
        primary_person = entities.get("PERSON", [""])[0]
        primary_location = entities.get("GPE", [""])[0]
        
        dorks = {
            "username_dorks": generate_username_dorks(username),
            "entity_dorks": {}
        }
        
        if primary_person:
             dorks["entity_dorks"][primary_person] = generate_person_dorks(primary_person, primary_location)
        
        for org in entities.get("ORG", []):
            dorks["entity_dorks"][org] = generate_org_dorks(org, primary_person)

        print(json.dumps(dorks))

    except Exception as e:
        print(json.dumps({"error": str(e)}))