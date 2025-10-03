import React from 'react'

export default function Header({ onSpin, onDemoSpin, onToggleStaff, spinning, staffMode }){
  return (
    <div className="top-row">
      <div>
        <h2>Pachinko - Bar Edition</h2>
        <div style={{fontSize:13, color:'#e6d0ff'}}>Premi configurabili | Demo</div>
      </div>
      <div className="controls">
        <button className="btn" onClick={onSpin} disabled={spinning}>{spinning ? 'In corso...' : 'Gira!'}</button>
        <button className="btn" onClick={onDemoSpin} disabled={spinning} style={{marginLeft:8}}>Demo animazione</button>
        <button className="btn" onClick={onToggleStaff}>{staffMode ? 'Chiudi area staff' : 'Apri area staff'}</button>
      </div>
    </div>
  )
}
