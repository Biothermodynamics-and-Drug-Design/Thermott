<template>
  <v-app>
    <v-container fill-height fluid justify-center align-center>
      <v-card class="ma-0" elevation="0" outlined>
        <v-card-title class="grey lighten-2">
          Developer settings
          <v-spacer />
        </v-card-title>


      </v-card>

    </v-container>
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from "@vue/composition-api";
import {  } from "@/utils/localStorage";
import { useAppSettings } from "@/store";

export default defineComponent({
  setup() {
    const appSettings = useAppSettings();


    return { };
  },
});
</script>

