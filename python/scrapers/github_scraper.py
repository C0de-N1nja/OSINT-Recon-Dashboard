from bs4 import BeautifulSoup
import requests
import json
import sys
import random

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

    def scrape_github_profile(self, username):
        random_user_agents = random.choice(self.user_agents)

        headers = {
            "User-Agent": random_user_agents
        }

        bio_text_str = ""
        org_text_str = ""
        location_text_str = ""
        website_text_str = ""
        followers_count_str = ""
        following_count_str = ""

        social_media_dict = {
            "facebook": "", "snapchat": "", "instagram": "", "threads": "",
            "twitter": "", "linkedin": "", "tiktok": "", "reddit": "",
            "discord": "", "youtube": ""
        }

        url = f"https://github.com/{username}"

        try:    
            response = requests.get(url, headers=headers, timeout=8)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")
            bio_element = soup.select_one(".user-profile-bio")
            organization_element = soup.select_one("span.p-org")
            location_element = soup.select_one("span.p-label")
            website_link_element = soup.select_one("li[itemprop='url'] a")
            all_links_elements = soup.select("a.Link--primary.wb-break-all")
            followers_element = soup.select_one("a[href$='?tab=followers'] span.text-bold")
            following_element = soup.select_one("a[href$='?tab=following'] span.text-bold")

            if website_link_element:
                found_url = website_link_element.get('href', '').strip()
                
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

            if bio_element:
                bio_text_str = bio_element.get_text(strip=True)
            else:
                bio_text_str = ""
            
            if organization_element:
                org_text_str = organization_element.get_text(strip=True)
            else:
                org_text_str = ""

            if location_element:
                location_text_str = location_element.get_text(strip=True)
            else:
                location_text_str = ""

            if followers_element:
                followers_count_str = followers_element.get_text(strip=True)
            else:
                followers_count_str = ""
            
            if following_element:
                following_count_str = following_element.get_text(strip=True)
            else:
                following_count_str = ""
            
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
            "social_media": social_media_dict
        }

        return output_data

if __name__ == "__main__":
    if len(sys.argv) > 1:
        username = sys.argv[1]
        
        scraper = ProfileScraper()
        
        result = scraper.scrape_github_profile(username)
    
        print(json.dumps(result, indent=2, ensure_ascii=False))
