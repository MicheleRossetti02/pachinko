export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export async function getState(){
  const r = await fetch(`${API_BASE}/state`);
  if (!r.ok) throw new Error('Failed to fetch state');
  return r.json();
}

export async function postSpin(){
  const r = await fetch(`${API_BASE}/spin`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({}) });
  return r.json();
}

export async function postPrizes(prizes, layout, secret){
  const r = await fetch(`${API_BASE}/prizes`, { method:'POST', headers:{ 'Content-Type':'application/json', 'x-staff-secret': secret }, body: JSON.stringify({ prizes, layout }) });
  return r.json();
}

export async function getStats(secret){
  const r = await fetch(`${API_BASE}/stats`, { headers:{ 'x-staff-secret': secret } });
  return r.json();
}

export async function resetStats(secret){
  const r = await fetch(`${API_BASE}/stats/reset`, { method:'POST', headers:{ 'x-staff-secret': secret }});
  return r.json();
}
