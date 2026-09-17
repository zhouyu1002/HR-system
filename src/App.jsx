import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const REQUIRED = ['部門名稱','工號','姓名','姓名 ','上班判讀','日期','上班刷卡時間','班別名稱'];

const sampleRows = [
  { 部門名稱:'示範資料', 工號:'DEMO001', 姓名:'示範員工', '上班判讀':'正常', 日期:'2026/09/15', 上班刷卡時間:'08:12', 班別名稱:'日班' },
  { 部門名稱:'示範資料', 工號:'DEMO002', 姓名:'免刷員工', '上班判讀':'免刷', 日期:'2026/09/15', 上班刷卡時間:'', 班別名稱:'日班' },
  { 部門名稱:'示範資料', 工號:'DEMO003', 姓名:'未刷卡員工', '上班判讀':'未刷卡', 日期:'2026/09/15', 上班刷卡時間:'', 班別名稱:'日班' },
  { 部門名稱:'示範資料', 工號:'DEMO004', 姓名:'休息員工', '上班判讀':'休息日', 日期:'2026/09/15', 上班刷卡時間:'', 班別名稱:'休息日' }
];

function normalizeKey(k){ return String(k ?? '').replace(/^\uFEFF/,'').trim(); }
function normalizeRows(rows){
  return rows.map(r => {
    const n={}; Object.entries(r).forEach(([k,v])=>n[normalizeKey(k)]=v);
    n['姓名'] = n['姓名'] ?? n['姓名 '] ?? '';
    n['上班判讀'] = String(n['上班判讀'] ?? '').trim();
    return n;
  }).filter(r => r['工號'] !== undefined && String(r['工號']).trim() !== '');
}
function statusOf(v){ return ['正常','休息日','免刷'].includes(String(v ?? '').trim()) ? '正常' : '異常'; }
function isRest(v){ return String(v ?? '').trim() === '休息日'; }
function displayDate(v){
  if(v instanceof Date) return v.toLocaleDateString('zh-TW');
  if(typeof v === 'number') { const d=XLSX.SSF.parse_date_code(v); return `${d.y}/${String(d.m).padStart(2,'0')}/${String(d.d).padStart(2,'0')}`; }
  return String(v ?? '').trim() || '未提供日期';
}

export default function App(){
  const [rows,setRows]=useState(sampleRows);
  const [fileName,setFileName]=useState('示範資料（請匯入 Excel）');
  const [error,setError]=useState('');
  const [dept,setDept]=useState('全部部門');
  const [status,setStatus]=useState('全部');
  const [keyword,setKeyword]=useState('');
  const inputRef=useRef();

  const importExcel = async file => {
    if(!file) return;
    setError('');
    try{
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:'array',cellDates:true});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const raw=XLSX.utils.sheet_to_json(ws,{defval:''});
      const normalized=normalizeRows(raw);
      if(!normalized.length) throw new Error('找不到可用資料。請確認 Excel 第一個工作表包含「工號」欄位。');
      setRows(normalized); setFileName(file.name); setDept('全部部門'); setStatus('全部'); setKeyword('');
    }catch(e){ setError(e.message || 'Excel 讀取失敗'); }
  };

  const departments=useMemo(()=>['全部部門',...Array.from(new Set(rows.map(r=>r['部門名稱']).filter(Boolean))).sort((a,b)=>String(a).localeCompare(String(b),'zh-Hant'))],[rows]);
  const dateText=useMemo(()=>{ const dates=rows.map(r=>displayDate(r['日期'])).filter(Boolean); return dates.length ? Array.from(new Set(dates)).join('、') : '未提供日期'; },[rows]);

  const filtered=useMemo(()=>rows.filter(r=>{
    const s=statusOf(r['上班判讀']);
    const okDept=dept==='全部部門'||r['部門名稱']===dept;
    const okStatus=status==='全部'||s===status;
    const q=keyword.trim().toLowerCase();
    const okQ=!q || [r['工號'],r['姓名'],r['部門名稱'],r['上班判讀']].some(x=>String(x??'').toLowerCase().includes(q));
    return okDept&&okStatus&&okQ;
  }),[rows,dept,status,keyword]);

  const kpi=useMemo(()=>{
    const total=new Set(filtered.map(r=>String(r['工號']))).size;
    const normal=filtered.filter(r=>statusOf(r['上班判讀'])==='正常').length;
    const rest=filtered.filter(r=>isRest(r['上班判讀'])).length;
    const shouldWork=total-rest;
    const normalWork=filtered.filter(r=>statusOf(r['上班判讀'])==='正常'&&!isRest(r['上班判讀'])).length;
    const rate=shouldWork ? normalWork/shouldWork : 0;
    return {total,normal,rest,abnormal:total-normal,shouldWork,normalWork,rate};
  },[filtered]);

  const pieData=useMemo(()=>[
    {name:'正常',value:filtered.filter(r=>statusOf(r['上班判讀'])==='正常').length},
    {name:'異常',value:filtered.filter(r=>statusOf(r['上班判讀'])==='異常').length}
  ].filter(x=>x.value>0),[filtered]);

  const deptData=useMemo(()=>{
    const m=new Map();
    filtered.forEach(r=>{
      const d=r['部門名稱']||'未分類';
      if(!m.has(d)) m.set(d,{dept:d,total:0,normal:0,rate:0});
      const x=m.get(d); x.total++; if(statusOf(r['上班判讀'])==='正常'&&!isRest(r['上班判讀'])) x.normal++;
    });
    return Array.from(m.values()).map(x=>({...x,rate:x.total ? Math.round(x.normal/x.total*1000)/10:0})).sort((a,b)=>a.rate-b.rate);
  },[filtered]);

  const abnormal=useMemo(()=>filtered.filter(r=>statusOf(r['上班判讀'])==='異常').sort((a,b)=>String(a['部門名稱']).localeCompare(String(b['部門名稱']),'zh-Hant')),[filtered]);

  return <div className="app">
    <header className="topbar">
      <div><div className="eyebrow">HR • OPERATIONS CENTER</div><h1>人員出勤戰情室</h1><p>每日刷卡資料即時彙整與異常監控</p></div>
      <div className="top-actions"><span className="date-chip">資料日期：{dateText}</span><button className="upload-btn" onClick={()=>inputRef.current?.click()}>＋ 匯入 Excel</button><input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={e=>importExcel(e.target.files?.[0])}/></div>
    </header>

    <main>
      <section className="upload-panel">
        <div className="upload-copy"><strong>手動匯入出勤 Excel</strong><span>支援 .xlsx / .xls / .csv；資料只在此瀏覽器前端解析，不需改 Excel 格式。</span></div>
        <button className="outline-btn" onClick={()=>inputRef.current?.click()}>選擇檔案</button>
        <div className="file-name">目前資料：{fileName}</div>
      </section>
      {error && <div className="error">⚠ {error}</div>}

      <section className="filters">
        <label>部門<select value={dept} onChange={e=>setDept(e.target.value)}>{departments.map(d=><option key={d}>{d}</option>)}</select></label>
        <label>狀態<select value={status} onChange={e=>setStatus(e.target.value)}><option>全部</option><option>正常</option><option>異常</option></select></label>
        <label className="search">搜尋<input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="工號／姓名／部門…"/></label>
      </section>

      <section className="kpis">
        <Kpi title="今日總人數" value={kpi.total} sub="目前篩選條件" icon="👥" />
        <Kpi title="正常人數" value={kpi.normal} sub="正常＋免刷＋休息日" icon="✓" good />
        <Kpi title="異常人數" value={kpi.abnormal} sub="需進一步處理" icon="!" alert />
        <Kpi title="出勤率" value={`${(kpi.rate*100).toFixed(1)}%`} sub={`應到 ${kpi.shouldWork} 人／正常 ${kpi.normalWork} 人`} icon="◔" />
      </section>

      <section className="grid two">
        <Card title="出勤狀態分布" meta={`共 ${filtered.length} 筆`}><div className="chart pie-wrap"><ResponsiveContainer width="100%" height={290}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={78} outerRadius={112} paddingAngle={3}>{pieData.map((x,i)=><Cell key={x.name} fill={i===0?'#2dd4bf':'#fb7185'}/>)}</Pie><Tooltip/><Legend verticalAlign="bottom"/></PieChart></ResponsiveContainer><div className="pie-center"><b>{(kpi.normal/Math.max(kpi.total,1)*100).toFixed(0)}%</b><span>正常</span></div></div></Card>
        <Card title="各部門出勤率" meta="休息日不列入應到分母"><div className="chart"><ResponsiveContainer width="100%" height={330}><BarChart data={deptData} layout="vertical" margin={{left:20,right:25,top:5,bottom:5}}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" domain={[0,100]} tickFormatter={v=>`${v}%`}/><YAxis type="category" dataKey="dept" width={105} tick={{fontSize:11}}/><Tooltip formatter={v=>[`${v}%`,'出勤率']}/><Bar dataKey="rate" name="出勤率" fill="#38bdf8" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer></div></Card>
      </section>

      <section className="grid two bottom">
        <Card title="異常人員清單" meta={`${abnormal.length} 人`}><div className="table-wrap"><table><thead><tr><th>部門</th><th>工號</th><th>姓名</th><th>上班判讀</th><th>刷卡時間</th></tr></thead><tbody>{abnormal.slice(0,80).map((r,i)=><tr key={i}><td>{r['部門名稱']||'—'}</td><td>{r['工號']}</td><td>{r['姓名']||'—'}</td><td><span className="badge bad">{r['上班判讀']||'未判讀'}</span></td><td>{r['上班刷卡時間']||'—'}</td></tr>)}</tbody></table>{abnormal.length>80&&<div className="more">僅顯示前 80 筆</div>}</div></Card>
        <Card title="目前資料摘要" meta="Excel 欄位解析"><div className="summary"><Summary label="資料檔案" value={fileName}/><Summary label="資料筆數" value={`${rows.length} 筆`}/><Summary label="部門數" value={`${departments.length-1} 個`}/><Summary label="目前篩選後" value={`${filtered.length} 筆`}/><div className="note"><b>判讀規則</b><br/>「正常／休息日／免刷」→ 正常<br/>其他上班判讀 → 異常<br/><small>出勤率計算時，休息日不列入應到分母。</small></div></div></Card>
      </section>
    </main>
    <footer>HR-system · 出勤戰情室 · Excel 前端匯入版</footer>
  </div>
}

function Kpi({title,value,sub,icon,good,alert}){return <div className={`kpi ${good?'good':''} ${alert?'alert':''}`}><div className="kpi-icon">{icon}</div><div><span>{title}</span><strong>{value}</strong><small>{sub}</small></div></div>}
function Card({title,meta,children}){return <div className="card"><div className="card-head"><h2>{title}</h2><span>{meta}</span></div>{children}</div>}
function Summary({label,value}){return <div className="summary-row"><span>{label}</span><b>{value}</b></div>}
