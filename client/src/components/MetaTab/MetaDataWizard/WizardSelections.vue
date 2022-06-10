<template>
  <v-card class="d-flex flex-row ma-2 pa-2" elevation="0" outlined>
    <v-card elevation="0" outlined>
      <v-card-title class="text-subtitle-1 grey lighten-3 pa-1 px-3">Method</v-card-title>
      <v-divider />
      <v-tabs v-model="tabs" vertical class="selection-tab">
        <v-tab key="label">Label based</v-tab>
        <v-tab key="index">Index based</v-tab>
        <v-tab key="group">Group based</v-tab>
      </v-tabs>
    </v-card>

    <v-tabs-items v-model="tabs">
      <v-tab-item key="label">
        <meta-label-based-group :model-value="appData" />
      </v-tab-item>
      <v-tab-item key="index">
        <meta-index-based-group />
      </v-tab-item>
      <v-tab-item key="group">
        <meta-property-based-group :model-value="appData" />
      </v-tab-item>
    </v-tabs-items>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, ref } from "@vue/composition-api";
import MetaLabelBasedGroup from "./LabelBasedGroup.vue";
import MetaIndexBasedGroup from "./IndexBasedGroup.vue";
import MetaPropertyBasedGroup from "./PropertyBasedGroup.vue";
import { useAppData } from "@/store";
export default defineComponent({
  components: { MetaLabelBasedGroup, MetaIndexBasedGroup, MetaPropertyBasedGroup },
  setup() {
    const appData = useAppData();
    const tabs = ref(1);
    return { appData, tabs };
  },
});
</script>

<style scoped>
.selection-tab >>> .v-tab {
  width: 150px;
  height: 30px;
}

.active-tab {
  background-color: #ce2e2e !important;
}
</style>
