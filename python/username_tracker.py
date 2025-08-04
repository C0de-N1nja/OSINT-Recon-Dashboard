import requests
import random
import sys
import json

SITES_DATA = {
    "GitHub": {
        "url": "https://github.com/{}",
        "error_string": "Not Found"
    },
    "GitLab": {
        "url": "https://gitlab.com/{}",
        "error_string": "that page doesn't exist"
    },
    "Stack Overflow": {
        "url": "https://stackoverflow.com/users/{}",
        "error_string": "Page Not Found"
    },
    "HackerRank": {
        "url": "https://www.hackerrank.com/profile/{}",
        "error_string": "We could not find the page you were looking for, so we found something to make you laugh to make up for it." # Use this generic error text
    },
    "Kaggle": {
        "url": "https://www.kaggle.com/{}",
        "error_string": "404 Page"
    },
    "Dev.to": {
        "url": "https://dev.to/{}",
        "error_string": "Page not found"
    },
    "Replit": {
        "url": "https://replit.com/@{}",
        "error_string": "User not found"
    },
    "Keybase": {
        "url": "https://keybase.io/{}",
        "error_string": "User not found"
    },
    
    "Twitter": {
        "url": "https://twitter.com/{}",
        "error_string": "Hmm...this page doesn't exist. Try searching for something else."
    },
    "Instagram": {
        "url": "https://www.instagram.com/{}/",
        "error_string": "Sorry, this page isn't available.\nThe link you followed may be broken, or the page may have been removed"
    },
    "TikTok": {
        "url": "https://www.tiktok.com/@{}",
        "error_string": "Couldn't find this page"
    },
    "Threads": {
        "url": "https://www.threads.com/@{}",  
        "error_string": "Page Not Found"
    },
    "Pinterest": {
        "url": "https://www.pinterest.com/{}",  
        "error_string": "Page Not Found"
    },    
    "Reddit": {
        "url": "https://www.reddit.com/user/{}",
        "error_string": "Sorry, nobody on Reddit goes by that name."
    },
    "Medium": {
        "url": "https://medium.com/@{}",
        "error_string": "Out of nothing, something."
    },
    "Twitch": {
        "url": "https://www.twitch.tv/{}",
        "error_string": "Sorry. Unless you've got a time machine, that content is unavailable."
    },
    "Vimeo": {
        "url": "https://vimeo.com/{}",
        "error_string": "The page you were looking for could not be found."
    },
    "Dribbble": {
        "url": "https://dribbble.com/{}",
        "error_string": "Whoops, that page is gone."
    },
    "Buy Me A Coffee": {
        "url": "https://www.buymeacoffee.com/{}",
        "error_string": "Page not found"
    },
    "Quora": {
        "url": "https://www.quora.com/profile/{}",
        "error_string": "Page requested is not available"
    },
    
    "Facebook": {
        "url": "https://www.facebook.com/{}",
        "error_string": "This page isn't available"
    },
    "LinkedIn": {
        "url": "https://www.linkedin.com/in/{}",
        "error_string": "Profile not found"
    }
}

user_agents = [
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

username = sys.argv[1]
results_lists = []

session = requests.Session()

session.headers.update({
    "User-Agent": random.choice(user_agents)
})

for site_name, data in SITES_DATA.items():
    url = data["url"]
    url = url.replace("{}", f"{username}")
    
    try:
        response = session.get(url, timeout=8)
        
        raw_page = response.text
        
        if response.status_code == 200 and data["error_string"].lower() not in response.text.lower():
            results_lists.append({
            "site": site_name,
                "url": url,
                "status": "Found"
            })
    except requests.exceptions.RequestException:
        continue

session.close()

print(json.dumps(results_lists))