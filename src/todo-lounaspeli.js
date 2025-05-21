function renderPeers() {
  ids.peers = Object.values(peers)
  .toSorted()
  .map(score => score === null ? '👀' : '😋')
}

function reduceScore(lunch) {
  const score = Object.values(lunch.scores).reduce((total, score) => total + score)
  return score
}

function renderScoreboard() {
  const html = lunches
  .toSorted((a, b) => {
    const ascore = reduceScore(a)
    const bscore = reduceScore(b)
    return bscore - ascore
  })
  .map(lunch => {
    return {
      name: lunch.name,
      scores: formatScores(lunch.scores)
    }
  })
  .map(lunch => {
    const {name, scores} = lunch
    return ids.score.render({name, scores})
  })
  .join('')
  ids.scoreboard.innerHTML = html
}
renderScoreboard()

function formatScores(scores) {
  return Object
  .values(scores)
  .toSorted()
  .reverse()
  .map(val => val > 0 ? '✅' : '❌')
  .join('')
}

ids.copylink.addEventListener("click", copylink)
async function copylink(e) {
  await navigator.clipboard.writeText(window.location.href)
}