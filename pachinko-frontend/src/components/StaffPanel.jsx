import React from 'react'

export default function StaffPanel({
  staffSecret, setStaffSecret, staffAuthStatus, tempColumns, setTempColumns,
  applyColumns, authenticateStaff, staffAuthed, addPrize, handleSavePrizes,
  editPrizes, updatePrizeField, removePrize, getStatsAndUpdate, handleResetStats,
  prizes, stats
}){
  return (
    <div className="staff">
      <div className="row">
        <div className="col">
          <label>Password staff (demo)</label>
          <input value={staffSecret} onChange={e=>{ setStaffSecret(e.target.value); }} placeholder="x-staff-secret" style={{ border: staffAuthStatus==='success' ? '2px solid #2ecc71' : (staffAuthStatus==='error' ? '2px solid #e74c3c' : undefined) }} />
        </div>
        <div style={{width:260, display:'flex', gap:8, alignItems:'center'}}>
          <label>Colonne board</label>
          <input type="number" value={tempColumns} onChange={e=> setTempColumns(Math.max(3, Math.min(40, Number(e.target.value)||3)))} />
          <button className="btn" onClick={applyColumns} type="button">Applica colonne</button>
          <button className="btn" onClick={authenticateStaff} type="button" style={{marginLeft:8}}>{staffAuthed ? 'Rilogga' : 'Accedi'}</button>
        </div>
      </div>

      {staffAuthed ? (
        <>
          <div style={{marginTop:10}}>
            <button className="btn" onClick={addPrize} type="button">Aggiungi premio</button>
            <button style={{marginLeft:8}} className="btn" onClick={handleSavePrizes} type="button">Salva premi</button>
          </div>

          <div style={{marginTop:10}}>
            {editPrizes.map((p,i)=>(
              <div key={p.id} style={{display:'flex', gap:8, marginBottom:8, alignItems:'center'}}>
                <input value={p.label} onChange={e=>updatePrizeField(i,'label', e.target.value)} style={{width:180}} />
                <input type="number" value={p.weight} onChange={e=>updatePrizeField(i,'weight', Number(e.target.value)||0)} style={{width:80}} />
                <input placeholder="column or empty" value={ p.column === null ? '' : String(p.column)} onChange={e=> updatePrizeField(i,'column', e.target.value === '' ? null : Number(e.target.value))} style={{width:100}} />
                <button onClick={()=>removePrize(i)} className="btn" type="button">Rimuovi</button>
              </div>
            ))}
          </div>

          <div style={{marginTop:10}}>
            <button className="btn" onClick={getStatsAndUpdate} type="button">Aggiorna Stats dal server</button>
            <button className="btn" style={{marginLeft:8}} onClick={handleResetStats} type="button">Reset stats</button>
          </div>

          <div style={{marginTop:12}}>
            <div style={{fontWeight:700, marginBottom:6}}>{`Giocate totali: ${stats.plays || 0}`}</div>
            <div className="staff-stats">
              {prizes.map(p=> (
                <div key={`stat-${p.id}`} className="prize-card">
                  <div className="prize-emoji">{p.label && p.label[0]}</div>
                  <div className="prize-label">{p.label}</div>
                  <div className="win-badge">{(stats.wins && stats.wins[p.id]) ? stats.wins[p.id] : 0}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{marginTop:10, color:'#d0c0c0'}}>Inserisci password staff e premi Accedi per visualizzare opzioni riservate</div>
      )}
    </div>
  )
}
