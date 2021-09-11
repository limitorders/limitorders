<template>
  <h1><img src="/favicon.svg">&nbsp;A Simple DEX with Limit Orders&nbsp;<img src="/favicon.svg"></h1>
  <div class="normal">
    <p>Here we implements a very simple DEX which supports limited orders. We hope it can be a useful complement to the AMM-based DEX markets on smartBCH.</p>
    <p>Currently, only grid orders for <a href="">grid trading</a> are supported. The orders must be placed as a pair: a sell-order at a higher price and a buy-order at a lower price. The money got in the dealt sell-order will be automatically placed in the corresponding buy-order, and vice-versa. If you do not want to sell (buy), just use a very high (low) price in the sell (buy) order, respectively.</p>
    <p>This is a <a href="https://www.puredapp.org">Pure DApp</a>, which means its contract code and front-end code are both opensource and anyone can deploy them at anywhere.</p>
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
