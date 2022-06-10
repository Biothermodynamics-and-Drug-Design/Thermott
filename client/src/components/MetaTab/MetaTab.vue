<template>
  <div class="mx-n3">
    <v-tabs v-model="tab" height="35" active-class="active-tab" style="border-bottom: 1px solid #bdbdbd">
      <!-- <v-tab key="exp_wells" @click="expWellEditorTabClick">Experiment wells editor</v-tab> -->

      <v-tab key="exp_wells" to="/MetaData/ExperimentWellsEditor">
        <v-chip color="primary" label small class="mr-2 px-1">2.1</v-chip>
        Experiment wells editor</v-tab
      >
      <v-tab key="exp_builder" to="/MetaData/BindingExperimentBuilder">
        <v-chip color="primary" label small class="mr-2 px-1">2.2</v-chip>
        Experiment builder
      </v-tab>
      <v-spacer />
      <v-tab key="advanced" to="/MetaData/MetaWizard">Advanced Wizard <v-icon color="grey" small>mdi-hammer-screwdriver</v-icon></v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item id="/MetaData/ExperimentWellsEditor">
        <router-view v-if="tab === '/MetaData/ExperimentWellsEditor'" />
      </v-tab-item>
      <v-tab-item id="/MetaData/BindingExperimentBuilder">
        <router-view v-if="tab === '/MetaData/BindingExperimentBuilder'" />
      </v-tab-item>
      <v-tab-item id="/MetaData/MetaWizard">
        <router-view v-if="tab === '/MetaData/MetaWizard'" />
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "@vue/composition-api";

export default defineComponent({
  setup() {
    const tab = ref("/MetaData/ExperimentWellsEditor");
    return { tab };
  },
});
</script>

<style>
.active-tab {
  background-color: #e0e0e0;
}
</style>
