const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function boot(storage){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://workbench.test/',runScripts:'outside-only'}),w=dom.window;
 w.confirm=()=>true;w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};
 if(storage)w.localStorage.setItem('story-workbench.local-projects.v1',storage);
 for(const f of ['knowledge','core','app'])w.eval(fs.readFileSync(path.join(root,'assets',f+'.js'),'utf8'));
 return dom;
}
let dom=boot(),w=dom.window,d=w.document;
const nav=id=>d.querySelector(`nav button[data-page="${id}"]`).click();
const click=(text,scope=d)=>{const b=[...scope.querySelectorAll('button')].find(b=>b.textContent===text);assert.ok(b,text);b.click()};
const prompt=()=>{click('整理执行指令');const text=d.querySelector('#execution-text').value;d.querySelector('[data-close=execution-dialog]').click();return text};
nav('library');assert.equal(d.querySelectorAll('[data-method]').length,4);assert.ok(d.body.textContent.includes('102集'));assert.ok(d.body.textContent.includes('22集'));assert.ok(d.body.textContent.includes('173集'));
const search=d.querySelector('[aria-label="搜索蒸馏方法卡"]');search.value='拖拉机';search.dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('[data-method]').length,1);search.value='';search.dispatchEvent(new w.Event('input'));
nav('writing');assert.ok(!prompt().includes('selectedMechanismMethods'));
const fill=(key,value)=>{const e=d.querySelector(`[data-field="${key}"]`);assert.ok(e,key);e.value=value;e.dispatchEvent(new w.Event('input',{bubbles:true}))};
nav('task');fill('frozen','FREEZE_SENTINEL');nav('writing');fill('source','ORIGINAL_SENTINEL');fill('draft','DRAFT_SENTINEL');nav('interactive');fill('authorSecrets','SECRET_SENTINEL');
nav('library');for(const article of [...d.querySelectorAll('[data-method]')])click('选用到当前项目',d.querySelector(`[data-method="${article.dataset.method}"]`));
assert.equal(w.StoryWorkbench.getProject().cards.length,4);
nav('planning');let text=prompt();assert.ok(text.includes('双重评价'));assert.ok(text.includes('局部承诺'));assert.ok(text.includes('关系推进'));assert.ok(!text.includes('candidate-audit-04'));assert.ok(text.includes('FREEZE_SENTINEL'));assert.ok(!text.includes('SECRET_SENTINEL'));
nav('audit');text=prompt();assert.ok(text.includes('悬念回收'));assert.ok(!text.includes('双重评价驱动'));assert.ok(!text.includes('SECRET_SENTINEL'));
nav('handoff');assert.ok(!prompt().includes('selectedMechanismMethods'));
nav('library');click('取消选用方法',d.querySelector('[data-method="public-method-1"]'));
nav('planning');assert.ok(!prompt().includes('双重评价驱动'));
const current=w.StoryWorkbench.getProject();assert.equal(current.task.frozen,'FREEZE_SENTINEL');assert.equal(current.writing.source,'ORIGINAL_SENTINEL');assert.equal(current.writing.draft,'DRAFT_SENTINEL');
assert.equal(w.WorkbenchCore.validate(JSON.parse(JSON.stringify(current))).cards.length,3);
click('保存快照');const storage=w.localStorage.getItem('story-workbench.local-projects.v1');const restored=boot(storage);assert.equal(restored.window.StoryWorkbench.getProject().cards.length,3);assert.equal(restored.window.StoryWorkbench.getProject().task.frozen,'FREEZE_SENTINEL');
// Old schemaVersion 1 project without selected methods still restores untouched.
const old=w.WorkbenchCore.createProject();old.writing.source='OLD_PROJECT';const legacy=boot(JSON.stringify({active:old.id,projects:[old],snapshots:{}}));assert.equal(legacy.window.StoryWorkbench.getProject().writing.source,'OLD_PROJECT');assert.equal(legacy.window.StoryWorkbench.getProject().cards.length,0);
// Public payload contains only short paraphrases and method data, not private origins/credentials.
const payload=fs.readFileSync(path.join(root,'assets/mechanisms.json'),'utf8');assert.ok(!/47\.99\.96\.176|\/Users\/|1794805733372499|1794805453274113|cookie|password|access_token|api[_-]?key|BEGIN .*PRIVATE KEY/i.test(payload));
const methods=JSON.parse(payload);assert.equal(methods.items.length,4);for(const m of methods.items){assert.ok(m.evidence.length>=2);assert.ok(m.input&&m.output&&m.gate);for(const e of m.evidence)assert.ok(e.work&&e.episodes&&e.observation.length<160)}
console.log('PASS: catalog/search, 4 card selection, task-specific prompt routing, deselection, freeze/source/draft preservation, no secret leakage, schema round trip, saved reload, legacy project, public payload safety. JSDOM only; no visual/model-effect claim.');
dom.window.close();restored.window.close();legacy.window.close();
