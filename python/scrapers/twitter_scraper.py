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
        
    def scrape_twitter_profile(self, username):
        twitter_url = f"https://www.twitter.com/{username}"
        options = uc.ChromeOptions()
        options.headless = True
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1920,1080")
        options.add_argument(f"user-agent={random.choice(self.user_agents)}")
        
        driver = None
        twitter_data = {
            'url': twitter_url,
            'display_name': "",
            'username_handle': "",
            'bio_text': "",
            'location': "",
            'website': "",
            'join_date': "",
            'birth_date': "",
            'following_count': "",
            'followers_count': "",
            'verified_badge': False,
            'profile_pic_url': "",
            'error': None
        }
        
        try: 
            script_dir = os.path.dirname(os.path.abspath(__file__))
            driver_path = os.path.join(script_dir, '..', '..', 'drivers', 'chromedriver')
            
            if not os.path.exists(driver_path):
                return { "error": "ChromeDriver executable not found at " + driver_path, "url": twitter_url }
            
            driver = uc.Chrome(options=options, driver_executable_path=driver_path)


            
            driver.set_page_load_timeout(30)
            driver.set_script_timeout(20)
            
            driver.get(twitter_url)
            
            wait = WebDriverWait(driver, 15)
            
            try:
                display_name_element = wait.until(EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "div[data-testid='UserName'] span")
                ))
                display_name_text = display_name_element.get_attribute("innerText").strip()
                twitter_data['display_name'] = display_name_text.split('\n')[0].strip() 
            except Exception as e:
                pass

            try:
                username_area = driver.find_element(By.CSS_SELECTOR, "div[data-testid='UserName']")
                username_spans = username_area.find_elements(By.TAG_NAME, "span")
                for span in username_spans:
                    span_text = span.get_attribute("innerText").strip()
                    if span_text.startswith('@'):
                        twitter_data['username_handle'] = span_text
                        break
            except Exception as e:
                pass
            
            try:
                avatar_container = wait.until(EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "div[data-testid*='UserAvatar']")
                ))
                img_element = avatar_container.find_element(By.TAG_NAME, "img")
                
                pic_url = img_element.get_attribute("src")
                clean_pic_url = re.sub(r'_\w+\.(jpg|png|webp)$', '.\\1', pic_url)
                twitter_data['profile_pic_url'] = clean_pic_url
            except Exception as e:
                pass
 
            try:
                bio_element = wait.until(EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "div[data-testid='UserDescription']")
                ))
                twitter_data['bio_text'] = bio_element.get_attribute("innerText").strip()
            except Exception as e:
                pass

            try:
                following_link = wait.until(EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "a[href$='/following']")
                ))
                following_text = following_link.get_attribute("innerText").strip()
                following_match = re.search(r'(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)', following_text)
                twitter_data['following_count'] = following_match.group(1) if following_match else "0"
            except Exception as e:
                pass
            
            try:
                followers_selectors = [
                    "a[href$='/verified_followers']",
                    "a[href$='/followers']", 
                    "a[href*='/followers']"
                ]
                followers_found = False
                for selector in followers_selectors:
                    try:
                        followers_link = driver.find_element(By.CSS_SELECTOR, selector) 
                        followers_text = followers_link.get_attribute("innerText").strip()
                        followers_match = re.search(r'(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)', followers_text)
                        if followers_match:
                            twitter_data['followers_count'] = followers_match.group(1)
                            followers_found = True
                            break
                    except:
                        continue
                if not followers_found:
                    raise Exception("None of the followers selectors worked or element not found")
            except Exception as e:
                pass

            try:
                location_element = wait.until(EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "span[data-testid='UserLocation'] span")
                ))
                twitter_data['location'] = location_element.get_attribute("innerText").strip()
            except Exception as e:
                pass

            try:
                website_element = wait.until(EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "a[data-testid='UserUrl']")
                ))
                twitter_data['website'] = website_element.get_attribute("href").strip()
            except Exception as e:
                pass

            try:
                join_date_element = wait.until(EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "span[data-testid='UserJoinDate'] span")
                ))
                twitter_data['join_date'] = join_date_element.get_attribute("innerText").strip()
            except Exception as e:
                pass

            try:
                birth_date_element = wait.until(EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "span[data-testid='UserBirthdate'] span")
                ))
                twitter_data['birth_date'] = birth_date_element.get_attribute("innerText").strip()
            except Exception as e:
                pass

            try:
                driver.find_element(By.CSS_SELECTOR, "svg[data-testid='icon-verified']")
                twitter_data['verified_badge'] = True
            except Exception:
                pass

        except Exception as e:
            twitter_data["error"] = f"Scrape failed: {str(e)}" 
            
            try:
                screenshot_filename = f"twitter_profile_scrape_error_{username}_{int(time.time())}.png"
                driver.save_screenshot(screenshot_filename) 
            except Exception as screenshot_error:
                pass

        finally:
            if driver:
                try:
                    driver.quit()
                except Exception as quit_error:
                    pass
        
        return twitter_data

if __name__ == "__main__":
    if len(sys.argv) > 1:
        username = sys.argv[1]
        
        scraper = ProfileScraper()
        
        result = scraper.scrape_twitter_profile(username)
    
        print(json.dumps(result, indent=2, ensure_ascii=False))
