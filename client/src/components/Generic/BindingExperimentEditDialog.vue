<template>
  <v-dialog v-model="_dialog" max-width="900" persistent>
    <v-card v-if="tempBindingExp">
      <v-card-title class="grey lighten-2">
        #{{ tempBindingExp.id + " " + tempBindingExp.name }}
        <v-spacer></v-spacer>
        <v-icon class="mr-2" @click="closeDialog">mdi-close</v-icon>
      </v-card-title>

      <v-card-text v-if="tempBindingExp" class="pa-0">
        <v-tabs v-model="_tab">
          <v-tab key="general"> General </v-tab>
          <v-tab key="experimentWells"> Experiment wells </v-tab>
        </v-tabs>

        <v-divider />

        <v-tabs-items v-model="_tab">
          <!-- general tab -->
          <v-tab-item key="general" class="mt-6 px-2">
            <div>
              <div class="d-flex flex-row flex-wrap spaced-children">
                <v-text-field v-model="tempBindingExp.name" dense outlined label="Experiment name" />
              </div>
              <div class="d-flex flex-row flex-wrap spaced-children">
                <v-text-field v-model="tempBindingExp.protein" dense outlined label="Protein name" />
                <v-text-field v-model="tempBindingExp.ligand" dense outlined label="Ligand name" />
              </div>

              <div class="d-flex flex-row align-center">
                <v-divider style="flex-grow: 0.05" />
                <span class="text-subtitle-1 font-weight-bold mx-2">Parameters</span>
                <v-divider style="flex-grow: 1" />
              </div>

              <div class="d-flex flex-row spaced-children justify-start mt-4">
                <v-text-field v-model.number="protein_conc" dense outlined label="Protein conc.">
                  <template #append>μM</template>
                  <template #prepend><Param parameter="Pt" />*</template>
                </v-text-field>
                <v-text-field v-model.number="tempBindingExp.params.T0" dense outlined label="Temperature" class="ml-4">
                  <template #append>°C</template>
                  <template #prepend><Param parameter="T0" />*</template>
                </v-text-field>

                <v-text-field
                  label="Binding constant"
                  :value="inputKb"
                  class="ml-4"
                  outlined
                  dense
                  @change="
                    setKb($event);
                    tempBindingExp.params.Kb_confidence_interval = null;
                  "
                >
                  <template #append><Param parameter="M-1" /></template>
                  <template #prepend><Param parameter="Kb" /></template>
                </v-text-field>
              </div>

              <div class="d-flex flex-row spaced-children mt-4">
                <v-text-field v-model.number="tempBindingExp.params.DuH_Tr" suffix="J/mol" outlined dense @change="selectedPreset = null">
                  <template #prepend><Param parameter="DuH_Tr" />*</template>
                </v-text-field>
                <v-text-field v-model.number="tempBindingExp.params.DuCp" suffix="J/(mol⋅K)" outlined dense @change="selectedPreset = null">
                  <template #prepend><Param parameter="DuCp" />*</template>
                </v-text-field>
              </div>

              <div class="d-flex flex-row spaced-children">
                <v-text-field v-model.number="tempBindingExp.params.DbH_T0" suffix="J/mol" outlined dense @change="selectedPreset = null">
                  <template #prepend><Param parameter="DbH_T0" />*</template>
                </v-text-field>
                <v-text-field v-model.number="tempBindingExp.params.DbCp" suffix="J/(mol⋅K)" outlined dense @change="selectedPreset = null">
                  <template #prepend><Param parameter="DbCp" />*</template>
                </v-text-field>
              </div>
              <!-- <v-spacer></v-spacer>
                <v-checkbox v-model="applyToInnerElements" label="Apply inner"></v-checkbox> -->
            </div>
          </v-tab-item>
          <!-- Experiment wells tab -->
          <v-tab-item key="experimentWells" class="pa-2">
            <ExperimentWellSpreadsheet
              :binding-experiment="tempBindingExp"
              :experiment-wells="tempExperimentWells"
              @update:bindingExperiment="tempBindingExp = $event"
              @update:experimentWells="tempExperimentWells = $event"
            />
          </v-tab-item>
        </v-tabs-items>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions>
        <!-- <v-btn class="ma-2" small @click="changeEditMode" v-if="tab == 1">
          <div v-if="!editMode">Edit Mode</div>
          <div v-else>Normal view</div>
        </v-btn> -->
        <v-select
          v-if="tab === 0"
          v-model="selectedPreset"
          :items="modelPresets"
          item-text="protein"
          no-data-text="No presets"
          class="ml-4"
          dense
          :multiple="false"
          return-object
          persistent-hint
          label="Parameter presets"
          @change="applyPreset"
        ></v-select>

        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="applyChanges">Apply</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, Ref, ref, watch } from "@vue/composition-api";
import ExperimentWellSpreadsheet from "@/components/Generic/ExperimentWellSpreadsheet.vue";
import Param from "./DisplayParamater.vue";
import { getExperimentWells, copyExperimentWells } from "@/utils/utils";
import { confirmDialog } from "./confirmdialog";
import { useAppSettings } from "@/store";
import { BindingExperiment, BindingThermodynamicPreset, ExperimentWell } from "@/models";
import { useNotify } from "./GlobalSnackbarStore";

export default defineComponent({
  components: { Param, ExperimentWellSpreadsheet },
  props: {
    bindingExperiment: Object as PropType<BindingExperiment>,
    experimentWells: Array as PropType<ExperimentWell[]>,
    dialog: Boolean,
    tab: Number,
  },
  emits: ["update-dialog", "update-tab"],
  setup(props, { emit }) {
    const notify = useNotify();

    const _dialog = computed({
      get() {
        return props.dialog;
      },
      set(value: boolean) {
        emit("update-dialog", value);
      },
    });

    watch(
      () => props.dialog,
      (newVal) => {
        if (newVal) {
          copyAll();
        }
      }
    );

    const _tab = computed({
      get() {
        return props.tab;
      },
      set(value: number) {
        emit("update-tab", value);
      },
    });

    const appSettings = useAppSettings();

    const tempBindingExp: Ref<BindingExperiment | null> = ref(null);
    const tempExperimentWells: Ref<ExperimentWell[]> = ref([]);
    const selectedPreset: Ref<BindingThermodynamicPreset | null> = ref(null);

    const modelPresets = computed(() => appSettings.BindingParamPresets);

    const editTable: Ref<any> = ref(null);

    //micromolar protein concentration
    const protein_conc = computed({
      get() {
        return tempBindingExp.value?.params?.Pt * 10 ** 6;
      },
      set(value: number) {
        tempBindingExp.value.params.Pt = value / 10 ** 6;
      },
    });

    const copyAll = () => {
      tempBindingExp.value = {
        ...props.bindingExperiment,
        params: { ...props.bindingExperiment.params },
      };

      const experimentWells = getExperimentWells(props.bindingExperiment.expPointIndexes, props.experimentWells);
      tempExperimentWells.value = copyExperimentWells(experimentWells);
    };

    const inputKb = computed(() => {
      const value = tempBindingExp.value.params.Kb;
      if (!Number.isNaN(value) && value != null && value.toString().trim() != "") return value?.toExponential(2);
      else return value?.toString();
    });

    const setKb = (value: any) => {
      const parsedValue = Number.parseFloat(value);
      if (Number.isNaN(parsedValue)) tempBindingExp.value.params.Kb = NaN;
      else tempBindingExp.value.params.Kb = parsedValue;
    };

    const deleteExperimentWell = async (experimentWell: ExperimentWell) => {
      const index = tempExperimentWells.value.findIndex((x) => x.id === experimentWell.id);
      if (index > -1) {
        const res = (await confirmDialog({
          text: `Do want to remove this experiment well\n(#${experimentWell.id} ${experimentWell.name})?`,
        })) as boolean;
        if (!res) return;
        tempExperimentWells.value.splice(index, 1);
        tempBindingExp.value.expPointIndexes = tempBindingExp.value.expPointIndexes.filter((x) => x !== experimentWell.id);
      }
    };

    const spreadsheetHeaders = [
      { value: "id", text: "id", type: "number", readonly: true, ratio: 0.05 },
      { value: "name", text: "name", readonly: false, ratio: 0.4 },
      { value: "protein", text: "protein", ratio: 0.25 },
      //{ value: "protein_conc", text: "protein conc. (μM)",type: "number", scaleFactor:10**6,  ratio: 0.075 },
      //{ value: "ligand", text: "ligand", ratio: 0.19 },
      {
        value: "ligand_conc",
        text: "ligand conc. (μM)",
        type: "number",
        scaleFactor: 10 ** 6,
        ratio: 0.075,
      },
      {
        value: "tm_model_params.Tm",
        text: "Tm",
        type: "number",
        readonly: true,
        ratio: 0.03,
      },
      {
        value: "",
        text: " ",
        type: "action",
        readonly: true,
        ratio: 0.5,
        actions: [
          {
            target: "self",
            icon: "mdi-delete",
            function: deleteExperimentWell,
          },
        ],
      },
    ];

    const applyPreset = (data: BindingThermodynamicPreset) => {
      tempBindingExp.value.params.DuH_Tr = data.DuH_Tr;
      tempBindingExp.value.params.DuCp = data.DuCp;
      tempBindingExp.value.params.DbH_T0 = data.DbH_T0;
      tempBindingExp.value.params.DbCp = data.DbCp;
      if (tempBindingExp.value.protein == null || tempBindingExp.value.protein.trim().length == 0) {
        tempBindingExp.value.protein = data.protein;
      }
    };

    const closeDialog = () => {
      _dialog.value = false;
      _tab.value = 0;
      //_bindingExperiment.value = null;
      tempBindingExp.value = null;
      tempExperimentWells.value = [];
      selectedPreset.value = null;
      // if (this.editMode) this.changeEditMode();
    };

    const applyChanges = () => {
      props.bindingExperiment.name = tempBindingExp.value.name;
      props.bindingExperiment.ligand = tempBindingExp.value.ligand;
      props.bindingExperiment.protein = tempBindingExp.value.protein;
      props.bindingExperiment.expPointIndexes = tempBindingExp.value.expPointIndexes;
      props.bindingExperiment.params = { ...tempBindingExp.value.params };

      for (const expWellIndex of props.bindingExperiment.expPointIndexes) {
        const expWell = props.experimentWells.find((x) => x.id == expWellIndex);
        const tempExpWell = tempExperimentWells.value.find((x) => x.id == expWellIndex);

        if (!expWell || !tempExpWell) continue;

        expWell.name = tempExpWell.name;
        expWell.protein = tempExpWell.protein;
        //expWell.protein_conc = tempExpWell.protein_conc;
        expWell.protein_conc = props.bindingExperiment.params.Pt;
        expWell.ligand = tempExpWell.ligand;
        expWell.ligand_conc = tempExpWell.ligand_conc;
      }
      notify("Changed applied", "success");
      closeDialog();
    };

    return {
      _tab,
      _dialog,
      modelPresets,
      selectedPreset,
      tempExperimentWells,
      tempBindingExp,
      spreadsheetHeaders,
      editTable,
      inputKb,
      setKb,
      applyPreset,
      protein_conc,
      closeDialog,
      applyChanges,
    };
  },
});

// interface EditDialogModel {
//   dialog: boolean;
//   editBindingExperiment: BindingExperiment;
//   tab: number;
// }
</script>

<style scoped>
.spaced-children > * {
  padding: 5px;
  padding-left: 10px;
  padding-right: 10px;
}
</style>
