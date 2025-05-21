<script>
  let sessionid = crypto.randomUUID()
</script>

<form action="{sessionid}">
  <p>
    <label>id</label>
    <input name="jep" value="{sessionid}" style="width: 36ch">
  </p>
  <p>
    <button>Uusi peli</button>
  </p>
</form>
