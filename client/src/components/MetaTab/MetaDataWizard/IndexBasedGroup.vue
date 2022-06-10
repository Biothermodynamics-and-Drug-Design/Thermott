<template>
  <v-container>
    <div class="d-flex flex-row spaced-children">
      <v-text-field v-model.number="indexModel.pointNumber" outlined dense label="Split every points" hide-details></v-text-field>
      <v-text-field v-model.number="indexModel.startingConc_uM" outlined dense label="starting conc (uM)" hide-details></v-text-field>
      <v-text-field v-model.number="indexModel.dilutionFactor" outlined dense label="dilution factor" hide-details></v-text-field>
    </div>
    <div class="d-flex flex-wrap align-center">
      <v-checkbox v-model="indexModel.lowestConcIsControl" dense label="Assume lowest conc. control" hide-details> </v-checkbox>
      <v-checkbox v-model="indexModel.reversedConc" dense label="Reversed order conc." hide-details></v-checkbox>
      <v-checkbox v-model="indexModel.createBindingExperiments" dense label="Create binding experiments" hide-details></v-checkbox>
      <v-btn small color="primary" class="mx-2" depressed @click="applyMethod">
        <v-icon class="mr-2">mdi-check</v-icon>
        Apply
      </v-btn>
    </div>
  </v-container>
</template>

<script lang="ts">
import { useAppData } from "@/store";
import { defineComponent, Ref, ref } from "@vue/composition-api";
import { IndexBasedGroup, IndexBasedModel } from "./MetaDataWizardFunc";

export default defineComponent({
  name: "MetaIndexBasedGroup",
  setup() {
    const appData = useAppData();

    const indexModel: Ref<IndexBasedModel> = ref({
      pointNumber: 0,
      dilutionFactor: 0,
      startingConc_uM: 0,
      lowestConcIsControl: true,
      reversedConc: false,
      createBindingExperiments: true,
    });

    const applyMethod = () => (appData.bindingExperiments = IndexBasedGroup(appData.experimentWells, indexModel.value));

    return {
      indexModel,
      applyMethod,
    };
  },
  methods: {},
});
</script>

<style scoped>
.spaced-children > * {
  padding: 10px;
}
</style>
