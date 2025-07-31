import requests
import random
import sys
import json
import time
from bs4 import BeautifulSoup
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, NoSuchElementException

SITES_DATA = {
    # --- Tier 1 (Professional/Technical) - Primarily Selenium ---
    "GitHub": {
        "url": "https://github.com/{}",
        "method": "selenium",
        "high_confidence_selector": "h1.vcard-names-container span.p-nickname"
    },
    "LinkedIn": {
        "url": "https://www.linkedin.com/in/{}",
        "method": "selenium",
        "high_confidence_selector": "h1.text-heading-xlarge",
        "not_found_string": "Profile not found"
    },
    "Stack Overflow": {
        "url": "https://stackoverflow.com/users/{}",
        "method": "requests",
        "error_strings": ["Page Not Found", "User not found"],
        "positive_indicators": ["reputation", "answers", "questions"]
    },
    "HackerRank": {
        "url": "https://www.hackerrank.com/profile/{}",
        "method": "requests",
        "error_strings": ["We could not find the page you were looking for"],
        "positive_indicators": ["Badges", "Skills", "Certificates"]
    },
    "Kaggle": {
        "url": "https://www.kaggle.com/{}",
        "method": "requests",
        "error_strings": ["404 Page", "User not found"],
        "positive_indicators": ["Competitions", "Datasets", "Notebooks"]
    },
    "Dev.to": {
        "url": "https://dev.to/{}",
        "method": "requests",
        "error_strings": ["Page not found"],
        "positive_indicators": ["posts published", "comments written"]
    },
    "Replit": {
        "url": "https://replit.com/@{}",
        "method": "selenium",
        "high_confidence_selector": "h1[data-cy='user-name']"
    },
    "Keybase": {
        "url": "https://keybase.io/{}",
        "method": "requests",
        "error_strings": ["User not found"],
        "positive_indicators": ["public keys", "Proofs", "Devices"]
    },

    # --- Tier 2 (Social/Content) - Primarily Selenium ---
    "Twitter": {
        "url": "https://twitter.com/{}",
        "method": "selenium",
        "high_confidence_selector": "div[data-testid='UserName'] span",
        "not_found_string": "This account doesn't exist"
    },
    "Instagram": {
        "url": "https://www.instagram.com/{}/",
        "method": "selenium",
        "high_confidence_selector": "header h2",
        "not_found_string": "Sorry, this page isn't available"
    },
    "TikTok": {
        "url": "https://www.tiktok.com/@{}",
        "method": "selenium",
        "high_confidence_selector": "h1[data-e2e='user-title']",
        "not_found_string": "Couldn't find this account"
    },
    "Threads": {
        "url": "https://www.threads.com/@{}",
        "method": "selenium",
        "high_confidence_selector": "h1.x1yztblm",
        "not_found_string": "Sorry, this page isn't available"
    },
    "Facebook": {
        "url": "https://www.facebook.com/{}",
        "method": "selenium",
        "high_confidence_selector": "h1[aria-hidden='false']",
        "not_found_string": "This page isn't available"
    },
    "Reddit": {
        "url": "https://www.reddit.com/user/{}",
        "method": "requests",
        "error_strings": ["nobody on Reddit goes by that name", "page not found"],
        "positive_indicators": ["Post Karma", "Comment Karma"]
    },
    "Medium": {
        "url": "https://medium.com/@{}",
        "method": "requests",
        "error_strings": ["Out of nothing, something", "User not found"],
        "positive_indicators": ["Stories", "Following", "Followers"]
    },

    # --- Tier 3 (Other) - Mixed ---
    "Pinterest": {
        "url": "https://www.pinterest.com/{}",
        "method": "selenium",
        "high_confidence_selector": "h1[data-test-id='username']"
    },
    "Twitch": {
        "url": "https://www.twitch.tv/{}",
        "method": "selenium",
        "high_confidence_selector": "h1.tw-title",
        "not_found_string": "content is unavailable"
    },
    "Vimeo": {
        "url": "https://vimeo.com/{}",
        "method": "requests",
        "error_strings": ["The page you were looking for could not be found"],
        "positive_indicators": ["Videos", "Following"]
    },
    "Dribbble": {
        "url": "https://dribbble.com/{}",
        "method": "requests",
        "error_strings": ["Whoops, that page is gone"],
        "positive_indicators": ["Shots", "Followers"]
    },
    "Buy Me A Coffee": {
        "url": "https://www.buymeacoffee.com/{}",
        "method": "requests",
        "error_strings": ["Page not found"],
        "positive_indicators": ["supporters", "memberships"]
    },
    "Quora": {
        "url": "https://www.quora.com/profile/{}",
        "method": "requests",
        "error_strings": ["Page requested is not available"],
        "positive_indicators": ["Answers", "Questions", "Followers"]
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


def validate_with_requests(response_text, site_data):
    response_lower = response_text.lower()
    
    for error in site_data.get("error_strings", []):
        if error.lower() in response_lower:
            return False, "Not Found (Error String)"
    
    positive_count = sum(1 for indicator in site_data.get("positive_indicators", []) if indicator.lower() in response_lower)
    
    if positive_count >= 2:
        return True, f"Found ({positive_count} indicators)"
    
    return False, "Not Found (No strong indicators)"

def validate_with_selenium(driver, site_data):
    try:
        time.sleep(3)
        page_source = driver.page_source.lower()
        
        for error in site_data.get("error_strings", []):
            if error.lower() in page_source:
                return False, "Not Found (Error String)"

        positive_count = sum(1 for indicator in site_data.get("positive_indicators", []) if indicator.lower() in page_source)
        
        if positive_count > 0:
            return True, f"Found ({positive_count} indicators)"
            
        return False, "Not Found (No indicators)"
    except Exception:
        return False, "Validation Error"

def main(username):
    results_lists = []
    
    selenium_driver = None
    try:
        if any(site.get("method") == "selenium" for site in SITES_DATA.values()):
            options = uc.ChromeOptions()
            options.headless = True
            options.add_argument(f"user-agent={random.choice(user_agents)}")
            selenium_driver = uc.Chrome(options=options)

        for site_name, data in SITES_DATA.items():
            url = data["url"].format(username)
            method = data.get("method", "requests")
            
            profile_exists = False
            validation_status = "Unknown"

            try:
                if method == "selenium":
                    if selenium_driver:
                        selenium_driver.get(url)
                        profile_exists, validation_status = validate_with_selenium(selenium_driver, data)
                else:
                    headers = {"User-Agent": random.choice(user_agents)}
                    response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
                    if response.status_code == 200:
                        profile_exists, validation_status = validate_with_requests(response.text, data)

                if profile_exists:
                    results_lists.append({
                        "site": site_name,
                        "url": url,
                        "status": validation_status
                    })
            except Exception as e:
                print(f"Error checking {site_name}: {e}", file=sys.stderr)
                continue
    finally:
        if selenium_driver:
            selenium_driver.quit()
    
    print(json.dumps(results_lists))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        main(sys.argv[1])