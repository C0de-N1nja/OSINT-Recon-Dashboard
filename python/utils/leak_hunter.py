import sys
import json
import traceback
import requests
from bs4 import BeautifulSoup
import random
import time
from urllib.parse import quote_plus

def log_error(e):
    print(f"LEAK HUNTER ERROR: {e}", file=sys.stderr)
    print(traceback.format_exc(), file=sys.stderr)

def get_user_agents():
    return [
        # Chrome on Windows
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",

        # Firefox on Windows
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",

        # Edge on Windows
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",

        # Chrome on macOS
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",

        # Safari on macOS
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 "
        "(KHTML, like Gecko) Version/16.4 Safari/605.1.15",

        # Firefox on macOS
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13.4; rv:125.0) Gecko/20100101 Firefox/125.0",

        # Chrome on Linux
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",

        # Firefox on Linux
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",

        # Android Chrome
        "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",

        # iPhone Safari
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 "
        "(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
    ]

def main(keywords):
    """Searches for keywords on Pastebin via Google and returns results."""
    try:
        if not keywords:
            print(json.dumps({"leaks_found": []}))
            return
            
        search_terms = " OR ".join([f'"{keyword}"' for keyword in keywords])
        query = f'site:pastebin.com ({search_terms})'
        
        google_url = f"https://www.google.com/search?q={quote_plus(query)}&num=10"
        
        headers = {'User-Agent': random.choice(get_user_agents())}
        
        time.sleep(random.uniform(1, 3))
        
        response = requests.get(google_url, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        leaks = []
        for link in soup.find_all('a'):
            href = link.get('href')
            if href and href.startswith('/url?q=https://pastebin.com/'):
                clean_url = href.split('/url?q=')[1].split('&sa=')[0]
                
                if not any(leak['url'] == clean_url for leak in leaks):
                    leaks.append({"url": clean_url, "snippet": "Click link to view potential leak."})
                    
        print(json.dumps({"leaks_found": leaks}, indent=2))
        
    except Exception as e:
        log_error(e)
        print(json.dumps({"status": "error", "message": str(e)}))

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        if not input_data:
            raise ValueError("No data received from stdin.")
        keywords = json.loads(input_data)
        main(keywords)
    except Exception as e:
        log_error(e)
        print(json.dumps({"status": "error", "message": "Failed to read keywords from stdin."}))