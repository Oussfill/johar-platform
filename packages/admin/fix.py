import re
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_class = "className={\x0cixed inset-y-0 z-50 transition-transform duration-300 lg:relative lg:translate-x-0 }"
good_class = "className={ixed inset-y-0 z-50 transition-transform duration-300 lg:relative lg:translate-x-0 }"

content = content.replace(bad_class, good_class)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
