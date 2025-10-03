import React from 'react'

export default function Toasts({ rootRef }){
  return <div ref={rootRef} style={{position:'fixed', right:20, top:20, zIndex:9999}} />
}
