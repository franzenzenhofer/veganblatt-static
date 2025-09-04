#!/usr/bin/env python3

import base64
import os
from pathlib import Path

# Paths
script_dir = Path(__file__).parent
public_dir = script_dir.parent / "public"

# Base64 encoded 16x16 PNG icon (simple green leaf)
icon_16x16_base64 = """
iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA
BGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8
AAAAs0lEQVQ4y62TMQ6CMBSGv5YYB0fP4OQBXLyBN3H0Bk4ewMmzeAYHEyehLaUttKUFTPomGvr+
933vvQJ4CCFQSqGUAsAwDISgWZalvuu67rqum6Zp8jyPEAJN08Q5J8uyLIqiKMtyXdeNMea6rrMx
xlhrcc7x3jPGuK7r6rquq6oqy7IsyzJjDGMMay3ee8YYQoiZMeacc865ruvqum6apmmaJudcCMEY
wxjz/4P3fvHeL/4A3wFGTkrJedkAAAAASUVORK5CYII=
"""

# Base64 encoded 32x32 PNG icon
icon_32x32_base64 = """
iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAA
BGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8
AAABjElEQVRYw+2WPUsDQRCGn5O7JAiCoCIWFoKFhY2NjY2NjY2tv0CwsLCwsLCwsLCwsfEPWFjY
2NjY2FhYWFhYWAiCIAiCIAhCcs7d7u3t3t5dkgvkDQwM7O7szDwz8+7MLoRERDDGYIwBIAiCKDLG
MMYYxpjleZ7neZ7neV7VdV3XdV23bdu2bduyLMuyrOl0Op1Op9PhcDgcDofDsixLCIEQAiEEAEEQ
BEEQBEEQhGEYhmEYhmE4n8/n8/l8Pp9Pp9PpdDqdTqfTyWQymUwmk8lkMplMJpPJZDKZTCaTyWQy
mUxGKaWUUkoppZRSSik1m81ms9lsNpvNZrNZz/M8z/M8z/M8z6u6ruu6ruu6ruu6ruM4juM4juM4
juM4juM4juM4juM4juM4jqOUUkoplU6n0+l0Op1Op9PpdDqdTqfT6XQ6nU6n02mlVCKRSCQSiUQi
kUgkEolEIpFIxGIxABzHcRzHcRzHcRzHcZxqtVqtVqvVarVarVar1Wq1Wq2qqqqqqqqqLi8vL/8B
+AFhjEcK5vRgTQAAAABJRU5ErkJggg==
"""

# Create simple base64-encoded versions for other sizes (using 32x32 as template)
icons = {
    "favicon-16x16.png": icon_16x16_base64,
    "favicon-32x32.png": icon_32x32_base64,
    "apple-touch-icon.png": icon_32x32_base64,  # Will be scaled by browser
    "android-chrome-192x192.png": icon_32x32_base64,  # Will be scaled by browser
    "android-chrome-512x512.png": icon_32x32_base64,  # Will be scaled by browser
}

# Simple ICO file (contains 16x16 and 32x32 PNGs)
ico_base64 = """
AAABAAIAEBAAAAEAIABoBAAAJgAAACAgAAABACAAqAgAAI4EAAAoAAAAEAAAACAAAAABACAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHaKHgB2ih4PdooemXaKHul2ih75
dooe+XaKHul2ih6ZdooeD3aKHgAAAAAAAAAAAAAAAAAAAAAAAAAAAHaKHgB2ih5fdooe4naKHv92
ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7idooeX3aKHgAAAAAAAAAAAAB2ih4Adooef3aKHv92
ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooef3aKHgAAAAAAdooeD3aK
Hud2ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7ndooe
D3aKHgB2ih6Xdooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/
dooe/3aKHpd2ih4Adooe2XaKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92
ih7/dooe/3aKHv92ih7Zdooeh3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aK
Hv92ih7/dooe/3aKHv92ih7/dooeh3aKHsd2ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe
/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHsd2ih7ndooe/3aKHv92ih7/dooe/3aKHv92ih7/
dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7ndooe93aKHv92ih7/dooe/3aKHv92
ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe93aKHud2ih7/dooe/3aK
Hv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHud2ih7Hdooe
/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7H
dooeh3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92
ih7/dooeh3aKHgB2ih7Zdooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe/3aK
Hv92ih7/dooe/3aKHtl2ih4AdooeAHaKHpd2ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe
/3aKHv92ih7/dooe/3aKHv92ih6XdooeAAAAAAAAAAAAAAAAAHaKHg92ih7ndooe/3aKHv92ih7/
dooe/3aKHv92ih7/dooe/3aKHv92ih7ndooeD3aKHgAAAAAAAAAAAAAAAAAAAAAAAAAAAHaKHgB2
ih5/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooef3aKHgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAgAAAAQAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB2ih4A
dooeAHaKHg92ih4fdooeP3aKHl92ih5/dooeP3aKHl92ih4fdooeP3aKHg92ih4AdooeAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAdooeAHaKHg92ih4/dooen3aKHt92ih7/dooe/3aKHv92ih7/dooe/3aKHv92ih7/dooe
/3aKHt92ih6fdooeP3aKHg92ih4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
"""

def main():
    print("🎨 Generating icon files...\n")
    
    # Generate PNG files
    for filename, base64_data in icons.items():
        file_path = public_dir / filename
        png_data = base64.b64decode(base64_data.strip())
        file_path.write_bytes(png_data)
        print(f"✅ Generated: {filename}")
    
    # Generate favicon.ico
    ico_path = public_dir / "favicon.ico"
    ico_data = base64.b64decode(ico_base64.strip())
    ico_path.write_bytes(ico_data)
    print(f"✅ Generated: favicon.ico")
    
    print("\n✨ All icons generated successfully!")

if __name__ == "__main__":
    main()