<script>
  import { onMount } from 'svelte'

  let sessionid = ''
  onMount(() => {
    //TODO: use nanoid instead so the url isn't so nasty.
    sessionid = crypto.randomUUID()
  })
</script>

<svelte:head>
  <title>Lounaspeli</title>
</svelte:head>

<header>
  <h1>Lounaspeli</h1>
</header>

<form action="{sessionid}">
  <p>
    <button>Aloita</button>
  </p>
  <p>
    <small>
      ({sessionid})
    </small>
  </p>
</form>
