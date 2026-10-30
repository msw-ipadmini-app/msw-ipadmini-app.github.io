'use strict';
(()=>{
if(location.origin!=='https://msw-ipadmini-app.github.io'||location.pathname!=='/')return;
const original=renderSettings;
function bind(){const after=document.getElementById('splitExportRow');if(!after||document.getElementById('splitImportRow'))return;
const panel=document.createElement('div');panel.id='splitImportRow';panel.className='panel';
panel.innerHTML='<h3>分割バックアップ復元（導入候補）</h3><p class="notice">バックアップファイルを1個ずつ追加し、暗証・全写真を検査してから復元します。復元すると現在の患者記録が置き換わります。事前に新しいバックアップと端末保存容量を確認してください。</p><input type="file" id="splitPick" multiple><p id="splitCount">選択済み 0 ファイル</p><button class="btn secondary" id="splitRestore">整合性を検証して復元</button> <button class="btn secondary" id="splitClear">選択をやり直す</button><p class="notice" id="splitImportStatus" role="status">未実施</p>';
after.insertAdjacentElement('afterend',panel);
const pick=panel.querySelector('#splitPick'),out=panel.querySelector('#splitImportStatus'),count=panel.querySelector('#splitCount');
const files=new Map();let busy=false;
pick.onchange=()=>{const selected=Array.from(pick.files||[]);pick.value='';for(const f of selected){if(!/^msw-split-[0-9a-f]{24}-(manifest|[0-9]{4})\.json$/.test(f.name)||f.size>48*1024*1024){out.textContent='同じバックアップの分割JSONだけ選択してください';continue}if(files.has(f.name)){out.textContent='同名ファイルが重複しました。選択をやり直してください';files.clear();count.textContent='選択済み 0 ファイル';return}const runId=f.name.match(/^msw-split-([0-9a-f]{24})-/)[1];const existing=[...files.keys()];if(existing.some(name=>!name.startsWith('msw-split-'+runId+'-'))){out.textContent='異なるバックアップ回のファイルが混在しています。選択をやり直してください';files.clear();count.textContent='選択済み 0 ファイル';return}files.set(f.name,f)}count.textContent='選択済み '+files.size+' ファイル'};
panel.querySelector('#splitClear').onclick=()=>{if(busy)return;files.clear();count.textContent='選択済み 0 ファイル';out.textContent='未実施'};
panel.querySelector('#splitRestore').onclick=async()=>{if(busy)return;const manifest=[...files.values()].filter(f=>f.name.endsWith('-manifest.json'));if(manifest.length!==1){out.textContent='管理ファイルは1個だけ選んでください';return}
const pin=prompt('バックアップ作成時の暗証を入力してください（チャット等には入力しないでください）');if(pin===null)return;
busy=true;out.textContent='全ファイルの整合性を検査中…';
try{const parts=[...files.values()].filter(f=>f!==manifest[0]);const result=await MSWImportBridge.run(manifest[0],parts,pin,(done,total)=>{out.textContent='写真認証 '+done+' / '+total+'件'});out.textContent=result.cancelled?'復元を中止しました':'患者'+result.patients+'件・写真'+result.photos+'件を復元しロックしました'}
catch(e){out.textContent='復元中断（既存患者は変更なし）：'+(e.message||String(e))}finally{busy=false}};
}
renderSettings=async function(...args){await original(...args);bind()};
})();