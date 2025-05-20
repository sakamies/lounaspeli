// import {listen} from '.vendor/form.js'
import {ids} from './memelib.js'
import {elements, value, change, listen} from './form.js'
import {peers, lunches, myid, sessionid} from './mock.js'

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

function join(sessionid) {
  const event = new CustomEvent('joined', {detail: {clientid: myid}})
  document.dispatchEvent(event)
}

function sendScore(lunchname, score) {
  const event = new CustomEvent('score', {detail: {lunchname, clientid: myid, score}})
  renderScoreboard()
  document.dispatchEvent(event)
}

document.addEventListener('joined', e => {
  const {clientid} = e.detail
  console.log(clientid, 'joined session')
  peers[clientid] = null
  renderPeers()
  //send lunches to peer when someone joins?
  //or fetch lunch list from somewhere?
  //is there a host or is it truly peer based?
})

document.addEventListener('score', e => {
  const {lunchname, clientid, score} = e.detail
  const lunchScores = lunches.find(x => x.name === lunchname).scores
  lunchScores[clientid] = score
  peers[clientid] += score
  renderPeers()
  renderScoreboard()
})

ids.lunches.insertAdjacentHTML('beforeend',
  lunches
  .map(lunch => ids.lunch.render(lunch))
  .join('')
)
document.addEventListener('click', e => {
  const {name, value} = e.target
  if (name === 'like') like(value)
  if (name === 'diss') diss(value)
})

function like(lunchname) {
  console.log(`I like "${lunchname}"`)
  sendScore(lunchname, 1)
}

function diss(lunchname) {
  console.log(`I diss "${lunchname}"`)
  sendScore(lunchname, -1)
}

//Start stuff
join(sessionid) //Join session on page load based on url. /?s=sess-id-xyz



ids.copylink.addEventListener("click", copylink)
async function copylink(e) {
  await navigator.clipboard.writeText(window.location.href)
}