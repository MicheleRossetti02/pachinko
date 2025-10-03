function weightedPick(items){
  const total = items.reduce((s,it)=>s + (it.weight||1), 0);
  const r = Math.random() * total;
  let acc = 0;
  for (const it of items){
    acc += (it.weight||1);
    if (r < acc) return it;
  }
  return items[items.length-1];
}

module.exports = { weightedPick };
