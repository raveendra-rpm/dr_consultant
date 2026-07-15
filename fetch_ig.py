import urllib.request
import re
import os

urls = [
    "https://www.instagram.com/dr.divya.singh__/reel/DYm8t0Fxtqx/",
    "https://www.instagram.com/dr.divya.singh__/reel/DY4UxL9xd_y/",
    "https://www.instagram.com/dr.divya.singh__/reel/DZZMIjbxsaM/",
    "https://www.instagram.com/dr.divya.singh__/reel/DZsfxgLSaHC/",
    "https://www.instagram.com/dr.divya.singh__/reel/DZu88qTyTjt/",
    "https://www.instagram.com/dr.divya.singh__/reel/DaVouX-ytMV/",
    "https://www.instagram.com/dr.divya.singh__/reel/DakUrl8Kbwd/",
    "https://www.instagram.com/dr.divya.singh__/reel/DapAOkryO2V/"
]

os.makedirs("images", exist_ok=True)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

for i, url in enumerate(urls):
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            
            match = re.search(r'<meta property="og:image" content="(.*?)"', html)
            if match:
                img_url = match.group(1).replace('&amp;', '&')
                print(f"Reel {i+1}: Found image URL")
                
                img_req = urllib.request.Request(img_url, headers=headers)
                with urllib.request.urlopen(img_req) as img_resp:
                    with open(f"images/reel{i+1}.jpg", "wb") as f:
                        f.write(img_resp.read())
                print(f"Reel {i+1}: Downloaded")
            else:
                print(f"Reel {i+1}: og:image not found")
    except Exception as e:
        print(f"Reel {i+1}: Error - {e}")
