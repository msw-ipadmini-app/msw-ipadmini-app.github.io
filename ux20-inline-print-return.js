/* UX20 PRODUCTION: same-tab A4 preview and return to patient medications.
 * Existing verified A4 content and EHR reconciliation checks are preserved.
 * No patient writes. Never change the background/idle security lock policy.
 */
(function(){
  'use strict';
  if(window.__MSW_UX20_INLINE_PRINT__)return;
  const api=window.UX17PrescriptionPrintCheck;
  if(!api?.readPatientRows||!api?.printHTML||typeof window.renderPatientMedications!=='function')return;
  window.__MSW_UX20_INLINE_PRINT__=true;
  let preview=null,observer=null;
  function closePreview(){
    if(observer){observer.disconnect();observer=null;}
    if(preview){preview.remove();preview=null;}
  }
  // Do NOT weaken clinical security: if Safari backgrounds, immediately
  // remove the patient print DOM; app.js still locks and clears its key.
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState!=='visible')closePreview();
  },true);
  window.addEventListener('pagehide',closePreview,true);
  function addStyle(){
    if(document.getElementById('ux20-inline-print-style'))return;
    const css=document.createElement('style');
    css.id='ux20-inline-print-style';
    css.textContent=`
      #ux20PrintPreview{position:fixed;inset:0;z-index:2147483000;overflow:auto;
        background:#e5e7eb;color:#111;padding:12px;box-sizing:border-box}
      #ux20PrintPreview .ux20-toolbar{position:sticky;top:0;z-index:3;display:flex;
        gap:10px;flex-wrap:wrap;background:#f8fafc;border:1px solid #94a3b8;
        border-radius:9px;padding:11px;margin:0 auto 12px;max-width:800px}
      #ux20PrintPreview .ux20-toolbar button{font-size:16px;min-height:44px;
        padding:8px 14px;border-radius:7px}
      #ux20PrintPreview .ux20-sheet{max-width:780px;margin:0 auto;background:white;
        padding:20px;box-shadow:0 1px 8px #64748b6b;box-sizing:border-box;
        font-size:11pt;line-height:1.5}
      #ux20PrintPreview .ux20-sheet h1{font-size:18pt;margin:0 0 4mm}
      #ux20PrintPreview .ux20-sheet .meta{display:grid;grid-template-columns:1fr 1fr;
        gap:2mm 10mm;margin:6mm 0}
      #ux20PrintPreview .ux20-sheet .meta p{margin:0;overflow-wrap:anywhere}
      #ux20PrintPreview .ux20-sheet .note{font-size:9pt;color:#444;margin:4mm 0 2mm}
      #ux20PrintPreview .ux20-sheet table{width:100%;border-collapse:collapse;table-layout:fixed}
      #ux20PrintPreview .ux20-sheet thead{display:table-header-group}
      #ux20PrintPreview .ux20-sheet th,#ux20PrintPreview .ux20-sheet td{
        border:1px solid #555;padding:7px 5px;text-align:left;vertical-align:top;
        overflow-wrap:anywhere;font-size:10pt}
      #ux20PrintPreview .ux20-sheet th{background:#eee;font-size:9pt}
      #ux20PrintPreview .ux20-sheet tr{break-inside:avoid;page-break-inside:avoid}
      .msw-private #ux20PrintPreview{display:none!important}
      @page{size:A4 portrait;margin:15mm}
      @media print{
        body>*:not(#ux20PrintPreview){display:none!important}
        html,body{margin:0!important;padding:0!important;background:#fff!important}
        #ux20PrintPreview{position:static!important;inset:auto!important;
          overflow:visible!important;padding:0!important;margin:0!important;
          background:#fff!important;box-shadow:none!important}
        #ux20PrintPreview .ux20-toolbar{display:none!important}
        #ux20PrintPreview .ux20-sheet{max-width:none!important;padding:0!important;
          box-shadow:none!important}
        #ux20PrintPreview .ux20-sheet th{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      }`;
    document.head.appendChild(css);
  }
  // Use the previously verified UX19 printing pathway in a separate tab.
  // Do not bypass background lock: returning may require PIN again.
  function openProvenPrint(rows,name,id){
    const tab=window.open('','_blank');
    if(!tab){
      alert('印刷用の画面を開けませんでした。Safariのポップアップ設定をご確認ください。');
      return;
    }
    try{
      tab.document.open();
      tab.document.write(api.printHTML(rows,name,id));
      tab.document.close();
      // Safari may skip auto-print; keep the explicit print button as a fallback.
      tab.document.getElementById('ux17PrintNow')?.addEventListener('click',()=>tab.print());
      tab.document.getElementById('ux17PrintClose')?.addEventListener('click',()=>tab.close());
      tab.focus();
      tab.setTimeout(()=>tab.print(),240);
    }catch(e){
      try{tab.close();}catch(_){}
      alert('印刷画面の表示に失敗しました。');
    }
  }
  function displayInline(rows,name,id){
    closePreview();
    addStyle();
    const parsed=new DOMParser().parseFromString(api.printHTML(rows,name,id,true),'text/html');
    const overlay=document.createElement('section');
    overlay.id='ux20PrintPreview';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','処方薬A4プレビュー');
    const toolbar=document.createElement('div');
    toolbar.className='ux20-toolbar';
    function button(text,click){
      const btn=document.createElement('button');btn.type='button';btn.className='btn secondary';
      btn.textContent=text;btn.addEventListener('click',click);return btn;
    }
    toolbar.append(
      button('A4で印刷（従来方式）',()=>openProvenPrint(rows,name,id)),
      button('← 処方薬画面に戻る',closePreview)
    );
    const note=document.createElement('p');
    note.className='notice';
    note.textContent='印刷は別タブで開きます。安全のため、戻る際に暗証番号の入力が必要になる場合があります。';
    note.style.cssText='margin:0 0 10px;font-size:12px;line-height:1.5;color:#334155';
    toolbar.append(note);
    const sheet=document.createElement('div');sheet.className='ux20-sheet';
    // Build from the same validated/safely escaped A4 document.
    for(const selector of ['h1','.meta','.note','table']){
      const item=parsed.body.querySelector(selector);
      if(item)sheet.appendChild(item.cloneNode(true));
    }
    if(!sheet.querySelector('table'))return;
    overlay.append(toolbar,sheet);document.body.appendChild(overlay);preview=overlay;
    // Explicit/inactivity lock re-renders #app; remove patient print details.
    const app=document.getElementById('app');
    if(app&&typeof MutationObserver==='function'){
      observer=new MutationObserver(()=>{
        if(!key||!state||document.body.classList.contains('msw-private'))closePreview();
      });
      observer.observe(app,{childList:true});
    }
    overlay.scrollTop=0;
  }
  function printPatient(){
    const patient=selectedPatient;
    if(!patient||!key||!state){alert('患者を選んでロックを解除してください。');return;}
    if(patient._new){alert('先に患者情報を保存してください。');return;}
    const data=api.readPatientRows(patient);
    if(!data.total){alert('処方薬が登録されていません。');return;}
    if(data.incomplete){
      alert('数量・用法が未確認（旧形式を含む）の薬剤が'+data.incomplete+'件あります。'+
        '\n印刷前に登録内容を確認・入力してください。未確認の処方薬を省略して印刷しないよう、今回は中止します。');
      return;
    }
    if(!data.entries.length){alert('印刷できる現在の処方薬がありません。');return;}
    if(!confirm('電子カルテの最新の内服処方と、変更・中止・頓服をすべて照合しましたか？'+
      '\n一致を確認した場合のみ、情報提供用A4を印刷します。薬価は掲載しません。'))return;
    const name=String(patient.data?.['氏名']||'未記入').trim();
    const id=String(patient.data?.['ＩＤ']||'');
    displayInline(data.entries,name,id);
  }
  function addButton(){
    const root=document.querySelector('#tabbody .patient-med-page');
    const toolbar=root?.querySelector('#ux17PrintToolbar');
    if(!toolbar)return;
    const original=[...toolbar.querySelectorAll('button')].find(
      b=>b.textContent?.trim()==='A4情報提供用 印刷');
    if(!original||original.dataset.ux20SameTab==='1')return;
    // Rebind only the existing A4 button. No duplicate buttons or patient edits.
    original.dataset.ux20SameTab='1';
    original.onclick=printPatient;
  }
  const old=window.renderPatientMedications;
  window.renderPatientMedications=function(...args){
    const result=old.apply(this,args);addButton();return result;
  };
})();
