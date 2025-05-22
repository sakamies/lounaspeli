<script>
  import { onMount } from 'svelte'

  let sessionid = ''
  onMount(() => {
    sessionid = crypto.randomUUID()
  })
</script>

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
