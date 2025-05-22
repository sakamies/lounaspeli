<script>
  import { slugify } from '$lib/slugify'
  import { onMount } from 'svelte'
  import { syncedStore, getYjsDoc } from "@syncedstore/core"
  import { svelteSyncedStore } from "@syncedstore/svelte"
  import { WebrtcProvider } from "y-webrtc"

  let { data } = $props()

  const store = syncedStore({ players: {}, lunches: [] })
  const svelteStore = svelteSyncedStore(store)
  const doc = getYjsDoc(store)

  let myid = $state('ville') //This should be a normal emtpy string and not a reactive state, but making it reactive for now so I can test different ids in different tabs locally
  onMount(() => {
    myid = localStorage.getItem('lounaspeli-myid') || crypto.randomUUID()
    localStorage.setItem('lounaspeli-myid', myid)
    $svelteStore.players[myid] = null
    console.log(data.sessionid)
    //TODO: this gives timeouts, maybe I'm rate limited or something because it's a free server.
    const webrtcProvider = new WebrtcProvider('lounaspeli-' + data.sessionid, doc, 'hyvää oulua')
  })

  let newLunchName = $state('')
  function addLunch() {
    const value = newLunchName && newLunchName.trim()
    if (!value) return
    $svelteStore.lunches.push({
      adder: myid,
      name: value,
      votes: {},
    })
    newLunchName = ''
  }

  function removeLunch (lunch) {
    $svelteStore.lunches.splice($svelteStore.lunches.indexOf(lunch), 1)
  }

  function vote(lunch, vote) {
    lunch.votes[myid] = vote
    const myVotesSum = $svelteStore.lunches.reduce((total, lunch) => {
      return total + (lunch.votes[myid] || 0);
    }, 0);
    $svelteStore.players[myid] = myVotesSum
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

<header class="header">
  <input bind:value="{myid}" />
  <br>
  <a href="/">Uusi peli</a>
  <h1>Lounaspeli</h1>
  <p>
    {#each Object.values($svelteStore.players) as voteSum}
      {#if voteSum === null}
        👀
      {:else if voteSum > 0}
        👍
      {:else if voteSum < 0}
        👎
      {:else}
        🤔
      {/if}
    {/each}
  </p>
  <p>
    <small hidden>({data.sessionid})</small>
    <button on:click={copylink}>Kopioi linkki</button>
  </p>
</header>

<form class="new-lunch" on:submit|preventDefault={addLunch}>
  <label for="new-lunch-name">Ravinteli</label>
  <br>
  <input id="new-lunch-name" bind:value="{newLunchName}" />
  <button>Lisää</button>
</form>

{#each $svelteStore.lunches as lunch}
  <div class="lunch">
    <button class="like" on:click={() => vote(lunch, 1)}>👍</button>
    <h3 class="name">{lunch.name}</h3>
    <button class="delete" on:click={() => removeLunch(lunch)}>❌</button>
    <button class="diss" on:click={() => vote(lunch, -1)}>👎</button>
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
        ← Äänestäkää →
      {/each}
    </div>
  </div>
{/each}

<!--
<h2>Voittajat</h2>
<div id="scoreboard">Tähän voittajat lista</div>
-->