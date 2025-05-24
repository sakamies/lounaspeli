<script>
  import { slugify } from '$lib/slugify'
  import { onMount } from 'svelte'
  import { syncedStore, getYjsDoc } from "@syncedstore/core"
  import { svelteSyncedStore } from "@syncedstore/svelte"
  import { WebrtcProvider } from "y-webrtc"

  //Svelte stuff
  const { data } = $props()

  //Set up yjs for svelte
  const store = syncedStore({ players: {}, lunches: [] })
  const svelteStore = svelteSyncedStore(store)
  const ydoc = getYjsDoc(store)
  let awareness

  let playerName = $state('')
  let players = $state([])

  onMount(() => {
    playerName = localStorage.getItem('lounaspeli-playerName') || '👀'
    //start webrtcProvider only after mount because it's clientside
    const webrtcProvider = new WebrtcProvider(
      'lounaspeli-' + data.sessionid,
      ydoc,
      {
        password: 'hyvää oulua',
        signaling: [
          //'wss://y-webrtc-ckynwnzncc.now.sh',
          'ws://localhost:4444',
        ]
      }
    )

    awareness = webrtcProvider.awareness
    awareness.on('change', awarenessChanged)
    setPlayerName(playerName)
  })

  function exit() {
    //TODO: disconnect
  }

  function setPlayerName(name) {
    awareness.setLocalStateField('name', name)
    localStorage.setItem('lounaspeli-playerName', name)
  }

  function awarenessChanged(changes) {
    players = awareness.getStates().entries()
  }

  let newLunchName = $state('')
  function addLunch(e) {
    e.preventDefault()
    const value = newLunchName && newLunchName.trim()
    if (!value) return
    $svelteStore.lunches.push({
      adder: awareness.clientID,
      name: value,
      votes: {},
    })
    newLunchName = ''
  }

  function removeLunch (lunch) {
    $svelteStore.lunches.splice($svelteStore.lunches.indexOf(lunch), 1)
  }

  function vote(lunch, vote) {
    lunch.votes[awareness.clientID] = vote
    const myVotesSum = $svelteStore.lunches.reduce((total, lunch) => {
      return total + (lunch.votes[myid] || 0);
    }, 0);
    $svelteStore.players[awareness.clientID] = myVotesSum
  }

  function toggleAdmin(e) {
    const button = e.target
    const popover = button.nextElementSibling
    popover.hidden = !popover.hidden
    popover.setAttribute('aria-expanded', !popover.hidden)
  }

  async function copylink() {
    await navigator.clipboard.writeText(window.location.href)
  }
</script>

<svelte:head>
  <title>Lounaspeli {data.sessionid}</title>
</svelte:head>

<header class="header">
  <button onclick={exit}>Exit</button>
  <h1>Lounaspeli</h1>
  <p>
    <button onclick={copylink}>Kopioi linkki leikepöydälle</button>
  </p>
  <label for="playerName">Kuka pelaa?</label>
  <br>
  <input id="playerName" value="{playerName}" oninput={e => setPlayerName(e.target.value)}>
  <p class="players">
    {#each players as [id, player]}
      <span class="player">{player.name}</span>
    {/each}
  </p>
</header>

<form class="new-lunch" onsubmit={addLunch}>
  <label for="new-lunch-name">Ravinteli</label>
  <br>
  <input id="new-lunch-name" bind:value="{newLunchName}" />
  <button>Lisää</button>
</form>

{#each $svelteStore.lunches as lunch}
  <div class="lunch">
    <button class="like" onclick={() => vote(lunch, 1)}>👍</button>
    <h3 class="name">{lunch.name}</h3>
    <button class="delete" onclick={() => removeLunch(lunch)}>❌</button>
    <button class="diss" onclick={() => vote(lunch, -1)}>👎</button>
    <div class="votes">
      {#each Object.entries(lunch.votes) as [id, vote]}
        <span id="{id}-vote">
          {#if vote > 0}
            👍
          {:else if vote < 0}
            👎
          {/if}
        </span>
      {:else}
        &nbsp;
      {/each}
    </div>
  </div>
{/each}

<!--
<h2>Voittajat</h2>
<div id="scoreboard">Tähän voittajat lista</div>
-->