// import {listen} from '.vendor/form.js'
import {ids} from './memelib.js'
import {lunches, opinions, myid, sessionid} from './mock.js'

function join(sessionid) {
  const event = new CustomEvent('joined', {detail: myid})
  document.dispatchEvent(event)
}

function send(dispo, lunchid) {
  const event = new CustomEvent('action', {detail: [myid, dispo, lunchid]})
  document.dispatchEvent(event)
}

document.addEventListener('joined', e => {
  //When someone joins, add an object to opinions to hold their likes and disses.
  const clientid = e.detail
  console.log(clientid, 'joined session')
  opinions[clientid] = {}
})

document.addEventListener('action', e => {
  //When someone likes or disses a lunchs, add their opinion to the opinions object.
  const [clientid, dispo, lunchid] = e.detail
  console.log(opinions)
  opinions[clientid][lunchid] = dispo
  //TODO: check here if everybody in the session likes an option, show in in the liked tab
  //TODO: check here if everybody in the session disses an option, show in in the disses tab
})

ids.copylink.addEventListener("click", copylink)
async function copylink(e) {
  await navigator.clipboard.writeText(window.location.href)
}

ids.lunches.insertAdjacentHTML('beforeend', lunches.map(lunch => ids.lunch.render(lunch)).join(''))
document.addEventListener('click', e => {
  const {name, value} = e.target
  if (name === 'like') like(value)
  if (name === 'diss') diss(value)
})

function like(id) {
  console.log('I like', id)
  ids.liked.append(ids[id])
  send('like', id)
}

function diss(id) {
  console.log('I diss', id)
  ids.dissed.append(ids[id])
  send('diss', id)
}

//Start stuff
join(sessionid) //Join session on page load based on url. /?s=sess-id-xyz