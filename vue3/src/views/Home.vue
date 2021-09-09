<template>
  <h1><img src="/favicon.svg">&nbsp;My On-Chain Memos&nbsp;<img src="/favicon.svg"></h1>
  <div class="normal">
    <p>This small utility helps you write and read memos using the on-chain storage of smartBCH. </p>
    <p>This is a <a href="https://www.puredapp.org">Pure DApp</a>, which means its contract code and front-end code are both opensource and anyone can deploy them at anywhere.</p>
    <p>You can <a @click="read" href="">read</a> your existing memos and <a @click="write" href="">write</a> a new one. All the memos are encrypted with your public key and can only be decrypted with your private key. You will find it useful to store your accounts and passwords on websites here. As long as your account's mnemonic words are safe, these passwords are safe. Here we also provide a pure client-side <a @click="passgen" href="">password generator</a> which uses the safe <a href="https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues"><code>Crypto.getRandomValues()</code></a> function.</p>
    <p><b>CAVEAT:</b> This is an opensource software. It is provided “as is”, without warranty of any kind. Please use it <b>AT YOUR OWN RISK</b>.</p>
  </div>
</template>

<script>
export default {
  name: 'Home',
  methods: {
    read() {
      this.$router.push('read');
    },
    write() {
      this.$router.push('write');
    },
    passgen() {
      this.$router.push('passgen');
    } 
  }
}
</script>
