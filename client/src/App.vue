<template>
  <div id="app">
    <v-slide-x-transition mode="out-in">
      <router-view />
    </v-slide-x-transition>
  </div>
</template>
<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "App",

  components: {},

  data: () => ({
    //
  }),
});
</script>
