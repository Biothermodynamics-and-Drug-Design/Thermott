<template>
  <v-container fluid>
    <v-alert class="mt-2" border="left" text type="info" dense> Here are a collection of tools to automate metadata input </v-alert>

    <wizard-selections />

    <div class="d-flex justify-center">
      <v-spacer />
      <v-card class="mr-2 flex-grow-1 align-self-start" elevation="0" outlined>
        <v-card-title class="grey lighten-2 text-body-2 py-2">
          Experiment wells
          <v-spacer />
          <v-btn v-if="true" icon @click="showExpWellPreview = !showExpWellPreview">
            <v-icon>{{ showExpWellPreview ? "mdi-chevron-left" : "mdi-chevron-right" }}</v-icon>
          </v-btn>
        </v-card-title>
        <preview-exp-wells v-if="showExpWellPreview" :experiment-wells="appData.experimentWells" />
      </v-card>
      <v-card class="ml-2 flex-grow-1 align-self-start" elevation="0" outlined>
        <v-card-title class="grey lighten-2 text-body-2 py-2">
          Binding experiments
          <v-spacer />
          <v-btn v-if="true" icon @click="showBindingExpPreview = !showBindingExpPreview">
            <v-icon>{{ showBindingExpPreview ? "mdi-chevron-right" : "mdi-chevron-left" }}</v-icon>
          </v-btn>
        </v-card-title>
        <preview-binding-exp
          v-if="showBindingExpPreview"
          :experiment-wells="appData.experimentWells"
          :binding-experiments="appData.bindingExperiments"
        />
      </v-card>
      <v-spacer />
    </div>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref } from "@vue/composition-api";
import PreviewBindingExp from "./MetaDataWizard/PreviewBindingExp.vue";
import PreviewExpWells from "./MetaDataWizard/PreviewExpWells.vue";
import WizardSelections from "./MetaDataWizard/WizardSelections.vue";
import { useAppData } from "@/store";

export default defineComponent({
  components: { PreviewBindingExp, PreviewExpWells, WizardSelections },
  setup() {
    const appData = useAppData();

    const showExpWellPreview = ref(true);
    const showBindingExpPreview = ref(true);

    return { showExpWellPreview, showBindingExpPreview, appData };
  },
});
</script>

<style scoped>
.v-input--checkbox.small_checkbox >>> label {
  font-size: 0.9em;
}
</style>
<style>
.v-data-table__expanded__row {
  background-color: rgb(189, 189, 189);
}

.theme--light.v-data-table
  tbody
  tr.v-data-table__expanded__row:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) {
  background-color: rgb(189, 189, 189);
}

.v-expansion-panel-content__wrap {
  padding: 0;
}
</style>
