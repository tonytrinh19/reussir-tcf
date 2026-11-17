"""Extract EE prompts from the already imported PDFs (requires pdfplumber).
Keeps original combinations; unpaired monthly tasks stay independent choices.
"""
import json, re, unicodedata
from pathlib import Path
import pdfplumber
SITE = Path(__file__).resolve().parents[1] / 'site'
TASK = re.compile(r'^T[âa]che\s*([123])\s*[:.]?$', re.I)
COMBO = re.compile(r'^Combinaison\s*(\d*)\s*[:.]?$', re.I)
DOC = re.compile(r'^Document\s*([12])\s*[:.]?$', re.I)
def clean(text):
    text = unicodedata.normalize('NFKC', text)
    text = re.sub(r'(?<=[a-zéèà])X(?=[a-zéèà])', 'ff', text)
    # Some subsets map the ff ligature to a/b. Only known corrupted words are repaired.
    fixes = {'ebet':'effet','eaet':'effet','ebets':'effets','eaets':'effets',
             'oarir':'offrir','oare':'offre','oarant':'offrant','oarent':'offrent',
             'diaérentes':'différentes','dibérentes':'différentes','dibérente':'différente',
             'diaéremment':'différemment','diaérents':'différents','dibérents':'différents',
             'diaérences':'différences','dibérences':'différences','diaicile':'difficile',
             'dibicile':'difficile','diaiculté':'difficulté','diaicultés':'difficultés',
             'diauser':'diffuser','dibuser':'diffuser','diausion':'diffusion','dibusion':'diffusion',
             'insubisants':'insuffisants'}
    return re.sub(r'\b[^\W\d_]+\b', lambda m: fixes.get(m[0], m[0]), text).strip()
def is_title(line):
    words=re.findall(r"[A-Za-zÀ-ÿ]+",line['text'])
    return not line['text'].startswith('Opinion') and line['bold'] and line['gap']>=8 and words and sum(w[0].isupper() for w in words)/len(words)>.55 and len(line['text'])<160
def lines(file):
    out=[]
    with pdfplumber.open(file) as pdf:
        for page_no, page in enumerate(pdf.pages, 1):
            prev=None
            for l in page.extract_text_lines():
                text=clean(l['text']);gap=l['top']-prev if prev is not None else 0;prev=l['bottom']
                if 'VIETPHAPAAU.COM' in text or re.match(r'^Expression Écrite',text,re.I) or re.fullmatch(r'\d{2}/\d{2}/\d{4}',text): continue
                bold=sum('bold' in c['fontname'].lower() for c in l['chars'])/max(1,len(l['chars']))>.8
                out.append(dict(text=text,page=page_no,gap=gap,bold=bold))
    return out
catalog=json.loads((SITE/'exam-sources/catalog.json').read_text())
papers=[];tasks={k:[] for k in ['t1','t2','t3']};gaps=[];counts={}
for source in [c for c in catalog if c['skill']=='ee']:
    ls=lines(SITE/source['pdf']);has_combo=any(COMBO.match(l['text']) for l in ls)
    corrected=any(l['text'].lower().startswith('correction tâche') for l in ls)
    grouped=not has_combo and not corrected
    blocks=[];block={'number':None,'parts':{}};task=None;correction=False
    for l in ls:
        t=l['text'];m=COMBO.match(t)
        if m:
            if block['parts']:blocks.append(block)
            block={'number':int(m[1]) if m[1] else len(blocks)+1,'parts':{}};task=None;correction=False;continue
        m=TASK.match(t)
        if m:task='t'+m[1];block['parts'][task]=[];correction=False;continue
        if re.match(r'^Correction\s+T[âa]che',t,re.I):correction=True;continue
        if task and not correction and not t.startswith('Attention, ces contenus'):block['parts'][task].append(l)
    if block['parts']:blocks.append(block)
    serial={k:0 for k in tasks};counts[source['id']]={}
    for block in blocks:
        selected={}
        for task,ls in block['parts'].items():
            segments=[]
            if task!='t3':
                for l in ls:
                    if not segments or (grouped and (l['gap']>=8 or re.match(r'^\d+\s*[-.)]',l['text']))):segments.append([])
                    segments[-1].append(l)
            elif grouped:
                # A new bold topic heading after document 2 starts another independent subject.
                for l in ls:
                    if not segments or (is_title(l) and not DOC.match(l['text']) and not any(DOC.match(x['text']) for x in segments[-1])):
                        # Before any documents, consecutive bold headings may be topics with missing documents.
                        segments.append([])
                    elif is_title(l) and not DOC.match(l['text']) and any(DOC.match(x['text']) and DOC.match(x['text'])[1]=='2' for x in segments[-1]):segments.append([])
                    segments[-1].append(l)
            else:segments=[ls] if ls else []
            valid=[]
            for seg in segments:
                q=[];docs={1:[],2:[]};part=0
                for l in seg:
                    m=DOC.match(l['text'])
                    if m:part=int(m[1]);continue
                    (q if not part else docs[part]).append(l['text'])
                prompt=re.sub(r'^\d+\s*[-.)]\s*','',' '.join(q)).strip()
                if task=='t3' and not prompt and all(docs.values()):prompt='Comparez les deux points de vue ci-dessous, puis donnez votre opinion sur le sujet.'
                if not prompt or (task=='t3' and not all(docs.values())):
                    gaps.append({'source':source['id'],'combination':block['number'],'task':task,'reason':'Consigne ou document absent','topic':prompt});continue
                serial[task]+=1
                item={'id':f"{source['id']}-{task}-{serial[task]}",'q':prompt,'source':{'id':source['id'],'title':source['title'],'pdf':source['pdf'],'page':seg[0]['page']}}
                if task=='t3':item['docs']=[{'who':'','text':' '.join(docs[i])} for i in [1,2]]
                tasks[task].append(item);valid.append(item)
            if not valid and not segments:gaps.append({'source':source['id'],'combination':block['number'],'task':task,'reason':'Consigne absente'})
            if len(valid)==1:selected[task]=valid[0]['id']
        if set(selected)==set(tasks) and (not grouped or all(serial[t]==1 for t in tasks)):
            number=block['number'];label=re.sub(r'^ĐỀ PE TCF Canada ', 'Sujet ',source['title'])
            if number is not None:label+=f' · Combinaison {number}'
            papers.append({'id':source['id']+f'-c{number or 1}','title':label,'tasks':selected})
    counts[source['id']]=serial
result={'papers':papers,'tasks':tasks,'gaps':gaps,'sources':counts}
(SITE/'exam-sources/writing.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('Complete combinations:',len(papers),'Tasks:',{k:len(v) for k,v in tasks.items()},'Source gaps:',len(gaps))
for gap in gaps:print(gap)
