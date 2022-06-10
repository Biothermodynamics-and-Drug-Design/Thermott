<template>
<v-sheet outlined rounded class="pa-0 pr-1">
  <div class="d-flex flex-row flex-wrap align-top">
  <div class="pa-1 mr-2 grey lighten-3">Raw filenames</div>
  <div>
    <div class="d-flex flex-column">
    <div v-for="file in originFiles" :key="file.id">
    #{{ file.id }} {{ file.name }}</div>
  </div>
  </div>
  </div>

  
  
</v-sheet>
</template>

<script lang="ts">
import { useAppData } from '@/store'
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  setup() {
    const appData = useAppData();

    const originFiles = appData.originFiles;

    return {originFiles};
  },
})
</script>




