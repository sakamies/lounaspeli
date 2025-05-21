<script>
  import { slugify } from '$lib/slugify'
  import { svelteStore, doc } from "$lib/store"
  import { WebrtcProvider } from "y-webrtc"

  let { data } = $props()

  //TODO: enable realtime sync with this.
  // export const webrtcProvider = new WebrtcProvider('lounaspeli-' + data.sesionid, doc)

  let newLunch = ''

  const addLunch = () => {
    const value = newLunch && newLunch.trim()

    if (!value) return

    $svelteStore.lunches.push({
      name: value,
      kelpaa: true
    })

    newLunch = ''
  }

  const removeLunch = lunch => {
    $svelteStore.lunches.splice($svelteStore.lunches.indexOf(lunch), 1)
  }
</script>

<header>
  <h1>Lounaspeli</h1>
  <p>
    <button id="copylink">Kopioi linkki</button>
  </p>
  (<p>Session id: {data.sessionid}</p>)
  <p id="peers">Tähän peers</p>
</header>

<form on:submit|preventDefault={addLunch}>
  <p>
    <label for="new-lunch">Uusi ravinteli</label>
    <input id="new-lunch" bind:value={newLunch} />
    <button>Lisää</button>
  </p>
</form>

<ul class="lunches">
  {#each $svelteStore.lunches as lunch}
    <li class="lunch">
      <input id="{slugify(lunch.name)}" type="checkbox" bind:checked={lunch.kelpaa} />
      <label class="lunch-name" for="{slugify(lunch.name)}">{lunch.name}</label>
      <button on:click={() => removeLunch(lunch)}>Delete</button>
    </li>
  {/each}
</ul>

<!--
<h2>Voittajat</h2>
<div id="scoreboard">Tähän voittajat lista</div>
-->