<template>
  <div id="nav" style="font-size: 30px">
  <p style="text-align: center"><a href="javascript:" @click.prevent.stop="home">
  <img style="height: 60px" src="favicon.svg"><img width=260 src="gridex.jpg"></a></p>
    <router-link tag="li" to="/markets">Markets</router-link><span style="color: #EEEEEE"> | </span>
    <router-link tag="li" to="/grid">Grid Trading</router-link><span style="color: #EEEEEE"> | </span>
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
  methods: {
    home() {
      this.$router.push('/');
    },
  },  
  async mounted() {
  }
}
</script>
