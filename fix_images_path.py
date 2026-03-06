import json

constants_path = '/home/wsy/final_proj/PorcelainAI/constants.ts'
with open(constants_path, 'r', encoding='utf-8') as f:
    constants_content = f.read()

# Modify /images/ to /images/style/ in constants.ts
constants_content = constants_content.replace("url: '/images/", "url: '/images/style/")

with open(constants_path, 'w', encoding='utf-8') as f:
    f.write(constants_content)

print("Updated constants.ts")
