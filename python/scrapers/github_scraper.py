from bs4 import BeautifulSoup
import requests
import json
import sys
import random
import time

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

    def extract_with_fallbacks(self, soup, selectors_list, debug_field=None):
        for i, selector in enumerate(selectors_list):
            try:
                element = soup.select_one(selector)
                if element:
                    text = element.get_text(strip=True)
                    if text:
                        if debug_field:
                            print(f"[DEBUG] {debug_field}: Found with selector #{i}: '{selector}' -> '{text[:50]}...'", file=sys.stderr)
                        return text
            except Exception as e:
                if debug_field:
                    print(f"[DEBUG] {debug_field}: Selector '{selector}' failed: {e}", file=sys.stderr)
                continue
        
        if debug_field:
            print(f"[DEBUG] {debug_field}: All selectors failed", file=sys.stderr)
        return ""

    def scrape_github_profile(self, username, debug=False):
        random_user_agents = random.choice(self.user_agents)

        headers = {
            "User-Agent": random_user_agents,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }

        social_media_dict = {
            "facebook": "", "snapchat": "", "instagram": "", "threads": "",
            "twitter": "", "linkedin": "", "tiktok": "", "reddit": "",
            "discord": "", "youtube": ""
        }

        url = f"https://github.com/{username}"

        try:    
            time.sleep(random.uniform(1, 3))
            
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()

            if debug:
                print(f"[DEBUG] Response status: {response.status_code}", file=sys.stderr)
                print(f"[DEBUG] Response length: {len(response.text)}", file=sys.stderr)

            soup = BeautifulSoup(response.text, "html.parser")

            bio_selectors = [
                '[data-bio-text]',
                '.p-note.user-profile-bio div',
                '.p-note.user-profile-bio',
                '.user-profile-bio .p-note',
                '.js-profile-editable-area .p-note',
                '[data-target="user-profile-frame.bioText"]',
                '.h-card .p-note',
                'div[data-bio-text]',
                '.profile-bio',
                '.bio .p-note'
            ]

            org_selectors = [
                '[itemprop="worksFor"]',
                'span.p-org div',
                'span.p-org',
                '[data-test-selector="profile-company-link"]',
                '.vcard-detail[itemprop="worksFor"]',
                '.vcard-detail .p-org',
                'li[itemprop="worksFor"] span',
                'li[itemprop="worksFor"]'
            ]

            location_selectors = [
                '[itemprop="homeLocation"]',
                'span.p-label',
                '[data-test-selector="profile-location"]',
                '.vcard-detail[itemprop="homeLocation"]',
                '.vcard-detail .p-label',
                'li[itemprop="homeLocation"] span',
                'li[itemprop="homeLocation"]',
                '.octicon-location + span'
            ]

            website_selectors = [
                'li[itemprop="url"] a',
                '[data-test-selector="profile-website-url"]',
                '.vcard-detail[itemprop="url"] a',
                '.vcard-detail a[rel="nofollow me"]',
                'a.Link--primary[rel="nofollow me"]'
            ]

            followers_selectors = [
                'a[href$="?tab=followers"] .text-bold',
                'a[href$="?tab=followers"] strong',
                f'a[href="/{username}?tab=followers"] .text-bold',
                f'a[href="/{username}?tab=followers"] strong',
                '.js-profile-editable-area a[href*="followers"] .text-bold'
            ]

            following_selectors = [
                'a[href$="?tab=following"] .text-bold',
                'a[href$="?tab=following"] strong',
                f'a[href="/{username}?tab=following"] .text-bold',
                f'a[href="/{username}?tab=following"] strong',
                '.js-profile-editable-area a[href*="following"] .text-bold'
            ]

            bio_text_str = self.extract_with_fallbacks(soup, bio_selectors, "BIO" if debug else None)
            org_text_str = self.extract_with_fallbacks(soup, org_selectors, "ORG" if debug else None)
            location_text_str = self.extract_with_fallbacks(soup, location_selectors, "LOCATION" if debug else None)
            followers_count_str = self.extract_with_fallbacks(soup, followers_selectors, "FOLLOWERS" if debug else None)
            following_count_str = self.extract_with_fallbacks(soup, following_selectors, "FOLLOWING" if debug else None)
            
            profile_pic_url_str = ""
            try:
                img_tag = soup.select_one("img.avatar-user")
                if img_tag and img_tag.has_attr('src'):
                    profile_pic_url_str = img_tag['src']
            except Exception as e:
                if debug:
                    print(f"[DEBUG] Profile Pic Selector failed: {e}", file=sys.stderr)

            website_text_str = ""
            website_element = None
            
            for selector in website_selectors:
                try:
                    website_element = soup.select_one(selector)
                    if website_element:
                        break
                except:
                    continue

            if website_element:
                found_url = website_element.get('href', '').strip()
                
                if "facebook.com" in found_url:
                    social_media_dict["facebook"] = found_url
                elif "instagram.com" in found_url:
                    social_media_dict["instagram"] = found_url
                elif "snapchat.com" in found_url:
                    social_media_dict["snapchat"] = found_url
                elif "threads.net" in found_url:
                    social_media_dict["threads"] = found_url
                elif "twitter.com" in found_url or "x.com" in found_url:
                    social_media_dict["twitter"] = found_url
                elif "linkedin.com" in found_url:
                    social_media_dict["linkedin"] = found_url
                elif "tiktok.com" in found_url:
                    social_media_dict["tiktok"] = found_url
                elif "reddit.com" in found_url:
                    social_media_dict["reddit"] = found_url
                elif "discord.gg" in found_url or "discord.com" in found_url:
                    social_media_dict["discord"] = found_url
                elif "youtube.com" in found_url:
                    social_media_dict["youtube"] = found_url
                else:
                    website_text_str = found_url

            all_links_selectors = [
                "a.Link--primary.wb-break-all",
                "a.Link--primary",
                ".vcard-detail a[rel='nofollow me']",
                ".vcard-details a[href*='://']"
            ]

            for selector in all_links_selectors:
                try:
                    all_links_elements = soup.select(selector)
                    for link in all_links_elements:
                        href = link.get("href", "")
                        if href and href != website_text_str: 
                            if "facebook.com" in href:
                                social_media_dict["facebook"] = href
                            elif "instagram.com" in href:
                                social_media_dict["instagram"] = href
                            elif "snapchat.com" in href:
                                social_media_dict["snapchat"] = href
                            elif "threads.net" in href:
                                social_media_dict["threads"] = href
                            elif "twitter.com" in href or "x.com" in href:
                                social_media_dict["twitter"] = href
                            elif "linkedin.com" in href:
                                social_media_dict["linkedin"] = href
                            elif "tiktok.com" in href:
                                social_media_dict["tiktok"] = href
                            elif "reddit.com" in href:
                                social_media_dict["reddit"] = href
                            elif "discord.gg" in href or "discord.com" in href:
                                social_media_dict["discord"] = href
                            elif "youtube.com" in href:
                                social_media_dict["youtube"] = href
                    break
                except:
                    continue

            if debug:
                print(f"[DEBUG] Final results:", file=sys.stderr)
                print(f"[DEBUG] Bio: '{bio_text_str}'", file=sys.stderr)
                print(f"[DEBUG] Org: '{org_text_str}'", file=sys.stderr)
                print(f"[DEBUG] Location: '{location_text_str}'", file=sys.stderr)
                print(f"[DEBUG] Website: '{website_text_str}'", file=sys.stderr)
                print(f"[DEBUG] Followers: '{followers_count_str}'", file=sys.stderr)
                print(f"[DEBUG] Following: '{following_count_str}'", file=sys.stderr)
            
        except requests.exceptions.RequestException as error:
            error_output = {
                "url": url,
                "error": str(error)
            }
            return error_output

        output_data = {
            "url": url,
            "bio_text": bio_text_str,
            "org": org_text_str,
            "location": location_text_str,
            "website": website_text_str,
            "followers_count": followers_count_str,
            "following_count": following_count_str, 
            "social_media": social_media_dict,
            "profile_pic_url": profile_pic_url_str
        }

        return output_data

if __name__ == "__main__":
    if len(sys.argv) > 1:
        username = sys.argv[1]
        debug = len(sys.argv) > 2 and sys.argv[2] == "--debug"
        
        scraper = ProfileScraper()
        
        result = scraper.scrape_github_profile(username, debug=debug)
    
        print(json.dumps(result, indent=2, ensure_ascii=False))