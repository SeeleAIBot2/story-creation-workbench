/* Pure local project operations. No model or network client. */
(function (root) {
'use strict';
const VERSION=1;
const schema={
 task:{kind:'选题构思',level:'L1 轻润色',scope:'',baseVersion:'',received:'',goal:'',frozen:'',allowed:'',format:'Markdown',length:'',style:'',onlyBody:false},
 planning:{logline:'',experience:'',world:'',protagonist:'',opponent:'',stakes:'',need:'',ruleChain:'',turns:'',resolution:'',visual:'',rights:'',uncertain:'',notes:''},
 writing:{purpose:'固定剧情',medium:'剧本',viewpoint:'',start:'',end:'',before:'',after:'',source:'',draft:'',style:'',changes:'',status:'创意候选'},
 interactive:{modelControl:'',playerControl:'',period:'',known:'',unknown:'',authorSecrets:'',worldRules:'',recall:'',node:'',previous:'',state:'',pending:'',boundaries:'',publicSummary:''},
 handoff:{target:'',formatVersion:'',approvedVersion:'',scope:'',control:'',visible:'',constraints:'',unmapped:'',mapping:'',testStatus:'未测试'},
 validation:{product:'',modelId:'',mode:'',conditions:'',cost:'',review:'',inputs:'',outputs:'',failures:'',status:'未实测',checked:[]}
};
const recordSchema={
 directions:{title:'',logline:'',relationship:'',synopsis:'',distinct:'',status:'创意候选'},
 characters:{id:'',name:'',aliases:'',role:'',period:'',goal:'',cost:'',strategy:'',ability:'',voice:'',relations:'',known:'',unknown:'',forbidden:'',notes:''},
 audits:{id:'',position:'',quote:'',function:'',judgment:'',category:'需补设定或因果',priority:'中',impact:'',candidate:'',assumption:'',status:'待核'},
 continuity:{id:'',version:'',branch:'',scene:'',time:'',place:'',present:'',known:'',items:'',state:'',relation:'',previous:'',next:'',uncertain:''},
 rules:{id:'',fact:'',source:'',status:'待核',applies:'',trigger:'',cost:'',limits:'',expiry:'',knowledge:'',evidence:'',uncertain:''},
 branches:{id:'',node:'',condition:'',choice:'',immediate:'',delayed:'',delta:'',next:'',merge:'',status:'设计候选'},
 cards:{id:'',name:'',layer:'',scope:'',experience:'',drive:'',mechanism:'',variation:'',boundary:'',source:'',version:'',test:'待审阅／待试用'}
};
function clone(v){return JSON.parse(JSON.stringify(v))}
function uid(prefix='project'){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
function createProject(){const p={schemaVersion:VERSION,id:uid(),title:'未命名故事',updatedAt:'',genres:[],tags:[],results:[]};for(const [k,v]of Object.entries(schema))p[k]=clone(v);for(const k of Object.keys(recordSchema))p[k]=[];return p}
function record(type){if(!recordSchema[type])throw Error('未知记录类型');const r=clone(recordSchema[type]);if('id'in r)r.id=uid(type.slice(0,3));return r}
function cleanObject(value,template){if(!value||typeof value!=='object'||Array.isArray(value))throw Error('字段应为对象');const out={};for(const [k,d]of Object.entries(template)){const v=value[k];if(v===undefined){out[k]=clone(d);continue}if(Array.isArray(d)){if(!Array.isArray(v)||v.length>100||v.some(x=>typeof x!=='string'||x.length>500))throw Error('无效列表字段');out[k]=[...v]}else if(typeof d==='boolean'){if(typeof v!=='boolean')throw Error('无效开关字段');out[k]=v}else{if(typeof v!=='string'||v.length>2000000)throw Error('文本字段格式不正确或过长');out[k]=v}}return out}
function validate(input){if(!input||typeof input!=='object'||input.schemaVersion!==VERSION||typeof input.title!=='string'||typeof input.id!=='string'||input.id.length>120||!/^project-[a-z0-9-]+$/.test(input.id))throw Error('不是此工作台的项目 JSON（schemaVersion: 1）');const out=createProject();out.id=input.id;out.title=input.title.slice(0,200);out.updatedAt=typeof input.updatedAt==='string'?input.updatedAt:'';for(const [k,v]of Object.entries(schema))out[k]=cleanObject(input[k],v);for(const [k,v]of Object.entries(recordSchema)){if(!Array.isArray(input[k])||input[k].length>2000)throw Error('记录列表无效或超过 2000 条');out[k]=input[k].map(x=>cleanObject(x,v))}for(const k of ['genres','tags']){if(!Array.isArray(input[k])||input[k].length>2000)throw Error('题材标签列表无效');out[k]=input[k].map(x=>{if(typeof x!=='string'||x.length>500)throw Error('标签格式无效');return x})}if(!Array.isArray(input.results)||input.results.length>100)throw Error('回填列表无效');out.results=input.results.map(x=>cleanObject(x,{id:'',module:'',text:'',createdAt:'',status:'待核对'}));return out}
function distance(a,b){a=Array.from(a);b=Array.from(b);let d=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let n=[i];for(let j=1;j<=b.length;j++)n[j]=Math.min(n[j-1]+1,d[j]+1,d[j-1]+(a[i-1]===b[j-1]?0:1));d=n}return d[b.length]}
function split(s){return String(s).split(/[,，、;；\n]+/).map(s=>s.trim()).filter(Boolean)}
function names(characters,occupied=''){let list=characters.flatMap((r,i)=>[r.name,...split(r.aliases)].filter(Boolean).map(term=>({term,who:r.name||r.id||String(i+1),index:i})));list.push(...split(occupied).map((term,i)=>({term,who:'已有名单',index:-i-1})));return list}
function nameChecks(characters,occupied=''){const list=names(characters,occupied),out=[];for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const a=list[i],b=list[j];if(a.index===b.index)continue;const d=distance(a.term,b.term);if(d===0||(Math.min(Array.from(a.term).length,Array.from(b.term).length)>=2&&d===1))out.push({kind:d?'一字近似':'完全重名',a,b})}return out}
function suggestions(characters,text='',occupied=''){const used=names(characters,occupied).map(x=>x.term);const surnames=['程','方','纪','孟','乔','贺','叶','秦','温','谢'];const given=['闻溪','清禾','见微','映川','知遥','初霁','云舟','照临','书屿','明澈'];return surnames.flatMap(s=>given.map(g=>s+g)).filter(n=>!text.includes(n)&&!used.some(u=>n.includes(u)||u.includes(n)||distance(n,u)<=1)).slice(0,12)}
function renamePreview(p,oldName,newName){oldName=oldName.trim();newName=newName.trim();if(!oldName||!newName||oldName===newName)throw Error('请填写不同的原名和新名');if(names(p.characters).filter(n=>n.term===oldName).length!==1)throw Error('原名须在人物表中唯一登记；共用别名先消歧');if(names(p.characters).some(n=>n.term===newName))throw Error('新名已被人物表使用');const hits=[];function walk(v,path){if(typeof v==='string'){let pos=v.indexOf(oldName);while(pos!==-1){hits.push({path:path.join('.'),pos,context:v.slice(Math.max(0,pos-15),pos)+'【'+oldName+' → '+newName+'】'+v.slice(pos+oldName.length,pos+oldName.length+15)});pos=v.indexOf(oldName,pos+oldName.length)}}else if(Array.isArray(v))v.forEach((x,i)=>walk(x,[...path,i]));else if(v&&typeof v==='object')for(const[k,x]of Object.entries(v))if(!['id','updatedAt','createdAt','schemaVersion'].includes(k))walk(x,[...path,k])}walk(p,[]);return hits}
function rename(p,oldName,newName){renamePreview(p,oldName,newName);const out=clone(p);function walk(v){if(typeof v==='string')return v.split(oldName).join(newName);if(Array.isArray(v))return v.map(walk);if(v&&typeof v==='object')for(const k of Object.keys(v))if(!['id','updatedAt','createdAt','schemaVersion'].includes(k))v[k]=walk(v[k]);return v}return walk(out)}
function fieldText(value,labels={}){if(Array.isArray(value))return value.map((r,i)=>'### '+(i+1)+'\n'+fieldText(r,labels)).join('\n\n');return Object.entries(value).filter(([k,v])=>v!==''&&!(Array.isArray(v)&&!v.length)).map(([k,v])=>'**'+(labels[k]||k)+'：** '+(Array.isArray(v)?v.join('、'):v)).join('\n\n')}
const api={VERSION,schema,recordSchema,clone,uid,createProject,record,validate,distance,split,names,nameChecks,suggestions,renamePreview,rename,fieldText};root.WorkbenchCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
