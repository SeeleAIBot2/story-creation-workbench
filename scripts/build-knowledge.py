"""Rebuild the public, bundled knowledge from the unchanged skill sources."""
import json, re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
paths=[root/'skill/SKILL.md',root/'skill/CHANGELOG-v1.2.md',*sorted((root/'skill/references').glob('*.md'))]
docs=[]
for p in paths:
    text=p.read_text()
    title=re.search(r'^# (.+)',text,re.M).group(1)
    docs.append(dict(id=p.stem,title=title,path=p.relative_to(root).as_posix(),text=text))
female=(root/'skill/references/female-short-drama.md').read_text()
cards=[]
for m in re.finditer(r'^### (\d{2}) ([^\n]+)\n(.*?)(?=^### |^## |\Z)',female,re.M|re.S):
    cards.append(dict(id=m[1],title=m[2],text=m[3].strip()))
tax=(root/'skill/references/genre-taxonomy.md').read_text()
groups=[]
for m in re.finditer(r'^### ([^\n]+)\n(.*?)(?=^### |^## |\Z)',tax,re.M|re.S):
    title=m[1]; body=m[2].strip(); num=re.match(r'(\d{2})\. (.+)',title)
    if num:
        for row in body.splitlines():
            bm=re.match(r'- \*\*(.+?)：\*\*(.+)',row)
            if bm: groups.append(dict(id=num[1]+'-'+str(len(groups)),title=num[2]+' / '+bm[1],genre=num[1],layer=bm[1],terms=[x.strip() for x in re.split('[、，]',bm[2]) if x.strip()]))
    else:
        line=next((x for x in body.splitlines() if x.strip()),'')
        groups.append(dict(id='appendix-'+str(len(groups)),title=title,genre='',layer=title,terms=[x.strip() for x in re.split('[、，]',line) if x.strip()]))
assert len(docs)==16 and len(cards)==23
out={'documents':docs,'cards':cards,'taxonomy':groups}
(root/'assets/knowledge.js').write_text('/* Generated only from the public skill/ directory. */\nwindow.WorkbenchKnowledge = '+json.dumps(out,ensure_ascii=False,indent=2)+';\n')
print(len(docs),'documents;',len(cards),'cards;',len(groups),'taxonomy groups;',sum(len(g['terms']) for g in groups),'placed tags')
