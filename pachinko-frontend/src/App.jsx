import React, { useState, useEffect, useRef } from 'react'
import { getState, postSpin, postPrizes, getStats, resetStats } from './api'
import { prizeEmoji, easeOutQuad, weightedPickLocal, randomizePrizeMap, randomizeFillers } from './utils'
import Header from './components/Header'
import Toasts from './components/Toasts'
import Board from './components/Board'
import PrizeList from './components/PrizeList'
import StaffPanel from './components/StaffPanel'
import Footer from './components/Footer'

export default function App(){
  const [prizes, setPrizes] = useState([])
  const [layout, setLayout] = useState({ columns:9 })
  const [stats, setStats] = useState({ plays:0, wins:{} })
  const [spinning, setSpinning] = useState(false)
  const [message, setMessage] = useState('')
  const [highlightCol, setHighlightCol] = useState(0)
  const [prizeMap, setPrizeMap] = useState([])
  const [fillerMap, setFillerMap] = useState([])
  const [tempColumns, setTempColumns] = useState(9)
  const dropAnimRef = useRef(null); // id RAF attivo per la simulazione


  const toastRootRef = useRef(null)
  const ballRef = useRef(null)
  const gridRef = useRef(null)
  const preAnimRef = useRef(null)


  // utilità vettoriali minime
function vDot(ax, ay, bx, by){ return ax*bx + ay*by }
function vLen(x, y){ return Math.hypot(x, y) || 0.000001 }


  // staff
  const [staffMode, setStaffMode] = useState(false)
  const [staffSecret, setStaffSecret] = useState('')
  const [staffAuthed, setStaffAuthed] = useState(false)
  const [staffAuthStatus, setStaffAuthStatus] = useState('idle')
  const [editPrizes, setEditPrizes] = useState([])

  useEffect(()=>{ loadState() }, [])
  useEffect(()=>{ setTempColumns(layout.columns || 9) }, [layout.columns])
  useEffect(() => {
  return () => { if (dropAnimRef.current) cancelAnimationFrame(dropAnimRef.current) }
}, [])


  async function loadState(){
    try{
      const j = await getState()
      setPrizes(j.prizes || [])
      setLayout(j.layout || { columns:9 })
      setStats(j.stats || { plays:0, wins:{} })
      setEditPrizes(j.prizes || [])
      const cols = (j.layout && j.layout.columns) || 9
      setPrizeMap(randomizePrizeMap(j.prizes || [], cols))
      setFillerMap(randomizeFillers(cols))
    }catch(e){ console.error(e) }
  }

  function showToast(msg, type='info'){
    const root = toastRootRef.current
    if (!root) return
    const el = document.createElement('div')
    el.textContent = msg
    el.style.background = type==='success' ? '#2ecc71' : (type==='error' ? '#e74c3c' : '#333')
    el.style.color = '#fff'
    el.style.padding = '8px 12px'
    el.style.borderRadius = '8px'
    el.style.marginTop = '8px'
    el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.4)'
    root.appendChild(el)
    setTimeout(()=>{ el.style.opacity = '0'; setTimeout(()=>root.removeChild(el),500) }, 3000)
  }

  function sleep(ms){ return new Promise(res=>setTimeout(res, ms)) }

  function startPreHighlight(){ if (preAnimRef.current) return; const cols = layout.columns || 9; let idx = highlightCol || 0; preAnimRef.current = setInterval(()=>{ idx = (idx + 1) % cols; setHighlightCol(idx) }, 90) }
  function stopPreHighlight(){ if (!preAnimRef.current) return; clearInterval(preAnimRef.current); preAnimRef.current = null }

  async function doSpin(){
    if (spinning) return
    setMessage('')
    setSpinning(true)
    startPreHighlight()
    try{
      const j = await postSpin()
      if (!j.success){ stopPreHighlight(); setMessage('Errore server'); setSpinning(false); return }
      const cols = layout.columns || 9
      const forced = { prizeId: j.prize.id, column: j.column }
      const newMap = randomizePrizeMap(prizes, cols, forced)
      setPrizeMap(newMap)
      setFillerMap(randomizeFillers(cols))
  stopPreHighlight()
  await animateHighlightToColumn(j.column)
  await sleep(1000)
  // announce when the ball lands by passing a callback
  await animateDropToColumn(j.column, ()=>{ showToast(`🎉 Hai vinto ${j.prize.label}`,'success') })
      setStats(j.stats || stats)
      setMessage(`🎉 Hai vinto: ${j.prize.label} ${prizeEmoji(j.prize.label)}`)
    }catch(e){ console.error(e); stopPreHighlight(); setMessage('Errore comunicazione server') }
    finally{ setTimeout(()=>setSpinning(false), 600) }
  }

  async function doDemoSpin(){
    if (spinning) return
    setMessage('')
    setSpinning(true)
    startPreHighlight()
    const prize = weightedPickLocal(prizes)
    const cols = layout.columns || 9
    const column = Math.floor(Math.random()*cols)
    setPrizeMap(randomizePrizeMap(prizes, cols, { prizeId: prize.id, column }))
    setFillerMap(randomizeFillers(cols))
    stopPreHighlight()
    await animateHighlightToColumn(column)
    await sleep(1000)
    // for demo, announce on landing via callback
    await animateDropToColumn(column, ()=>{ showToast(`🎉 Demo: hai vinto ${prize.label}`,'success') })
    const newStats = {...stats}
    newStats.plays = (newStats.plays||0) + 1
    newStats.wins = Object.assign({}, newStats.wins || {})
    newStats.wins[prize.id] = (newStats.wins[prize.id]||0) + 1
    setStats(newStats)
    setMessage(`🎉 Hai vinto: ${prize.label} ${prizeEmoji(prize.label)}`)
    setTimeout(()=>setSpinning(false), 600)
  }

  async function applyColumns(){ const cols = Math.max(3, Math.min(40, Number(tempColumns)||9)); setLayout({...layout, columns: cols}); setPrizeMap(randomizePrizeMap(prizes, cols)); setFillerMap(randomizeFillers(cols)); showToast(`Colonne impostate a ${cols}`,'success'); setMessage(`Colonne: ${cols}`) }

  async function authenticateStaff(){ setStaffAuthStatus('idle'); try{ const j = await getStats(staffSecret); if (j.stats){ setMessage('Secret OK'); setStats(j.stats); setStaffAuthed(true); setStaffAuthStatus('success'); showToast('Accesso staff consentito','success') } else { setMessage('Non autorizzato'); setStaffAuthed(false); setStaffAuthStatus('error'); showToast('Secret non valido','error') } }catch(e){ setMessage('Errore comunicazione'); setStaffAuthed(false); setStaffAuthStatus('error'); showToast('Errore comunicazione','error') } }

  async function handleSavePrizes(){ try{ const j = await postPrizes(editPrizes, layout, staffSecret); if (j.success){ setPrizes(j.prizes); setMessage('Prizes aggiornati'); const cols = layout.columns || 9; setPrizeMap(randomizePrizeMap(j.prizes, cols)); setFillerMap(randomizeFillers(cols)); showToast('Premi salvati','success') } else { setMessage(j.error||'Errore aggiornamento'); showToast(j.error||'Errore aggiornamento','error') } }catch(e){ setMessage('Errore comunicazione'); showToast('Errore comunicazione','error') } }

  async function handleResetStats(){ try{ const j = await resetStats(staffSecret); if (j.success){ setStats({ plays:0, wins:{} }); setMessage('Stats resettate'); showToast('Stats resettate','success') } else { setMessage('Errore'); showToast('Errore reset stats','error') } }catch(e){ setMessage('Errore'); showToast('Errore comunicazione','error') } }

  function updatePrizeField(idx, field, value){ const newp = editPrizes.map((p,i) => i===idx ? {...p, [field]: value} : p); setEditPrizes(newp) }
  function addPrize(){ const nextId = 'p' + (Date.now()); setEditPrizes([...editPrizes, { id: nextId, label: 'Nuovo', weight: 5, column: null }]) }
  function removePrize(i){ const tmp = editPrizes.slice(); tmp.splice(i,1); setEditPrizes(tmp) }

  // Animation helpers: animateHighlightToColumn & animateDropToColumn
  function animateHighlightToColumn(targetCol){
    return new Promise((resolve)=>{
      const cols = layout.columns || 9
      const duration = 5000 + Math.round(((targetCol||0)/(Math.max(1,cols-1))) * 5000)
      const rounds = 5 + Math.round(((targetCol||0)/(Math.max(1,cols-1))) * 5)
      const totalSteps = rounds * cols + (targetCol % cols)
      const start = performance.now()
      let rafId = null
      function frame(){
        const now = performance.now(); const elapsed = now - start; const t = Math.min(1, elapsed / duration); const eased = easeOutQuad(t); const step = Math.floor(eased * totalSteps); const col = step % cols; if (t >= 1) { setHighlightCol(targetCol); if (rafId) cancelAnimationFrame(rafId); resolve(); return } setHighlightCol(col); rafId = requestAnimationFrame(frame)
      }
      rafId = requestAnimationFrame(frame)
    })
  }

 function animateDropToColumn(targetCol, onLand){
  // --- parametri fisici "reali" (puoi regolarli) ---
  const GRAVITY = 1600;          // px/s^2
  const AIR     = 0.002;         // attrito aria (0..0.01)
  const REST_PEG   = 0.55;       // coeff. restituzione su pioli
  const REST_WALLS = 0.62;       // coeff. restituzione su pareti/pavimento
  const FRICTION_T = 0.02;       // smorzamento tangenziale all'impatto
  const SUBSTEPS   = 2;          // integrazione in substep per stabilità

  return new Promise((resolve)=>{
    const grid = gridRef.current, ballEl = ballRef.current;
    if (!grid || !ballEl) { resolve(); return; }

    // geometrie base
    const rectGrid = grid.getBoundingClientRect();
    const cells = grid.querySelectorAll('.cell');
    const cols = layout.columns || 9;
    const rows = Math.floor(cells.length / cols);
    const targetIndex = (rows - 1) * cols + targetCol;
    const targetCell  = cells[targetIndex];
    const rectTarget  = targetCell.getBoundingClientRect();

    // start pos: centro della prima cella della colonna
    const firstRowCell = cells[targetCol];
    const rectStart = firstRowCell.getBoundingClientRect();
    const startX = rectStart.left + rectStart.width/2 - rectGrid.left;
    const startY = 8; // leggermente sotto il top della griglia

    // final slot range (solo per ricavare in quale bin entra)
    const boardW = rectGrid.width, boardH = rectGrid.height;
    const slotW  = boardW / cols;
    const groundY = boardH - 8; // terreno virtuale poco sopra il bordo

    // pegs (cerchi) con coordinate relative alla griglia
    const pegRadius = 6;
    const pegs = Array.from(grid.querySelectorAll('.peg')).map(p=>{
      const r = p.getBoundingClientRect();
      return {
        x: r.left + r.width/2 - rectGrid.left,
        y: r.top  + r.height/2 - rectGrid.top,
        r: pegRadius
      };
    });

    // stato palla
    const ballRect = ballEl.getBoundingClientRect();
    const BALL_R = Math.max(8, ballRect.width/2); // usa il diametro reale del tuo elemento
    let x = startX, y = startY;
    let vx = 0, vy = 0;

    // posiziona visivamente la palla all'inizio
    ballEl.style.transition = 'none';
    ballEl.style.left = `${x}px`;
    ballEl.style.top  = `${y}px`;
    ballEl.style.transform = 'translate(-50%, -50%)';

    // guida leggerissima verso la colonna target (serve solo ad evitare
    // derive eccessive se i pioli sono molto asimmetrici)
    function guideForce(){
      const desiredX = (targetCol + 0.5) * slotW;
      const dx = desiredX - x;
      return dx * 0.0008; // più alto = più “magnetismo” orizzontale
    }

    // simulazione
    let last = performance.now();
    if (dropAnimRef.current) cancelAnimationFrame(dropAnimRef.current);

    function step(now){
      let dt = (now - last) / 1000;
      last = now;
      // clamp per evitare salti enormi su tab inattivo
      dt = Math.min(dt, 0.033);

      const hdt = dt / SUBSTEPS;
      for (let s=0; s<SUBSTEPS; s++){
        // forze
        vy += GRAVITY * hdt;
        vx += guideForce();

        // attrito aria
        vx *= (1 - AIR);
        vy *= (1 - AIR);

        // integrazione
        x += vx * hdt;
        y += vy * hdt;

        // collisione con pioli (cerchio-cerchio)
        for (const p of pegs){
          const dx = x - p.x, dy = y - p.y;
          const dist = Math.hypot(dx, dy);
          const minD = BALL_R + p.r;
          if (dist < minD){
            // normale
            const nx = dx / (dist || 1), ny = dy / (dist || 1);
            // correggi penetrazione
            const pen = (minD - dist);
            x += nx * pen;
            y += ny * pen;
            // riflessione con restituzione
            const vN = vDot(vx, vy, nx, ny);
            const j = -(1 + REST_PEG) * vN;
            vx += j * nx;
            vy += j * ny;
            // smorzamento tangenziale (finto attrito)
            const tx = -ny, ty = nx;
            const vT = vDot(vx, vy, tx, ty);
            vx -= vT * FRICTION_T * tx;
            vy -= vT * FRICTION_T * ty;
          }
        }

        // pareti (AABB)
        const leftWall  = BALL_R;
        const rightWall = boardW - BALL_R;
        const topWall   = BALL_R;
        if (x < leftWall){ x = leftWall;  vx = Math.abs(vx) * REST_WALLS; }
        if (x > rightWall){ x = rightWall; vx = -Math.abs(vx) * REST_WALLS; }
        if (y < topWall){ y = topWall; vy = Math.abs(vy) * REST_WALLS; }

        // pavimento / bins
        if (y > groundY - BALL_R){
          y = groundY - BALL_R;
          vy = -Math.abs(vy) * REST_WALLS;

          // se l'energia è bassa, consideriamo “atterrato”
          const speed = vLen(vx, vy);
          if (speed < 40){
            // aggancia allo slot più vicino
            const idx = Math.max(0, Math.min(cols-1, Math.floor(x / slotW)));
            // piccola animazione di assestamento
            ballEl.style.transition = 'top 150ms cubic-bezier(.2,.9,.2,1)';
            ballEl.style.left = `${(idx + 0.5) * slotW}px`;
            ballEl.style.top  = `${y}px`;
            // chiudi animazione
            if (dropAnimRef.current) cancelAnimationFrame(dropAnimRef.current);
            try { if (typeof onLand === 'function') onLand(idx); } catch(_){}
            setTimeout(()=>resolve(), 220);
            return; // stop loop
          }
        }
      }

      // render palla
      ballEl.style.transition = 'none';
      ballEl.style.left = `${x}px`;
      ballEl.style.top  = `${y}px`;

      dropAnimRef.current = requestAnimationFrame(step);
    }

    dropAnimRef.current = requestAnimationFrame(step);
  });
}


  return (
    <div className="board">
      <Header onSpin={doSpin} onDemoSpin={doDemoSpin} onToggleStaff={()=>{ setStaffMode(!staffMode); setMessage('') }} spinning={spinning} staffMode={staffMode} />

      <Toasts rootRef={toastRootRef} />

      <Board layout={layout} highlightCol={highlightCol} prizeMap={prizeMap} fillerMap={fillerMap} prizeEmoji={prizeEmoji} gridRef={gridRef} ballRef={ballRef} />

      <div className="result">{message}</div>

      <PrizeList prizes={prizes} prizeEmoji={prizeEmoji} />

      {staffMode && (
        <StaffPanel
          staffSecret={staffSecret}
          setStaffSecret={setStaffSecret}
          staffAuthStatus={staffAuthStatus}
          tempColumns={tempColumns}
          setTempColumns={setTempColumns}
          applyColumns={applyColumns}
          authenticateStaff={authenticateStaff}
          staffAuthed={staffAuthed}
          addPrize={addPrize}
          handleSavePrizes={handleSavePrizes}
          editPrizes={editPrizes}
          updatePrizeField={updatePrizeField}
          removePrize={removePrize}
          getStatsAndUpdate={async ()=>{ try{ const j = await getStats(staffSecret); if (j.stats){ setStats(j.stats); showToast('Stats aggiornate','success') } else { setMessage('Non autorizzato o errore'); showToast('Errore aggiornamento stats','error') } }catch(e){ setMessage('Errore'); showToast('Errore comunicazione','error') } }}
          handleResetStats={handleResetStats}
          prizes={prizes}
          stats={stats}
        />
      )}

      <Footer />
    </div>
  )
}
