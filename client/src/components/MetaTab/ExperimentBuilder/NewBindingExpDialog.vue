<template>
  <v-dialog v-model="dialog" persistent max-width="700">
    <template #activator="{ on, attrs }">
      <div style="position: relative">
        <v-row class="drag_hide ml-1">
          <v-btn class="my-5" color="primary" small v-bind="attrs" depressed v-on="on" @click="openDialog"
            >Create binding experiment {{ selectedExperimentWellIndexes.length > 0 ? "(From selected)" : "(Blank)" }}</v-btn
          >
        </v-row>
        <v-row no-gutters class="text-center text-subtitle-1 drag_show pa-0 mx-3" style="position: absolute; left: 0; top: 0; width: 400%">
          <v-alert border="left" color="primary" class="py-1 px-4" dark>
            Drag here to create new binding experiment with selected experiment wells
          </v-alert>
        </v-row>
      </div>
      <!-- </drop> -->
    </template>

    <demo-component class="mb-2" @fillbindingexperiment="demo_fillmetadata" />

    <v-card>
      <v-card-title class="grey lighten-2 mb-2 text-subtitle-1"
        >Create binding experiment
        <v-spacer />
        <v-btn icon @click.stop="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-alert v-if="getExpWells.length === 0" border="bottom" colored-border type="info" elevation="0">
          No experiment wells selected.
        </v-alert>
        <v-alert v-else border="bottom" colored-border type="success" elevation="0">
          Selected Experiment wells ({{ getExpWells.map((x) => x.id).join(",") }}).
        </v-alert>

        <v-alert v-if="!validateExperimentWellsLigandConc" border="bottom" colored-border type="error" elevation="0">
          Not all experiment wells have a defined ligand concentration {{ invalidExperimentWells }}. Define them in Experiment Well Editor.
        </v-alert>
        <v-alert v-if="!validateExperimentWellsProteinConc" border="bottom" colored-border type="warning" elevation="0">
          Not all experiment wells have the same protein concentration. Edit them in Experiment Well Editor.
        </v-alert>

        <v-form ref="form" v-model="formModel">
          <v-row no-gutters class="py-2">
            <v-text-field v-model.trim="name" label="Experiment name" outlined dense></v-text-field>
            <v-text-field v-model.trim="protein_name" label="Protein name" outlined dense class="ml-3"></v-text-field>
            <v-text-field v-model.trim="ligand_name" label="Ligand name" outlined dense class="ml-3"></v-text-field>
          </v-row>
          <v-row no-gutters class="pb-1">
            <v-text-field v-model="protein_conc_uM" label="protein conc." suffix="μM" outlined dense class="mr-6" :rules="rules">
              <template #prepend>
                <div class="mt-1"><Param parameter="Pt" />*</div>
              </template>
            </v-text-field>
            <v-text-field
              v-model.number="thermodynamic_parameters.T0"
              label="Binding temperature"
              suffix="°C"
              outlined
              dense
              class="ml-3"
              :rules="rules"
              @change="thermo_param_change"
            >
              <template #prepend>
                <div class="mt-1"><Param parameter="T0" />*</div>
              </template>
            </v-text-field>
          </v-row>

          <div class="d-flex flex-row">
            <v-card elevation="0" outlined style="flex: 1">
              <v-card-title class="text-subtitle-1 pa-1 pl-2 grey lighten-2">
                Unfolding parameters
                <v-spacer />
                <!-- <v-btn v-if="!predictParamsModel" x-small outlined color="success" @click='predictParamsModel = true'>Predict unfolding parameters</v-btn> -->
                <help-tooltip>
                  <div style="max-width: 300px">
                    Unfolding parameters can be determined using differential scanning calorimetry (DSC) or predicted using protein residue
                    count.
                  </div>
                </help-tooltip>
              </v-card-title>
              <!-- <v-card-text :class="{'d-flex': true, 'align-center': true, 'flex-row': !predictParamsModel, 'flex-column': predictParamsModel, 'pt-4': true}"> -->
              <v-card-text class="d-flex flex-row flex-wrap pt-5 px-4 pb-1">
                <v-text-field
                  v-model="thermodynamic_parameters.DuH_Tr"
                  label="Enthalpy of unfolding"
                  suffix="J/mol"
                  outlined
                  dense
                  :rules="rules"
                  @change="thermo_param_change"
                >
                  <template #prepend>
                    <div class="mt-1"><Param parameter="DuH_Tr" />*</div>
                  </template>
                </v-text-field>
                <v-text-field
                  v-model.number="thermodynamic_parameters.DuCp"
                  label="Heat capacity of unfolding"
                  suffix="J/(mol⋅K)"
                  outlined
                  dense
                  :rules="rules"
                  @change="thermo_param_change"
                >
                  <template #prepend>
                    <div class="mt-1"><Param parameter="DuCp" />*</div>
                  </template>
                </v-text-field>
              </v-card-text>
            </v-card>

            <v-expand-transition mode="out-in">
              <v-card v-if="true" elevation="0" outlined class="grey lighten-4 ml-1" transition="slide-x-transition">
                <v-card-title class="text-subtitle-1 pa-1 pl-2">
                  Predict unfolding parameters
                  <!-- <v-spacer />
                  <v-btn icon color="grey" @click="predictParamsModel = false">
                    <v-icon>mdi-close</v-icon>
                  </v-btn> -->
                </v-card-title>
                <v-divider />
                <v-card-text>
                  <div class="d-flex flex-column justify-center align-center">
                    <v-text-field
                      v-model="predictParamsResidueCount"
                      label="Protein residue count"
                      hide-details
                      outlined
                      dense
                      :rules="rules"
                      class="my-2"
                      style="max-width: 200px"
                    />
                    <!-- <v-btn x-small icon outlined color="success" class="ml-2" @click='predictUnfoldingParams'>
                      <v-icon>mdi-check</v-icon>
                    </v-btn> -->
                    <v-btn small outlined color="success" class="my-2" @click="predictUnfoldingParams">
                      Apply
                      <v-icon class="ml-2">mdi-check</v-icon>
                    </v-btn>
                    <a class="text-decoration-none text-caption" href="https://doi.org/10.1021/cr960383c" target="_href"
                      >(Robertson &amp; Murphy, 1997)</a
                    >
                  </div>
                </v-card-text>
              </v-card>
            </v-expand-transition>
          </div>

          <div class="d-flex flex-row mt-2">
            <v-card elevation="0" outlined rounded style="flex: 1">
              <v-card-title class="text-subtitle-1 pa-1 pl-2 grey lighten-2">
                <div>Binding parameters</div>
                <v-spacer />
                <!-- <v-btn x-small outlined color="success" @click='setTypicalBindingParams'>Apply typical binding parameters</v-btn> -->
                <help-tooltip>
                  <div style="max-width: 350px">
                    Binding parameters can be determined using isothermal calorimetry (ITC) or set to a typical value. <br />
                    Binding parameters are less significant when determining <i>K</i><sub>b</sub> and <i>K</i><sub>d</sub>.
                  </div>
                </help-tooltip>
              </v-card-title>
              <v-card-text class="d-flex flex-row flex-wrap align-center pt-5 px-4 pb-1">
                <v-text-field
                  v-model.number="thermodynamic_parameters.DbH_T0"
                  label="Enthalpy of binding"
                  suffix="J/mol"
                  outlined
                  dense
                  :rules="rules"
                  @change="thermo_param_change"
                >
                  <template #prepend>
                    <div class="mt-1"><Param parameter="DbH_T0" />*</div>
                  </template>
                </v-text-field>
                <v-text-field
                  v-model.number="thermodynamic_parameters.DbCp"
                  label="Heat capacity of binding"
                  suffix="J/(mol⋅K)"
                  outlined
                  dense
                  :rules="rules"
                  @change="thermo_param_change"
                >
                  <template #prepend>
                    <div class="mt-1"><Param parameter="DbCp" />*</div>
                  </template>
                </v-text-field>
              </v-card-text>
            </v-card>

            <v-card elevation="0" outlined class="grey lighten-4 ml-1" style="min-width: 200px">
              <v-card-title class="text-subtitle-1 pa-1 px-2">Typical binding parameters</v-card-title>
              <v-divider />
              <v-card-text class="d-flex flex-column justify-center align-center">
                <v-btn small outlined color="success" class="my-4" @click="setTypicalBindingParams">
                  Apply
                  <v-icon class="ml-2">mdi-check</v-icon>
                </v-btn>
                <a class="text-decoration-none text-caption" href="https://doi.org/10.1002/0470011122.ch6" target="_href"
                  >(Matulis &amp; Todd, 2004)</a
                >
                <a class="text-decoration-none text-caption" href="https://doi.org/10.1021/bi048135v" target="_href"
                  >(Matulis <i>et al</i>, 2005)</a
                >
              </v-card-text>
            </v-card>
          </div>
        </v-form>
      </v-card-text>
      <v-divider class="my-1" />
      <v-card-actions class="px-4">
        <v-autocomplete
          v-model="selectedPreset"
          :items="ModelPresets"
          item-text="protein"
          no-data-text="No presets"
          dense
          outlined
          hide-details
          return-object
          persistent-hint
          label="Parameter presets"
          @change="applyPreset"
        ></v-autocomplete>

        <v-spacer />
        <span class="text--caption font-weight-light" justify="center"> (*) required fields </span>
        <v-spacer />
        <v-btn small class="ml-3" color="primary" depressed @click="createBindingExperiment">
          Add
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { useNotify } from "@/components/Generic/GlobalSnackbarStore";
import { BindingExperiment, BindingModelParams, BindingThermodynamicPreset, ExperimentWell } from "@/models";
import { useAppData, useAppSettings } from "@/store";
import { Predict_dCp, Predict_dHu } from "@/utils/api_hub";
import { getExperimentWellsFromIndexes } from "@/utils/bindingexperiment_manager";
import { validationRules } from "@/utils/validationRules";
import { defineComponent, PropType, computed, ref, Ref } from "@vue/composition-api";
import { v4 as uuidv4 } from "uuid";
import * as BindingExperimentFactory from "@/utils/bindingexperiment_manager";
import { getExperimentWells } from "@/utils/utils";
import demoComponent from "../../Generic/Demo/DemoCard.vue";
import HelpTooltip from "@/components/Generic/HelpTooltip.vue";

export default defineComponent({
  components: { demoComponent, HelpTooltip },
  props: { selectedExperimentWellIndexes: Array as PropType<number[]> },
  emits: ["createdbindingexperiment", "open-new-binding-experiment-dialog"],
  setup(props, { emit }) {
    const appData = useAppData();
    const appSettings = useAppSettings();
    const notify = useNotify();
    const form: Ref<any> = ref(null);

    const ModelPresets = computed(() => appSettings.BindingParamPresets);

    const getExpWells = computed(() => getExperimentWellsFromIndexes(props.selectedExperimentWellIndexes));

    const validateExperimentWellsLigandConc = computed(() => {
      const expWells = getExperimentWellsFromIndexes(props.selectedExperimentWellIndexes) as ExperimentWell[];
      return !expWells.find((x) => Number.isNaN(x.ligand_conc) || x.ligand_conc === null);
    });

    const validateExperimentWellsProteinConc = computed(() => {
      const expWells = getExperimentWellsFromIndexes(props.selectedExperimentWellIndexes);
      const set = new Set(expWells.map((x) => x.protein_conc));
      const size = set.size;
      return size <= 1;
    });

    const invalidExperimentWells = computed(() => {
      const expWells = getExperimentWellsFromIndexes(props.selectedExperimentWellIndexes);
      return `(${expWells
        .filter((x) => Number.isNaN(x.ligand_conc) || x.ligand_conc === null)
        .map((x) => x.id)
        .join(", ")})`;
    });

    const rules = [validationRules.exists, validationRules.numeric];

    const dialog = ref(false);
    const formModel = ref(false);
    const name = ref("");
    const ligand_name = ref("");
    const protein_name = ref("");
    const protein_conc_uM: Ref<number> = ref(null);
    const selectedPreset: Ref<BindingThermodynamicPreset> = ref(null);

    const predictParamsModel = ref(false);
    const predictParamsResidueCount = ref(300);

    function resetPredictParams(): void {
      predictParamsResidueCount.value = 300;
      predictParamsModel.value = false;
    }

    const thermodynamic_parameters: Ref<BindingModelParams> = ref({
      DuH_Tr: null,
      DuCp: null,
      DbH_T0: null,
      DbCp: null,
      Tr: null,
      T0: appSettings.DefaultModelParameters.DefaultBindingModelT0,
      Kb: null,
      Pt: null,
      ActiveLigandFraction: 1,
    });

    async function predictUnfoldingParams(): Promise<void> {
      const dCp_res = await Predict_dCp({ n_residues: predictParamsResidueCount.value, molecular_weight: null });
      const dHu_res = await Predict_dHu({ n_residues: predictParamsResidueCount.value, molecular_weight: null });
      if (dCp_res.ok && dHu_res) {
        thermodynamic_parameters.value.DuCp = dCp_res.dCp;
        thermodynamic_parameters.value.DuH_Tr = dHu_res.dHu;
        notify("Parameters predicted", "success", 5_000);
      } else {
        notify("Failed to predict parameters", "error", 5_000);
      }
      //resetPredictParams();
    }

    function setTypicalBindingParams(): void {
      thermodynamic_parameters.value.DbH_T0 = -40_000;
      thermodynamic_parameters.value.DbCp = -800;
    }

    function createBindingExperiment() {
      if (formModel.value === false) {
        form.value.validate();
        return;
      }

      const params: BindingModelParams = {
        DuH_Tr: thermodynamic_parameters.value.DuH_Tr,
        DuCp: thermodynamic_parameters.value.DuCp,
        DbH_T0: thermodynamic_parameters.value.DbH_T0,
        DbCp: thermodynamic_parameters.value.DbCp,
        T0: thermodynamic_parameters.value.T0,
        Tr: 0,
        Kb: 0,
        Pt: protein_conc_uM ? protein_conc_uM.value / 10 ** 6 : 0,
        ActiveLigandFraction: 1,
      };
      console.log([...props.selectedExperimentWellIndexes]);

      const bindingExp: BindingExperiment = {
        id: null,
        uuid: uuidv4(),
        comment: "",
        //id: getNewBindingExpIndex(appData.bindingExperiments),
        name: name.value,
        expPointIndexes: [...props.selectedExperimentWellIndexes],
        ligand: ligand_name.value,
        protein: protein_name.value,
        params: params,
      };
      BindingExperimentFactory.createBindingExperiment(bindingExp);
      //appData.bindingExperiments.push(blankBindingExp);
      props.selectedExperimentWellIndexes.splice(0, props.selectedExperimentWellIndexes.length);
      notify("New binding experiment created", "success");
      emit("createdbindingexperiment", bindingExp);

      closeDialog();
    }

    function resetThermodynamicParameters() {
      thermodynamic_parameters.value = {
        DuH_Tr: null,
        DuCp: null,
        DbH_T0: null,
        DbCp: null,
        Tr: null,
        T0: appSettings.DefaultModelParameters.DefaultBindingModelT0,
        Kb: null,
        Pt: null,
        ActiveLigandFraction: 1,
      };
    }

    function thermo_param_change() {
      selectedPreset.value = null;
    }

    function openDialog() {
      dialog.value = true;
      const expWells =
        props.selectedExperimentWellIndexes.length > 0
          ? getExperimentWells(props.selectedExperimentWellIndexes, appData.experimentWells)
          : [];
      protein_name.value = expWells.map((x) => x.protein).filter((x) => x !== null)[0] || null;
      ligand_name.value = expWells.map((x) => x.ligand).filter((x) => x !== null)[0] || null;
      protein_conc_uM.value = expWells.map((x) => x.protein_conc).filter((x) => x !== null)[0] * 10 ** 6 || null;
      name.value = protein_name.value && ligand_name.value ? `${protein_name.value} ${ligand_name.value}` : null;
      if (protein_name.value != null) {
        const preset = ModelPresets.value.find((x) => x.protein === protein_name.value.trim());

        if (preset != undefined) {
          selectedPreset.value = preset;
          applyPreset(selectedPreset.value);
        }
      }
      emit("open-new-binding-experiment-dialog");
    }

    function closeDialog() {
      dialog.value = false;
      form.value.resetValidation();
      selectedPreset.value = null;
      resetThermodynamicParameters();
      protein_name.value = null;
      protein_conc_uM.value = null;
      ligand_name.value = null;
    }

    function applyPreset(data: BindingThermodynamicPreset) {
      thermodynamic_parameters.value.DuH_Tr = data.DuH_Tr;
      thermodynamic_parameters.value.DuCp = data.DuCp;
      thermodynamic_parameters.value.DbH_T0 = data.DbH_T0;
      thermodynamic_parameters.value.DbCp = data.DbCp;
      protein_name.value = data.protein;
    }

    function demo_fillmetadata() {
      name.value = "Binding exp. 1";
      ligand_name.value = "VD11-31-2";
      protein_name.value = "CAXIII";
      thermodynamic_parameters.value.DuH_Tr = 460000;
      thermodynamic_parameters.value.DuCp = 17000;
      thermodynamic_parameters.value.DbH_T0 = -42000;
      thermodynamic_parameters.value.DbCp = -800;
      protein_conc_uM.value = 10;
    }

    return {
      dialog,
      formModel,
      ModelPresets,
      getExpWells,
      validateExperimentWellsLigandConc,
      validateExperimentWellsProteinConc,
      invalidExperimentWells,
      rules,
      name,
      ligand_name,
      protein_name,
      protein_conc_uM,
      selectedPreset,
      predictParamsModel,
      predictParamsResidueCount,
      form,
      thermodynamic_parameters,
      resetPredictParams,
      predictUnfoldingParams,
      setTypicalBindingParams,
      createBindingExperiment,
      resetThermodynamicParameters,
      thermo_param_change,
      applyPreset,
      demo_fillmetadata,
      openDialog,
      closeDialog,
    };
  },
});
</script>

<style scoped>
.drop-allowed .drag_hide {
  visibility: hidden;
}
.drag_show {
  visibility: hidden;
}

.drop-allowed .drag_show {
  visibility: visible;
}

.tr:first-child {
  border-bottom: 1px solid #555;
}
</style>
