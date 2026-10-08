import re

with open('src/components/CustomerDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("`السعر: `$${m.asking_price}`", "`السعر: $${m.asking_price}`")
content = content.replace("`السعر: $$", "`السعر: $${m.asking_price}`") # just in case

with open('src/components/CustomerDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
