/* UX20 PRODUCTION: iPad native A4 prescription printing, same path as the
 * proven morning patient list, preserving the old print preview as fallback.
 * Adds only print-specific DOM/CSS. No DB writes, PIN/auto-lock changes, global
 * print CSS overrides, extra tab, or PDF share.
 */
(function(){
  'use strict';
  if(window.__UX20_DIRECT_OS_PRINT_PRIMARY__)return;
  const api=window.UX17PrescriptionPrintCheck;
  if(!api?.readPatientRows||!api?.printHTML||typeof window.renderPatientMedications!=='function')return;
  window.__UX20_DIRECT_OS_PRINT_PRIMARY__=true;
  function installScopedPrintStyle(){
    if(document.getElementById('ux20-direct-print-style'))return;
    const style=document.createElement('style');
    style.id='ux20-direct-print-style';
    // Never affect the unrelated morning-list printing. The selectors
    // below apply ONLY to #morningPrint carrying .ux20-rx-direct.
    style.textContent=String.raw`
    @media print {
      #morningPrint.ux20-rx-direct {
        display:block!important;
        box-sizing:border-box;
        padding:10mm;
        width:100%;
        height:auto;
        font-size:11pt;
        line-height:1.45;
        color:#111;
        background:#fff;
        font-family:-apple-system,BlinkMacSystemFont,"Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif;
      }
      #morningPrint.ux20-rx-direct h1 {font-size:18pt;margin:0 0 4mm}
      #morningPrint.ux20-rx-direct .fake {
        font-size:13pt;text-align:center;color:#111;border:2px solid #111;
        font-weight:bold;padding:3mm;margin:0 0 4mm
      }
      #morningPrint.ux20-rx-direct .meta {
        display:grid;grid-template-columns:1fr 1fr;gap:2mm 8mm;margin:5mm 0
      }
      #morningPrint.ux20-rx-direct .meta p {margin:0;overflow-wrap:anywhere}
      #morningPrint.ux20-rx-direct .note {font-size:9pt;color:#444;margin:4mm 0 2mm}
      #morningPrint.ux20-rx-direct table {
        width:100%;border-collapse:collapse;table-layout:fixed;font-size:9.5pt
      }
      #morningPrint.ux20-rx-direct thead {display:table-header-group}
      #morningPrint.ux20-rx-direct th,
      #morningPrint.ux20-rx-direct td {
        border:1px solid #555;padding:5px 4px;text-align:left;
        vertical-align:top;overflow-wrap:anywhere
      }
      #morningPrint.ux20-rx-direct th {font-size:9pt;background:#eee!important}
      #morningPrint.ux20-rx-direct tr {break-inside:avoid;page-break-inside:avoid}
    }
    `;
    document.head.appendChild(style);
  }
  function printDirect(){
    const patient=selectedPatient;
    if(!patient||!key||!state){
      alert('患者情報を開き、暗証番号を解除してください。');return;
    }
    if(patient._new){alert('先に患者情報を保存してください。');return;}
    const data=api.readPatientRows(patient);
    if(!data.total){alert('処方薬が登録されていません。');return;}
    if(data.incomplete){
      alert('数量・用法が未確認（旧形式を含む）の薬剤が'+data.incomplete+'件あります。'+
        '\n未確認の処方薬を省略して印刷しないため、今回は中止します。');
      return;
    }
    if(!data.entries.length){
      alert('印刷できる現在の処方薬がありません。');return;
    }
    if(!confirm('電子カルテの最新の内服処方と、変更・中止・頓服をすべて照合しましたか？'+
      '\n一致を確認した場合のみA4情報提供用を印刷します。薬価は掲載しません。'))return;
    installScopedPrintStyle();
    const name=String(patient.data?.['氏名']||'未記入').trim();
    const id=String(patient.data?.['ＩＤ']||'');
    const html=api.printHTML(data.entries,name,id);
    const doc=new DOMParser().parseFromString(html,'text/html');
    const root=document.createElement('section');
    root.id='morningPrint';root.className='morning-print ux20-rx-direct';
    for(const selector of ['h1','.meta','.note','table']){
      const node=doc.body.querySelector(selector);
      if(node)root.appendChild(node.cloneNode(true));
    }
    if(!root.querySelector('table')){
      alert('印刷用の処方表を作成できませんでした。');return;
    }
    // The confirmed morning-list pathway: single body-level, print-only
    // #morningPrint DOM and iPad native AirPrint invocation. The existing
    // app lock already removes #morningPrint on any lock event.
    document.getElementById('morningPrint')?.remove();
    document.body.appendChild(root);
    setTimeout(()=>window.print(),50);
  }
  function addButton(){
    const page=document.querySelector('#tabbody .patient-med-page');
    const toolbar=page?.querySelector('#ux17PrintToolbar');
    if(!toolbar)return;
    const primary=[...toolbar.querySelectorAll('button')].find(
      b=>b.textContent?.trim()==='A4情報提供用 印刷');
    if(!primary||primary.dataset.ux20DirectPrint==='1')return;
    // After UX20's original binding has run, retain that independent legacy
    // flow as a fallback, and make the existing primary button direct AirPrint.
    const legacy=primary.onclick;
    if(typeof legacy!=='function')return;
    const fallback=document.createElement('button');
    fallback.id='ux20LegacyPrintPreview';
    fallback.type='button';fallback.className='btn secondary';
    fallback.textContent='従来の印刷前プレビュー';
    fallback.addEventListener('click',()=>legacy.call(primary));
    primary.dataset.ux20DirectPrint='1';
    primary.onclick=printDirect;
    toolbar.appendChild(fallback);
  }
  const previous=window.renderPatientMedications;
  window.renderPatientMedications=function(...args){
    const ret=previous.apply(this,args);addButton();return ret;
  };
})();