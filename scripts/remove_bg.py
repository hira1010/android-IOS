from PIL import Image
import os

def remove_bg(p):
    if not os.path.exists(p): return
    img = Image.open(p).convert('RGBA')
    datas = img.getdata()
    newData = []
    for item in datas:
        r, g, b, a = item
        # 白や明るいグレーの市松模様を透過
        if (r > 190 and g > 190 and b > 190) or (abs(r-g)<15 and abs(g-b)<15 and r > 100):
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    img.putdata(newData)
    img.save(p, 'PNG')

remove_bg('assets/images/player.png')
remove_bg('assets/images/enemy.png')
