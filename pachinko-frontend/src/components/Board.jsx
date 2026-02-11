import React from 'react'

/**
 * Board
 * - Contiene la GRIGLIA (coordinate della simulazione) -> ref={gridRef}
 * - Ogni cella ha posizione relativa (serve per ancorare i pioli)
 * - I PIOLI (.peg) sono elementi assoluti dentro la cella (cerchi)
 * - L'ULTIMA RIGA contiene emoji premio/filler (solo UI)
 * - La PALLINA (.ball) è un overlay assoluto nel sistema di coordinate della griglia -> ref={ballRef}
 */
export default function Board({ layout, highlightCol, prizeMap, fillerMap, prizeEmoji, gridRef, ballRef }){
  const cols = layout.columns || 9
  const rows = 14 // più righe = campo più profondo

  return (
    // --- 1) CONTENITORE GRIGLIA (sistema di riferimento della fisica) ---
    <div
      ref={gridRef}
      className="grid first-row"
      style={{
        position: 'relative',                        // necessario: la ball si muove relativamente a questo box
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '6px',
        overflow: 'hidden',                           // evita overflow della ball
      }}
      aria-label="Pachinko Playfield"
      role="group"
    >
      {
        // --- 2) CELLE + PIOLI + CONTENUTI DI RIGA FINALE ---
        (() => {
          const arr = []
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const isFirstRow = (r === 0)
              const isLastRow  = (r === rows - 1)
              const rowOffsetClass = `row-offset-${r % 2}`

              // Highlighter sulla prima riga (effetto "pre-scelta" colonna)
              const classes = `cell ${rowOffsetClass}` + (isFirstRow && c === highlightCol ? ' highlight' : '')

              // Mappatura premio / filler in ultima riga (solo UI)
              const prizeHere = (isLastRow && prizeMap && prizeMap[c]) ? prizeMap[c] : null
              const filler    = (isLastRow && !prizeHere && fillerMap && fillerMap[c]) ? fillerMap[c] : null

              // Offset verticale del piolo per dare variazione visiva (non influenza la fisica: la fisica legge .peg reali)
              const pegTop = 8 + (r * 2) % 16

              arr.push(
                <div
                  key={`cell-${r}-${c}`}
                  className={classes}
                  style={{
                    position: 'relative',             // richiesto per posizionare .peg dentro la cella
                    minHeight: 36
                  }}
                >
                  {/* --- 2a) PIOLI (griglia uniforme: righe pari centrali, righe dispari doppio peg) --- */}
                  {!isFirstRow && !isLastRow && (
                    r % 2 === 0 ? (
                      // Righe pari: peg centrale
                      <div
                        className="peg"
                        style={{
                          position: 'absolute',
                          top: pegTop,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.18)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.6) inset'
                        }}
                      />
                    ) : (
                      // Righe dispari: due peg (30% e 70%) per aumentare i rimbalzi
                      <>
                        <div
                          className="peg peg-left"
                          style={{
                            position: 'absolute',
                            top: pegTop,
                            left: '30%',
                            transform: 'translateX(-50%)',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.18)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.6) inset'
                          }}
                        />
                        <div
                          className="peg peg-right"
                          style={{
                            position: 'absolute',
                            top: pegTop,
                            left: '70%',
                            transform: 'translateX(-50%)',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.18)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.6) inset'
                          }}
                        />
                      </>
                    )
                  )}

                  {/* --- 2b) CONTENUTI DI FONDO: premio (se presente) --- */}
                  {isLastRow && prizeHere && (
                    <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', fontSize: 16 }}>
                      {prizeEmoji(prizeHere.label)}
                    </div>
                  )}

                  {/* --- 2c) CONTENUTI DI FONDO: filler (se nessun premio in quella colonna) --- */}
                  {isLastRow && !prizeHere && filler && (
                    <div className="filler-emoji" style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', fontSize: 16 }}>
                      {filler}
                    </div>
                  )}
                </div>
              )
            }
          }
          return arr
        })()
      }

      {/* --- 3) PALLINA (overlay assoluto, mossa dalla fisica via animateDropToColumn) --- */}
      <div
        ref={ballRef}
        className="ball"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 22,
          height: 22,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle at 30% 30%, #ffffff, #f2d97f 40%, #d98a14 100%)',
          pointerEvents: 'none',
          zIndex: 20
        }}
        aria-label="Ball"
      />
    </div>
  )
}
