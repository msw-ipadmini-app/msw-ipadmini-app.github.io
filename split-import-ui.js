'use strict';
(()=>{
if(location.origin!=='https://msw-ipadmini-app.github.io'||location.pathname!=='/')return;
const original=renderSettings;
// Read only the small manifest before asking for the backup PIN. Full SHA-256
// and AES-GCM checks still run in MSWSplitV04.verify before any data replacement.
async function preflight(files,manifest){
 let meta;
 try{meta=JSON.parse(await manifest.text())}
 catch(e){throw Error('管理ファイルを読み取れません。選択をやり直してください')}
 const parts=[...files.values()].filter(file=>file!==manifest);
 if(meta?.format!=='MSWDB-SPLIT-V04'||!Array.isArray(meta.parts)||
    !Number.isInteger(meta.partCount)||meta.partCount<1||meta.partCount>2001)
   throw Error('管理ファイルの形式が不正です');
 if(meta.partCount!==parts.length||meta.parts.length!==parts.length)
   throw Error('分割ファイルが不足しています。管理ファイルとすべてのパートを選択してください');
 for(const part of meta.parts){
   const file=files.get(part?.name);
   if(!file||file===manifest||file.size!==part.bytes)
     throw Error('必要なパートが見つからないか、ファイルサイズが一致しません');
 }
 return parts;
}
function bind(){const after=document.getElementById('splitExportRow');if(!after||document.getElementById('splitImportRow'))return;
const panel=document.createElement('div');panel.id='splitImportRow';panel.className='panel';
panel.innerHTML='<h3>分割バックアップ復元（導入候補）</h3><p class="notice">バックアップファイルを1個ずつ追加し、暗証・全写真を検査してから復元します。復元すると現在の患者記録が置き換わります。事前に新しいバックアップと端末保存容量を確認してください。</p><input type="file" id="splitPick" multiple><p id="splitCount">選択済み 0 ファイル</p><button class="btn secondary" id="splitRestore">整合性を検証して復元</button> <button class="btn secondary" id="splitClear">選択をやり直す</button><p class="notice" id="splitImportStatus" role="status">未実施</p>';
after.insertAdjacentElement('afterend',panel);
const pick=panel.querySelector('#splitPick'),out=panel.querySelector('#splitImportStatus'),count=panel.querySelector('#splitCount');
const files=new Map();let busy=false;
pick.onchange=()=>{const selected=Array.from(pick.files||[]);pick.value='';const result=MSWSplitFileSelection.add(files,selected);count.textContent='選択済み '+result.count+' ファイル';out.textContent=result.ok?'ファイル選択を受け付けました':result.message};
panel.querySelector('#splitClear').onclick=()=>{if(busy)return;files.clear();count.textContent='選択済み 0 ファイル';out.textContent='未実施'};
panel.querySelector('#splitRestore').onclick=async()=>{if(busy)return;const manifest=[...files.values()].filter(f=>f.name.endsWith('-manifest.json'));if(manifest.length!==1){out.textContent='管理ファイルは1個だけ選んでください';return}
const flow=window.MSWSplitUIFlow;
if(!flow?.tryBeginImport()){out.textContent='分割書き出し中は復元できません。全パートと管理ファイルの保存操作を完了するか、作業を中断する場合はSafariで再読み込みしてください。';return}
busy=true;
try{
 let parts;
 try{parts=await preflight(files,manifest[0])}
 catch(e){out.textContent='ファイルの事前確認：'+(e.message||String(e))+'。患者データの復元処理は開始していません';return}
 const pin=prompt('バックアップ作成時の暗証を入力してください（チャット等には入力しないでください）');
 if(pin===null){out.textContent='暗証入力を中止しました';return}
 out.textContent='全ファイルの整合性を検査中…';
 const result=await MSWImportBridge.run(manifest[0],parts,pin,(done,total)=>{out.textContent='写真認証 '+done+' / '+total+'件'});
 out.textContent=result.cancelled?'復元を中止しました':result.restored?(result.uiWarning||'患者'+result.patients+'件・写真'+result.photos+'件を復元しロックしました'):'復元結果を確認できません。アプリを再読み込みして確認してください';
}catch(e){out.textContent='復元処理の確認が必要です。エラー：'+(e.message||String(e))+'。既存データに変更がないと断言せず、再読み込み後の状態を確認してください'}
finally{busy=false;flow.finishImport()}};
window.MSWSplitUIFlow?.refresh();
}
renderSettings=async function(...args){await original(...args);bind()};
})();