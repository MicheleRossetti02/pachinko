import React, { useState, useEffect, useRef } from 'react'
import { getState, postSpin, postPrizes, getStats, resetStats } from './api'
import { prizeEmoji, easeOutQuad, weightedPickLocal, randomizePrizeMap, randomizeFillers } from './utils'
import Header from './components/Header'
import Toasts from './components/Toasts'
import Board from './components/Board'
// PrizeList rimosso come richiesto
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
  return new Promise((resolve) => {
    const grid = gridRef.current, ballEl = ballRef.current;
    if (!grid || !ballEl) { resolve(); return; }

    // Parametri fisici
    const GRAVITY = 1000;      // più lenta per aumentare la durata
    const AIR = 0.0018;        // leggera resistenza, mantiene energia per più rimbalzi
    const REST_PEG = 0.88;     // rimbalzi vivaci sui pioli
    const REST_WALLS = 0.88;   // rimbalzi vivaci sulle pareti
    const FRICTION_T = 0.035;  // smorzamento tangenziale moderato
    const NOISE_MAG = 90;      // intensità del rumore laterale
    const WIND_FREQ = 4.5;     // frequenza del "vento" laterale
    const SUBSTEPS = 2;        // numero di sub-step per frame
    
    // Geometrie base
    const rectGrid = grid.getBoundingClientRect();
    const cells = grid.querySelectorAll('.cell');
    const cols = layout.columns || 9;
    const rows = Math.floor(cells.length / cols);
    
    // Dimensioni e limiti
    const boardW = rectGrid.width, boardH = rectGrid.height;
    const slotW = boardW / cols;
    const groundY = boardH - 8; // terreno virtuale poco sopra il bordo
    
    // Start pos: centro della prima cella della colonna
    const firstRowCell = cells[targetCol];
    if (!firstRowCell) { resolve(); return; } // Protezione
    
    const rectStart = firstRowCell.getBoundingClientRect();
    const startX = rectStart.left + rectStart.width/2 - rectGrid.left;
    const startY = 8; // leggermente sotto il top della griglia
    
    // Mappa i pioli in coordinate relative alla griglia
    const pegRadius = 6;
    const pegs = Array.from(grid.querySelectorAll('.peg')).map(p => {
      const r = p.getBoundingClientRect();
      return {
        x: r.left + r.width/2 - rectGrid.left,
        y: r.top + r.height/2 - rectGrid.top,
        r: pegRadius
      };
    });
    
    // Stato palla
    const ballRect = ballEl.getBoundingClientRect();
    const BALL_R = Math.max(8, ballRect.width/2);
    let x = startX, y = startY;
    
    // Inizializza una piccola velocità orizzontale per evitare cadute perfettamente verticali
    let vx = (Math.random() - 0.5) * 100;
    let vy = 0;
    
    // Timer per rilevare se la pallina resta bloccata in alto
    const stuckStartTime = performance.now();
    const stuckThresholdY = startY + 60;
    let stuckPushed = false;
    
    // Posiziona visivamente la palla all'inizio
    ballEl.style.transition = 'none';
    ballEl.style.left = `${x}px`;
    ballEl.style.top = `${y}px`;
    ballEl.style.transform = 'translate(-50%, -50%)';
    
    // Cancella eventuale animazione precedente
    if (dropAnimRef.current) cancelAnimationFrame(dropAnimRef.current);
    
    // Simulazione
    let last = performance.now();
    
    const noisePhase = Math.random() * Math.PI * 2;
    function step(now) {
      let dt = (now - last) / 1000;
      last = now;
      
      // Clamp per evitare salti enormi su tab inattivo
      dt = Math.min(dt, 0.033);
      
      // Anti-stallo: se la palla resta troppo tempo nella parte superiore senza cadere
      if (!stuckPushed && (now - stuckStartTime) > 2000 && y < stuckThresholdY) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        vx += dir * 200;    // spinta laterale verso sinistra o destra
        stuckPushed = true;
      }
      
      // Integrazione fisica con sub-stepping per stabilità
      const hdt = dt / SUBSTEPS;
      for (let s = 0; s < SUBSTEPS; s++) {
        // Forze: gravità + rumore laterale per movimento più imprevedibile
        const timeSec = now / 1000;
        const wind = Math.sin(timeSec * WIND_FREQ + noisePhase) * NOISE_MAG; // vento sinusoidale
        const jitter = (Math.random() - 0.5) * NOISE_MAG * 0.35;             // jitter casuale

        // Integrazione velocità (semi-implicita)
        vy += GRAVITY * hdt;
        vx += (wind + jitter) * hdt;
        
        // Attrito dell'aria (smorzamento velocità)
        vx *= (1 - AIR);
        vy *= (1 - AIR);
        
        // Integrazione posizione
        x += vx * hdt;
        y += vy * hdt;
        
        // Collisione con i pioli
        for (const peg of pegs) {
          const dx = x - peg.x;
          const dy = y - peg.y;
          const dist = Math.hypot(dx, dy);
          const minDist = BALL_R + peg.r;
          
          if (dist < minDist) {
            // Normalizzazione vettore normale
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            
            // Correzione penetrazione
            const penetration = minDist - dist;
            x += nx * penetration;
            y += ny * penetration;
            
            // Calcolo velocità relativa lungo la normale
            const vn = vx * nx + vy * ny;
            
            // Componenti tangenziali
            const tx = -ny;
            const ty = nx;
            const vt = vx * tx + vy * ty;
            
            // Impulso elastico con restituzione
            if (vn < 0) {
              // Nuovo impulso normale con restituzione
              const j = -(1 + REST_PEG) * vn;
              vx += j * nx;
              vy += j * ny;
              
              // Smorzamento tangenziale (attrito)
              vx -= vt * FRICTION_T * tx;
              vy -= vt * FRICTION_T * ty;

              // Piccolo impulso casuale lungo la tangente per aumentare imprevedibilità
              const randT = (Math.random() - 0.5) * 120;
              vx += randT * tx * 0.5;
              vy += randT * ty * 0.5;
            }
          }
        }

        // Limita la velocità massima per evitare salti irrealistici
        const maxSpeed = 1200;
        const spd = Math.hypot(vx, vy);
        if (spd > maxSpeed) { const scale = maxSpeed / spd; vx *= scale; vy *= scale; }
        
        // Collisione con le pareti laterali
        if (x < BALL_R) {
          x = BALL_R;
          vx = Math.abs(vx) * REST_WALLS;
        } else if (x > boardW - BALL_R) {
          x = boardW - BALL_R;
          vx = -Math.abs(vx) * REST_WALLS;
        }
        
        // Collisione con il tetto
        if (y < BALL_R) {
          y = BALL_R;
          vy = Math.abs(vy) * REST_WALLS;
        }
        
        // Collisione con il pavimento e "tubo" di cattura
        if (y >= groundY - BALL_R) {
          // Aggancia la pallina al tubo della colonna in cui è caduta
          y = groundY - BALL_R;

          // Determina la colonna/tubo più vicino
          const idx = Math.max(0, Math.min(cols-1, Math.floor(x / slotW)));
          const slotCenterX = (idx + 0.5) * slotW;

          // Blocca nel tubo: nessun movimento orizzontale, x centrata nel tubo
          x = slotCenterX;
          vx = 0;

          // Smorza rapidamente la velocità verticale fino a fermo
          vy *= 0.25;
          
          // Se praticamente ferma, termina e notifica l'atterraggio
          if (Math.abs(vy) < 5) {
            ballEl.style.transition = 'none';
            ballEl.style.left = `${x}px`;
            ballEl.style.top = `${y}px`;
            if (typeof onLand === 'function') onLand(idx);
            if (dropAnimRef.current) cancelAnimationFrame(dropAnimRef.current);
            resolve();
            return;
          }
        }
      }
      
      // Aggiorna la posizione visiva della pallina
      ballEl.style.transition = 'none';
      ballEl.style.left = `${x}px`;
      ballEl.style.top = `${y}px`;
      
      // Continua l'animazione
      dropAnimRef.current = requestAnimationFrame(step);
    }
    
    // Avvia l'animazione
    dropAnimRef.current = requestAnimationFrame(step);
  });
}


  return (
    <div className="board">
      <Header onSpin={doSpin} onDemoSpin={doDemoSpin} onToggleStaff={()=>{ setStaffMode(!staffMode); setMessage('') }} spinning={spinning} staffMode={staffMode} />

      <Toasts rootRef={toastRootRef} />

      <Board layout={layout} highlightCol={highlightCol} prizeMap={prizeMap} fillerMap={fillerMap} prizeEmoji={prizeEmoji} gridRef={gridRef} ballRef={ballRef} />

      <div className="result">{message}</div>

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
