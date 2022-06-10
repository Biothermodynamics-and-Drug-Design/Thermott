<template>
  <div class="pa-2">
    <div v-if="exampleLabel.length > 0" class="d-flex flex-row mb-3">
      <v-sheet class="grey lighten-4 d-flex flex-row pa-2" rounded>
        <div class="text-subtitle-1 font-weight-bold pa-2">Example</div>
        <div v-for="(label, index) in exampleLabel" :key="index" class="d-flex flex-column mx-2">
          <div class="align-self-center font-weight-bold primary--text">{{ index + 1 }}</div>
          <div>{{ label }}</div>
        </div>
      </v-sheet>
    </div>
    <div class="d-flex flex-row">
      <v-select
        v-model.number="labelModel.protein"
        dense
        outlined
        hide-details
        :menu-props="{ bottom: true, offsetY: true }"
        label="Protein name"
        :items="wordList"
        item-text="label"
        item-value="index"
        class="mx-1 disabled-text-color"
      ></v-select>
      <v-select
        v-model.number="labelModel.protein_conc"
        dense
        outlined
        hide-details
        :menu-props="{ bottom: true, offsetY: true }"
        label="Protein conc."
        :items="wordList"
        item-text="label"
        item-value="index"
        class="mx-1"
      ></v-select>
      <v-select
        v-model.number="labelModel.ligand"
        dense
        outlined
        hide-details
        :menu-props="{ bottom: true, offsetY: true }"
        label="Ligand name"
        :items="wordList"
        item-text="label"
        item-value="index"
        class="mx-1"
      ></v-select>
      <v-select
        v-model.number="labelModel.ligand_conc"
        dense
        outlined
        hide-details
        :menu-props="{ bottom: true, offsetY: true }"
        label="Ligand conc."
        :items="wordList"
        item-text="label"
        item-value="index"
        class="mx-1"
      ></v-select>
      <v-btn icon @click="clearSelection">
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <!-- <v-select
        dense
        outlined
        hide-details
        :menu-props="{ bottom: true, offsetY: true }"
        v-model.number="labelModel.run"
        label="Experiment group"
        :items="wordList"
        item-text="label"
        item-value="index"
        class="mx-1"
      ></v-select> -->
    </div>
    <div class="d-flex flex-row align-center justify-space-around">
      <v-switch v-model="createBindingExperiments" label="Create binding experiments" inset />
      <v-btn small color="primary" depressed @click="applyMethod">
        <v-icon class="mr-2">mdi-check</v-icon>
        Apply all
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "@vue/composition-api";
import { AppData } from "@/models";
import { getMaxWordsUsed, WordEntry, LabelBasedModel } from "./MetaDataWizardFunc";

export default defineComponent({
  name: "MetaPropertyBasedGroup",
  props: {
    modelValue: AppData,
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const appData = computed({
      get: () => props.modelValue,
      set: (value: AppData) => emit("update:modelValue", value),
    });

    const word_count = ref(0);
    const seperator = ref(" ");
    const createBindingExperiments = ref(true);

    const labelModel = ref({
      protein: -1,
      ligand: -1,
      ligand_conc: -1,
      protein_conc: -1,
      run: -1,
    });

    const wordList = computed(() => {
      const wordList: WordEntry[] = [{ label: "None", index: null, disabled: false }];
      const CalcMaxWordsUsed = getMaxWordsUsed(appData.value.experimentWells);
      word_count.value = CalcMaxWordsUsed.word_count;
      seperator.value = CalcMaxWordsUsed.seperator;

      for (let index = 0; index < word_count.value; index++) {
        const isDisabled =
          index == labelModel.value.protein ||
          index == labelModel.value.ligand ||
          index == labelModel.value.ligand_conc ||
          index == labelModel.value.protein_conc;
        wordList.push({ label: `${index + 1} word`, index: index, disabled: isDisabled });
      }

      return wordList;
    });

    const exampleLabel = computed(() => {
      return appData.value.experimentWells[0]?.name.replace(/\s+/g, " ").trim().split(seperator.value) ?? [];
    });

    const applyMethod = () => {
      LabelBasedModel(appData.value, labelModel.value, seperator.value, createBindingExperiments.value);
      emit("update:modelValue", appData.value);
    };

    const clearSelection = () => {
      labelModel.value = {
        protein: -1,
        ligand: -1,
        ligand_conc: -1,
        protein_conc: -1,
        run: -1,
      };
    };

    return {
      appData,
      labelModel,
      word_count,
      createBindingExperiments,
      exampleLabel,
      clearSelection,
      applyMethod,
      wordList,
    };
  },
});
</script>

<style>
.v-input .v-input__control .v-input__slot .v-select__slot .v-select__selection--disabled {
  color: black !important;
}
</style>
