<template>
  <v-app class="ma-2">
    <v-container fill-height fluid>
      <v-row
align="center"
      justify="center">
      <v-col>
      <v-card color="gray" class="ma-2" elevation="0">
        
     
        <v-card-title class="text-center justify-center">
          <img class="mx-4" src="/otter_error.png" style="max-height: 12em; width:auto" />
      
          <div class="text-h2">Sorry, page not found</div>
        </v-card-title>
        <v-card-text class="text-center mr-3 mt-3">
          <v-btn text href="/" class="text-h6"><v-icon>mdi-home</v-icon> Go back to homepage </v-btn>
        </v-card-text>
      </v-card>
       </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, onMounted } from '@vue/composition-api'

export default defineComponent({
  setup() {

    onMounted(() =>{
      document.title = "Thermott | Page not found";
    })
    
  },
})
</script>

