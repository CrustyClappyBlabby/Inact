import time
import json
import os
import smtplib
import re # For finding price numbers
from email.message import EmailMessage
from playwright.sync_api import sync_playwright

# --- CONFIGURATION ---
URL = "https://kerebyudlejning.dk/bolig"
MAX_PRICE = 18000  # Listings above this price will be ignored

# EMAIL SETTINGS
EMAIL_SENDER = "ollg4mepl4y@gmail.com"
EMAIL_PASSWORD = "afee lzpk jods dowj" 

# LIST OF PEOPLE TO NOTIFY (Add as many as you want)
EMAIL_RECEIVERS = [
    "oliver@rokkedal.dk",
    "Amalie.simonsenn@gmail.com",
    "Kristina97jakobsen@gmail.com"
]

# MEMORY FILE
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(SCRIPT_DIR, "seen_listings.json")

def load_seen_listings():
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, "w") as f:
            json.dump([], f)
        return []
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_seen_listings(listings):
    with open(DB_FILE, "w") as f:
        json.dump(listings, f)

def extract_price(text):
    # Looks for patterns like "17.500", "17500", "17 500"
    # Returns the first valid number found, or 0 if none
    try:
        # Regex to find numbers that look like prices
        matches = re.findall(r'(\d{1,3}(?:[.,]\d{3})*)', text)
        for match in matches:
            # Clean up the number (remove dots/commas)
            clean_num = match.replace('.', '').replace(',', '')
            price = int(clean_num)
            
            # Basic sanity check: Rent is usually between 2,000 and 100,000
            if 2000 < price < 100000:
                return price
    except:
        pass
    return 0

def send_email(new_listing_url, listing_text, price):
    # Loop through ALL receivers in your list
    for receiver in EMAIL_RECEIVERS:
        msg = EmailMessage()
        msg.set_content(f"\n\nPrice: {price} kr.\nDetaljer: {listing_text}\n\nLink: {new_listing_url}")
        msg["Subject"] = f"Ny lejlighed på Kereby! ({price} kr): {listing_text[:20]}..."
        msg["From"] = EMAIL_SENDER
        msg["To"] = receiver

        try:
            server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.send_message(msg)
            server.quit()
            print(f" -> Email sent to {receiver}")
        except Exception as e:
            print(f" -> Failed to email {receiver}: {e}")

def run():
    print(f"--- Starting Monitor (Max Price: {MAX_PRICE} kr) ---")
    seen_listings = load_seen_listings()
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True) # Set to False if you need to debug
        
        while True:
            try:
                page = browser.new_page()
                print(f"Checking {URL} ...")
                page.goto(URL)
                
                try:
                    page.wait_for_load_state("networkidle", timeout=10000)
                except:
                    pass

                # Handle Cookies
                try:
                    page.get_by_role("button", name="Tillad alle").click(timeout=2000)
                except:
                    pass

                # Extract Listings
                current_listings = page.evaluate('''() => {
                    return Array.from(document.querySelectorAll("a"))
                        .map(a => ({
                            url: a.href,
                            text: a.innerText.replace(/\\n/g, " ").trim()
                        }))
                        .filter(item => item.url.includes("/bolig/"))
                        .filter(item => !item.url.endsWith("/bolig") && !item.url.includes("erhverv"))
                        .filter(item => item.text.length > 5);
                }''')

                new_count = 0
                for item in current_listings:
                    url = item['url']
                    text = item['text']
                    text_lower = text.lower()

                    # 1. Filter: Exclude Reserved/Rented
                    if "reserveret" in text_lower or "udlejet" in text_lower:
                        continue
                    
                    # 2. Filter: Price Check
                    price = extract_price(text)
                    if price > MAX_PRICE:
                        # Skip if price is too high (and non-zero)
                        # We allow price=0 just in case the parser failed, so we don't miss a listing.
                        # If you want to be strict, change to: if price > 0 and price > MAX_PRICE
                        if price > 0: 
                            continue

                    # 3. Check if new
                    if url not in seen_listings:
                        print(f"!!! NEW DEAL FOUND ({price} kr): {text[:30]}...")
                        send_email(url, text, price)
                        seen_listings.append(url)
                        new_count += 1
                
                if new_count > 0:
                    save_seen_listings(seen_listings)
                    print(f"Saved {new_count} new listings.")
                
                page.close()

            except Exception as e:
                print(f"Error: {e}")

            print("Sleeping for 10 minutes...")
            time.sleep(120)

if __name__ == "__main__":
    run()
