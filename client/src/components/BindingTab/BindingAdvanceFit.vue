<template>
  <div v-if="bindingExperiment && bindingExperiment.params" class="pa-0 mt-2">
    <!-- <div class="d-flex flex-column" > -->
    <v-card class="pa-1" outlined elevation="0">
      <div class="d-flex flex-row align-center">
        <span class="ma-2">Select parameters to fit</span>

        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-chip color="grey" dark dense small v-bind="attrs" v-on="on">
              boundaries <v-icon class="ml-2">mdi-information-outline</v-icon>
            </v-chip>
          </template>

          <BindingAdvanceFitBounds />
        </v-tooltip>

        <v-spacer />
        <v-icon class="mx-2" @click="$emit('hide', false)">mdi-close</v-icon>
      </div>
      <div class="d-flex flex-column align-left flex-wrap input-container mt-2 mx-4">
        <v-text-field
          v-model.number="bindingExperiment.params.DuH_Tr"
          suffix="J/mol"
          class="mx-2"
          hide-details
          dense
          outlined
          @input="updateParam()"
        >
          <template #prepend-inner>
            <div class="d-flex flex-row align-center">
              <v-simple-checkbox v-model="fitParams.DuH_Tr" dense :ripple="false" />
              <Params class="mr-4" parameter="DuH_Tr" />
            </div>
          </template>
          <template #append>
            <div v-if="checkParamChange('DuH_Tr')" class="d-flex flex-row align-center">
              <v-icon @click="revertParam('DuH_Tr')">mdi-arrow-u-left-bottom</v-icon>
              <div v-html="formatScientific(oldParams.DuH_Tr)" />
            </div>
          </template>
        </v-text-field>
        <v-text-field
          v-model.number="bindingExperiment.params.DuCp"
          hide-details
          suffix="J/(mol⋅K)"
          class="mx-2"
          dense
          outlined
          @input="updateParam()"
        >
          <template #prepend-inner>
            <div class="d-flex flex-row align-center">
              <v-simple-checkbox v-model="fitParams.DuCp" dense :ripple="false" />
              <Params class="mr-4" parameter="DuCp" />
            </div>
          </template>
          <template #append>
            <div v-if="checkParamChange('DuCp')" class="d-flex flex-row align-center">
              <v-icon @click="revertParam('DuCp')">mdi-arrow-u-left-bottom</v-icon>
              <div v-html="formatScientific(oldParams.DuCp)" />
            </div>
          </template>
        </v-text-field>

        <v-text-field
          v-model.number="bindingExperiment.params.DbH_T0"
          hide-details
          suffix="J/mol"
          class="mx-2"
          dense
          outlined
          @input="updateParam()"
        >
          <template #prepend-inner>
            <div class="d-flex flex-row align-center">
              <v-simple-checkbox v-model="fitParams.DbH_T0" dense :ripple="false" />
              <Params class="mr-4" parameter="DbH_T0" />
            </div>
          </template>
          <template #append>
            <div v-if="checkParamChange('DbH_T0')" class="d-flex flex-row align-center">
              <v-icon @click="revertParam('DbH_T0')">mdi-arrow-u-left-bottom</v-icon>
              <div v-html="formatScientific(oldParams.DbH_T0)" />
            </div>
          </template>
        </v-text-field>

        <v-text-field
          v-model.number="bindingExperiment.params.DbCp"
          hide-details
          suffix="J/(mol⋅K)"
          class="mx-2"
          dense
          outlined
          @input="emit('update:chart')"
        >
          <template #prepend-inner>
            <div class="d-flex flex-row align-center">
              <v-simple-checkbox v-model="fitParams.DbCp" dense :ripple="false" />
              <Params class="mr-4" parameter="DbCp" />
            </div>
          </template>
          <template #append>
            <div v-if="checkParamChange('DbCp')" class="d-flex flex-row align-center">
              <v-icon @click="revertParam('DbCp')">mdi-arrow-u-left-bottom</v-icon>
              <div v-html="formatScientific(oldParams.DbCp)" />
            </div>
          </template>
        </v-text-field>
        <!-- </div>
      <div class="d-flex flex-row align-center flex-wrap input-container"> -->

        <!-- </div>
            </div>
            <div class="d-flex flex-row"> -->
        <div class="d-flex">
          <v-text-field
            v-model.number="proteinConcentration_uM"
            hide-details
            suffix="μM"
            class="mx-2"
            dense
            outlined
            @input="updateParam()"
          >
            <template #prepend-inner>
              <div class="d-flex flex-row align-center">
                <v-simple-checkbox v-model="fitParams.Pt" dense :ripple="false" />
                <Params class="mr-4" parameter="Pt" />
              </div>
            </template>
            <template #append>
              <div v-if="checkParamChange('Pt')" class="d-flex flex-row align-center">
                <v-icon @click="revertParam('Pt')">mdi-arrow-u-left-bottom</v-icon>
                <div v-html="oldParams.Pt * 10 ** 6" />
              </div>
            </template>
          </v-text-field>
          <v-text-field
            v-model.number="bindingExperiment.params.T0"
            hide-details
            suffix="°C"
            class="mx-2"
            dense
            outlined
            @input="updateParam()"
          >
            <template #prepend-inner>
              <Params class="mt-1 mr-4" parameter="T0" />
            </template>
          </v-text-field>
        </div>

        <v-text-field
          v-model.number="bindingExperiment.params.ActiveLigandFraction"
          label="Active ligand fraction N"
          hide-details
          class="mx-2 my-2"
          dense
          outlined
          @input="updateParam()"
        >
        </v-text-field>

        <v-text-field v-model.number="bindingExperiment.params.Kb" hide-details class="mx-2" dense outlined @input="updateParam()">
          <template #prepend-inner>
            <div class="d-flex flex-row align-center">
              <v-simple-checkbox v-model="fitParams.Kb" dense :ripple="false" />
              <Params class="mr-4" parameter="Kb" />
            </div>
          </template>
          <template #append>
            <Params class="mt-1" parameter="M-1" />
            <div v-if="checkParamChange('Kb')" class="d-flex flex-row align-center">
              <v-icon @click="revertParam('Kb')">mdi-arrow-u-left-bottom</v-icon>
              <div v-html="formatScientific(oldParams.Kb)" />
            </div>
          </template>
        </v-text-field>

        <v-text-field disabled outlined dense hide-details :value="formatKb(bindingExperiment.params.Kb, 3, 'Kd', false)" class="mx-2">
          <template #prepend-inner>
            <Params class="mt-1 mr-2" parameter="Kd" />
          </template>
          <template #append>
            <div class="mt-1">{{ formatKb(bindingExperiment.params.Kb, 1, "Kd", "onlyunit") }}</div>
          </template>
        </v-text-field>

        <v-btn depressed :disabled="isFitDisabled" small color="primary" class="ma-2" @click="FitBindingModel">Fit</v-btn>
      </div>
    </v-card>
  </div>
</template>

<script lang="ts">
import { BindingExperiment, BindingModelParams } from "@/models";
import { computed, defineComponent, PropType, ref, watch } from "@vue/composition-api";
import { getExperimentWellsFromBindingExperiment } from "@/utils/bindingexperiment_manager";
import { Notify } from "../Generic/GlobalSnackbarStore";
import Params from "@/components/Generic/DisplayParamater.vue";
import BindingAdvanceFitBounds from "./BindingAdvanceFitBounds.vue";
import { formatKb } from "@/utils/utils";
import { useAppData } from "@/store";

export default defineComponent({
  components: { Params, BindingAdvanceFitBounds },
  props: { bindingExperiments: Array as PropType<BindingExperiment[]> },
  emit: ["update:bindingExperiments", "update:chart", "hide"],
  setup(props, { emit }) {
    const appData = useAppData();
    const bindingExperiment = computed({
      get: () => props.bindingExperiments[0],
      set: (value: BindingExperiment) => {
        props.bindingExperiments[0] = value;
        emit("update:bindingExperiments", props.bindingExperiments);
      },
    });

    const oldParams = ref(Object.assign({}, bindingExperiment.value.params));

    const checkParamChange = (property: keyof BindingModelParams) => {
      if (bindingExperiment?.value == null || oldParams?.value == null) return false;
      return bindingExperiment?.value?.params[property] != (oldParams?.value)[property];
    };

    const revertParam = (property: keyof Omit<BindingModelParams, "Kb_confidence_interval">) => {
      return (bindingExperiment.value.params[property] = oldParams.value[property]);
    };

    const formatScientific = (value: number) => {
      if (value == 0 || (value > 0.05 && value < 100)) return value.toString();
      const text = value.toExponential(2);
      const [start, end] = text.split("e");
      return `${start}×10<sup>${parseInt(end)}</sup>`;
    };

    watch(bindingExperiment, (newExp, oldExp) => {
      if (newExp.id != oldExp.id) {
        oldParams.value = Object.assign({}, newExp.params);
      }
    });

    // const propBindingExperiments = ref(props.bindingExperiments);
    // watch(propBindingExperiments, (newExps, oldExps) => {
    //   console.log("watch");
    //   const newExp = newExps[0];
    //   const oldExp = oldExps[0];
    //   if (newExp.id != oldExp.id){
    //     oldParams.value = Object.assign({}, newExp.params);
    //     console.log("old param change");
    //   }

    // })

    const experimentWells = computed(() => appData.experimentWells);

    const proteinConcentration_uM = computed({
      get: () => bindingExperiment?.value.params.Pt * 10 ** 6,
      set: (value: number) => {
        (bindingExperiment.value.params.Pt = value / 10 ** 6), emit("update:chart");
      },
    });

    const fitParams = ref(new FitParams());

    const updateParam = () => {
      bindingExperiment.value.params.Kb_confidence_interval = null;
      emit("update:chart");
    };

    const FitBindingModel = async () => {
      const expWells = getExperimentWellsFromBindingExperiment(bindingExperiment.value);
      const expWells_withLigand = expWells.filter((x) => x.ligand_conc !== 0);

      //Calculate Tr (control Tm)
      const expWells_control = expWells.filter((x) => x.ligand_conc === 0);
      const Trs = expWells_control.map((x) => x.tm_model_params.Tm);

      bindingExperiment.value.params.Tr = Trs.reduce((acc, c) => acc + c, 0) / Trs.length;
      //
      const params = bindingExperiment.value.params;
      const data: any = {
        C: expWells_withLigand.map((x) => x.ligand_conc),
        Tm: expWells_withLigand.map((x) => x.tm_model_params.Tm),
        params: params,
        fitparams: fitParams.value,
      };

      const postSettings = {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      };

      const res = await fetch("/api/BindingFit", postSettings);
      if (!res.ok) {
        let data = null;
        try {
          data = await res.json();
          if (data && data.detail) {
            Notify(`(${bindingExperiment.value.id}) ${bindingExperiment.value.name} fit failed\n See console for error`, "error", 4000);
            console.log(data.detail);
          }
        } catch (error) {
          Notify("Could not connect to server", "error", 4000);
        }
        return;
      }
      const response_data: any = await res.json();
      for (const property in fitParams.value) {
        if ((fitParams.value as any)[property] === true) {
          (bindingExperiment.value.params as any)[property] = response_data.params[property] as number;
        }
        bindingExperiment.value.params.Kb_confidence_interval = null;
      }

      Notify(`(${bindingExperiment.value.id}) ${bindingExperiment.value.name} fit successful`, "success", 4000);
      emit("update:bindingExperiments", props.bindingExperiments);
      updateParam();
    };

    const isFitDisabled = computed(() => {
      for (const key in fitParams.value) {
        if (Object.prototype.hasOwnProperty.call(fitParams.value, key)) {
          const element = (fitParams.value as any)[key];
          if (element === true) return false;
        }
      }
      return true;
    });

    return {
      bindingExperiment,
      experimentWells,
      proteinConcentration_uM,
      fitParams,
      isFitDisabled,
      oldParams,
      FitBindingModel,
      emit,
      updateParam,
      checkParamChange,
      revertParam,
      formatScientific,
      formatKb,
    };
  },
});

class FitParams {
  public DuH_Tr = false;
  public DuCp = false;
  public DbH_T0 = false;
  public DbCp = false;
  public Tr = false;
  public T0 = false;
  public Kb = true;
  public Pt = false;
  public ActiveLigandFraction = false;
}
</script>

<style scoped>
.input-container > * {
  margin: 0.1em 0;
}
</style>
