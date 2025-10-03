import React from 'react'

export default function PrizeList({ prizes, prizeEmoji }){
  return (
    <div className="prize-list">
      {prizes.map(p => (
        <div key={p.id} className="prize-card">
          <div className="prize-emoji">{prizeEmoji(p.label)}</div>
          <div className="prize-label">{p.label}</div>
        </div>
      ))}
    </div>
  )
}
