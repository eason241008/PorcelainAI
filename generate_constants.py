import os
import glob
import re

generate_dir = "/home/wsy/final_proj/PorcelainAI/public/images/generate_image"
content_dir = "/home/wsy/final_proj/PorcelainAI/public/images/content/npm"
style_dir = "/home/wsy/final_proj/PorcelainAI/public/images/style"

import json

content_files = os.listdir(content_dir)

generated_files = os.listdir(generate_dir)
records = []

for filename in generated_files:
    if not filename.endswith('.png') and not filename.endswith('.jpg'): continue
    
    # 1077766_青花番蓮紋洗_style_PJQ0529.png
    match = re.match(r'(.*)_style_(.*)\.png', filename)
    if not match: continue
    
    content_base = match.group(1)
    style_id = match.group(2)
    
    # find content file
    content_id = None
    content_thumb = None
    for cf in content_files:
        if content_base in cf:
            content_id = "vessel_" + cf.split('_')[1] # 假设 id 是这样
            # 这里简化，用原始文件名找
            content_thumb = f"/images/content/npm/{cf}"
            content_id = "npm_" + cf.split('_')[1] # 取中间的数字作为大致匹配的id，和npm_vessels对应
            break
            
    if not content_id:
        # fallback
        content_id = content_base
        content_thumb = f"/images/content/npm/0000_{content_base}.jpg" # fake
        
    style_thumb = f"/images/style/{style_id}.png"
    
    record = f"""  {{
    id: 'res_{content_base}_{style_id}',
    result: '/images/generate_image/{filename}',
    styleThumb: '{style_thumb}',
    contentThumb: '{content_thumb}',
    title: '生成展示 {content_base} + {style_id}',
  }},"""
    records.append(record)

print("export const MOCK_RESTORATIONS = [")
print("\n".join(records))
print("];")
