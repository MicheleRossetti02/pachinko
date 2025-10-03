export function prizeEmoji(label){
  const l = (label || '').toLowerCase();
  if (l.includes('birra')) return '🍺';
  if (l.includes('vino')) return '🍷';
  if (l.includes('rosè') || l.includes('rose')) return '🥂';
  if (l.includes('toast')) return '🥪';
  if (l.includes('nachos')) return '🌽';
  if (l.includes('niente') || l.includes('no')) return '▫️';
  return '🎁';
}

export function easeOutQuad(t){ return 1 - (1-t)*(1-t); }

export function weightedPickLocal(items){
  if (!items || items.length===0) return null;
  const total = items.reduce((s,it)=>s+(it.weight||1),0);
  const r = Math.random()*total;
  let acc=0;
  for (const it of items){ acc += (it.weight||1); if (r < acc) return it; }
  return items[items.length-1];
}

export function randomizeFillers(columns){
  const fillers = ['✨','🔔','💫','⭐','🍀','🎯','🎵','🍬','🟣','🔶'];
  const out = new Array(columns).fill(null).map(()=>fillers[Math.floor(Math.random()*fillers.length)]);
  return out;
}

export function randomizePrizeMap(prizesArr, columns, forcedPlacement){
  const map = new Array(columns).fill(null);
  const pool = prizesArr.slice();
  for (let i=pool.length-1;i>0;i--){ const r=Math.floor(Math.random()*(i+1)); [pool[i],pool[r]]=[pool[r],pool[i]]; }
  if (forcedPlacement && forcedPlacement.prizeId !== undefined){
    const idx = pool.findIndex(p=>p.id===forcedPlacement.prizeId);
    let prize = null;
    if (idx>=0) prize = pool.splice(idx,1)[0];
    else prize = prizesArr.find(p=>p.id===forcedPlacement.prizeId) || null;
    if (prize) map[forcedPlacement.column] = prize;
  }
  const freeCols = [];
  for (let c=0;c<columns;c++) if (!map[c]) freeCols.push(c);
  for (let i=0;i<pool.length && i<freeCols.length;i++){
    map[freeCols[i]] = pool[i];
  }
  return map;
}
