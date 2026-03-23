import requests
from bs4 import BeautifulSoup
# Product URL as input
def scrape_product(url):
    headers = {
        # without this -> many sites block you
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "en-US,en;q=0.9" 
    }
    #opening the website programmatically
    response = requests.get(url, headers=headers)
    #now u can search inside HTML
    #print(response.text[:1000])
    soup = BeautifulSoup(response.content, "html.parser")
    #safe first step
    title = soup.find("span", {"id": "productTitle"})
    #clean the data
    if title:
        product_name = title.text.strip()
        if "Amazon.in" in product_name:
            product_name = product_name.split("Amazon.in")[0].strip()
    else:
        product_name = "No title found"


    return{
        "name": product_name
    }
    