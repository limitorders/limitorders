<template>
  <div id="nav" style="font-size: 30px">
  <p style="text-align: center"><img style="height: 60px" src="favicon.svg"><img width=260 src="gridex.jpg"></p>
    <router-link tag="li" to="/">Home</router-link><span style="color: #EEEEEE"> | </span>
    <router-link tag="li" to="/markets">Markets</router-link><span style="color: #EEEEEE"> | </span>
    <router-link tag="li" to="/grid">Grid</router-link><span style="color: #EEEEEE"> | </span>
    <router-link tag="li" to="/exchange">Exchange</router-link><span style="color: #EEEEEE"> | </span>
    <router-link tag="li" to="/history">History</router-link>
  </div>
  <br>
  <router-view/>
</template>

<style>
</style>  

<script>
export default {
  data() {
    return {
    }
  },
  async mounted() {
      this.$router.push('/');
  }
}
</script>
