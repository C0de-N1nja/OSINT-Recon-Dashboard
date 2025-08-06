import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import re
import time
import json
import sys
import random
import os
import requests 
import base64

class ProfileScraper:
    def __init__(self):
        self.user_agents = [
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
        
        
    def scrape_instagram_profile(self, username):
        """A highly robust Instagram scraper using a hybrid logic for bio extraction."""
        instagram_url = f"https://www.instagram.com/{username}"
        
        options = uc.ChromeOptions()
        options.headless = True
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument(f"user-agent={random.choice(self.user_agents)}")

        driver = None
        
        instagram_data = {
            'url': instagram_url,
            'username': username,
            'display_name': "",
            'profile_pic_url': "",
            'bio_text': "",
            'posts_count': "",
            'followers_count': "",
            'following_count': "",
            'is_private': False,
            'is_verified': False,
            'social_media': { "website": "", "threads": "" },
            'error': None
        }

        def process_bio_content(full_text, instagram_data):
            """Process bio content with advanced filtering"""
            if not full_text:
                return False
                
            lines = [line.strip() for line in full_text.split('\n') if line.strip()]
            
            junk_phrases = [
                'posts', 'followers', 'following', 'follow', 'see translation',
                "© 202"
            ]
            
            cleaned_lines = [
                line for line in lines 
                if not any(phrase in line.lower() for phrase in junk_phrases)
            ]
            
            if not cleaned_lines:
                return False
                
            instagram_data['display_name'] = cleaned_lines[0]
            
            bio_lines_accumulator = []
            for line in cleaned_lines[1:]:
                if line.startswith('@'):
                    handle = line.lstrip('@')
                    instagram_data['social_media']['threads'] = f"https://www.threads.net/@{handle}"
                elif '.' in line and ' ' not in line:
                    url = line.replace('🔗', '').strip()
                    full_url = url if url.startswith('http') else f"https://{url}"
                    instagram_data['social_media']['website'] = full_url
                else:
                    bio_lines_accumulator.append(line)
            
            instagram_data['bio_text'] = "\n".join(bio_lines_accumulator)
            if instagram_data['bio_text']:
                pass
            
            return True

        try:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            driver_path = os.path.join(script_dir, '..', '..', 'drivers', 'chromedriver')
            
            if not os.path.exists(driver_path):
                return { "error": "ChromeDriver executable not found at " + driver_path, "url": instagram_url }
            
            driver = uc.Chrome(options=options, driver_executable_path=driver_path)

            driver.get(instagram_url)
            
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "main, header")))
            time.sleep(random.uniform(2, 4))
            
            try:
                close_button = driver.find_element(By.CSS_SELECTOR, "div[role='dialog'] div > svg[aria-label='Close']")
                close_button.click()
                time.sleep(1)
            except:
                pass

            screenshot_path = f"instagram_debug_{username}.png"
            driver.save_screenshot(screenshot_path)
            
            WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.XPATH, "//li[contains(., 'follower')]")))
            
            header = driver.find_element(By.TAG_NAME, "header")

            # Getting the profile pic            
            try:
                img_el = header.find_element(By.TAG_NAME, "img")
                temp_url = img_el.get_attribute('src')

                response = requests.get(temp_url, timeout=10)
                if response.status_code == 200:
                    b64_string = base64.b64encode(response.content).decode('utf-8')
                    instagram_data['profile_pic_url'] = f"data:image/jpeg;base64,{b64_string}"
            except Exception: 
                pass

            try:
                list_items = header.find_elements(By.TAG_NAME, "li")
                for item in list_items:
                    text = item.text.lower()
                    count_match = re.search(r'([\d,.]+[KMB]?)', text)
                    if not count_match: 
                        continue
                    count = count_match.group(1)
                    if 'post' in text: 
                        instagram_data['posts_count'] = count
                    elif 'follower' in text: 
                        instagram_data['followers_count'] = count
                    elif 'following' in text: 
                        instagram_data['following_count'] = count
            except Exception as e:
                pass

            extraction_successful = False
            
            # Strategy 1: Original approach - header ul + div
            try:
                bio_container = driver.find_element(By.CSS_SELECTOR, "header ul + div")
                full_text = driver.execute_script("return arguments[0].innerText;", bio_container)
                
                if process_bio_content(full_text, instagram_data):
                    extraction_successful = True
                else:
                    pass

            except Exception as e:
                pass

            # Strategy 2: Look for section elements in header
            if not extraction_successful:
                try:
                    sections = driver.find_elements(By.CSS_SELECTOR, "header section")
                    for i, section in enumerate(sections):
                        full_text = driver.execute_script("return arguments[0].innerText;", section)
                        if full_text and not re.search(r'^\d+\s*(post|follower|following)', full_text.lower()):
                            if process_bio_content(full_text, instagram_data):
                                extraction_successful = True
                                break
                            
                except Exception as e:
                    pass

            # Strategy 3: Look for div elements that might contain bio
            if not extraction_successful:
                try:
                    divs = driver.find_elements(By.CSS_SELECTOR, "header div")
                    for div in divs:
                        full_text = driver.execute_script("return arguments[0].innerText;", div)
                        
                        if (full_text and 
                            len(full_text.strip()) > 5 and
                            not re.search(r'^\d+\s*(post|follower|following)', full_text.lower()) and
                            not full_text.lower().strip() in ['posts', 'followers', 'following']):
                            
                            if process_bio_content(full_text, instagram_data):
                                extraction_successful = True
                                break
                            
                except Exception as e:
                    pass

            # Strategy 4: Try to extract from page title as fallback for display name
            if not extraction_successful or not instagram_data['display_name']:
                try:
                    title = driver.title
                    if title and title != "Instagram":
                        if "(@" in title and ")" in title:
                            display_name = title.split("(@")[0].strip()
                            if display_name and not instagram_data['display_name']:
                                instagram_data['display_name'] = display_name
                                extraction_successful = True
                            
                except Exception as e:
                    pass

            # Strategy 5: Last resort - search all text content in header
            if not extraction_successful:
                try:
                    header_text = driver.execute_script("return arguments[0].innerText;", header)
                    
                    if header_text:
                        lines = [line.strip() for line in header_text.split('\n') if line.strip()]
                        
                        for line in lines:
                            if (line and 
                                len(line) < 50 and
                                not re.search(r'\d+\s*(post|follower|following)', line.lower()) and
                                not line.lower() in ['posts', 'followers', 'following', 'post', 'follower'] and
                                not line.startswith('http') and
                                not line.replace('.', '').replace(',', '').isdigit()):
                                
                                if not instagram_data['display_name']:
                                    instagram_data['display_name'] = line
                                    extraction_successful = True
                                    break
                            
                except Exception as e:
                    pass

            page_source = driver.page_source
            if 'This Account is Private' in page_source:
                instagram_data['is_private'] = True
            if driver.find_elements(By.CSS_SELECTOR, "svg[aria-label='Verified']"):
                instagram_data['is_verified'] = True
            
        except Exception as e:
            error_msg = str(e)
            instagram_data["error"] = error_msg
        finally:
            if driver:
                driver.quit()
        
        return instagram_data
    
if __name__ == "__main__":
    if len(sys.argv) > 1:
        username = sys.argv[1]
        
        scraper = ProfileScraper()
        
        result = scraper.scrape_instagram_profile(username)
    
        print(json.dumps(result, indent=2, ensure_ascii=False))
