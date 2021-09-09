<template>
  <h1>Generate a Random Password</h1>
  <div class="normal">
  <p style="text-align: center;"><button @click="genPass">Generate</button><br/><br/><code>{{password}}</code></p>
  </div>
</template>

<style>
button {
    font-size:24px;
    width:200px;
}
</style>


<script>
export default {
  data() {
    return {
      password: "",
    }
  },
  methods: {
    genPass() {
      var arr = new Uint32Array(16);
      window.crypto.getRandomValues(arr);
      var s = '!@#$%^&*_+:<>?|;,.~abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      var res = []
      for (var i = 0; i < arr.length; i++) {
        res.push(s.charAt(arr[i]%s.length));
      }
      this.password = res.join("")
    }
  }
}
</script>
