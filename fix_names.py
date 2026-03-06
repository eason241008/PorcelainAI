import json

json_path = '/home/wsy/final_proj/PorcelainAI/styles.json'
with open(json_path, 'r', encoding='utf-8') as f:
    styles_data = json.load(f)

# Create a mapping of filename to displayName
name_map = {}
for s in styles_data:
    filename = s['filename']
    basename = filename.split('.')[0]
    name_map[basename] = s.get('displayName', '')

constants_path = '/home/wsy/final_proj/PorcelainAI/constants.ts'
with open(constants_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "title: '碎片 " in line:
        for basename, display_name in name_map.items():
            if f"id: '{basename}'" in line:
                line = line.replace(f"title: '碎片 {basename}'", f"title: '碎片 - {display_name}'")
                line = line.replace("era: '未知'", f"era: '{display_name}'") # Put region in era temporarily or something showing the region
                break
    new_lines.append(line)

with open(constants_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Updated constants.ts with display names!")
