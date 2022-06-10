<template>
  <v-sheet outlined tile elevation="0" class="pa-0 d-flex flex-column">
    <div class="d-flex flex-row flex-wrap align-center item-spacing">
      <div class="grey lighten-3 chip text-subtitle-2"><span class="mr-2 font-weight-bold">Sample</span>{{ name }}</div>

      <v-menu v-if="!experimentWell.tm_model_params || experimentWell.tm_model_params.Model !== 'none'" offset-y>
        <template #activator="{ on }">
          <v-chip outlined rounded class="mx-2" v-on="on">
            <span class="font-weight-bold mr-1">Model</span> {{ selectedModelName }}
            <v-icon size="18" class="ml-2">mdi-chart-bell-curve-cumulative</v-icon>
          </v-chip>
        </template>
        <v-list class="py-1">
          <template v-for="(item, index) in tmModels.filter((x) => x.enabled === true)">
            <v-list-item :key="index" @click="changeModel(item.key)">
              <v-list-item-title>{{ item.display_name }}</v-list-item-title>
            </v-list-item>
            <v-divider v-if="index < tmModels.filter((x) => x.enabled === true).length - 1" :key="index + 'd'" class="my-1" />
          </template>
        </v-list>
      </v-menu>

      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-chip outlined v-bind="attrs" class="mx-2" v-on="on"
            >File<v-icon class="ml-2" size="20">mdi-information-outline</v-icon></v-chip
          >
        </template>
        <div class="d-flex flex-column">
          <span>Filename: ({{ originFile.id }}) {{ originFile.name }}</span>
          <span v-if="originFile.type">Mimetype: {{ originFile.type }}</span>
        </div>
      </v-tooltip>

      <v-tooltip v-if="!showDetailedTmParams" bottom>
        <template #activator="{ on, attrs }">
          <v-chip outlined v-bind="attrs" class="mx-2" v-on="on" @click="showDetailedTmParams = !showDetailedTmParams">
            <div v-if="!showTmWarning" class="d-flex"><Param class="font-weight-bold" parameter="Tm" /> {{ expWellTm }}°C</div>
            <span v-else><Param parameter="Tm" /><v-icon color="error" class="ml-1">mdi-alert</v-icon></span>
            <v-icon class="ml-2" size="20">mdi-eye-outline</v-icon>
          </v-chip>
        </template>
        <span>Show all model parameters</span>
      </v-tooltip>

      <v-menu v-if="experimentWell.fluorescence.length > 1" offset-y>
        <template #activator="{ on }">
          <v-chip outlined rounded class="mx-2" v-on="on">
            <span class="font-weight-bold mr-1">Gain</span> #{{ activeGain(experimentWell).id }} {{ activeGain(experimentWell).name }}
            <v-icon size="18" class="ml-2">mdi-lightbulb-on-outline</v-icon>
          </v-chip>
        </template>
        <v-list class="py-1">
          <template v-for="(item, index) in experimentWell.fluorescence">
            <v-list-item :key="index" @click="changeGain(item.id)">
              <v-list-item-icon class="my-0 mx-1 primary--text font-weight-bold">{{ item.id }}</v-list-item-icon>
              <v-list-item-title>{{ item.name }}</v-list-item-title>
            </v-list-item>
            <v-divider v-if="index < experimentWell.fluorescence.length - 1" :key="index + 'd'" class="my-1" />
          </template>
        </v-list>
      </v-menu>
    </div>

    <div v-if="showDetailedTmParams" class="d-flex pa-2">
      <v-sheet outlined rounded elevation="0">
        <v-card-title class="text-subtitle-2 px-2 py-1 grey lighten-3">
          <span>Model parameters</span>
          <v-spacer />
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn v-bind="attrs" small class="ml-3" icon v-on="on" @click="showDetailedTmParams = !showDetailedTmParams"
                ><v-icon size="20">mdi-eye</v-icon></v-btn
              >
            </template>
            <span>Hide model parameters</span>
          </v-tooltip>
        </v-card-title>

        <div class="pa-1 text-weight-normal">
          <ParamsThermodynamic
            v-if="experimentWell.tm_model_params.Model == 'thermodynamic'"
            :params="experimentWell.tm_model_params"
            @paramChange="changeParams"
          ></ParamsThermodynamic>
          <ParamsBoltzmannTrans
            v-if="experimentWell.tm_model_params.Model == 'boltzmann_trans'"
            :params="experimentWell.tm_model_params"
            @paramChange="changeParams"
          ></ParamsBoltzmannTrans>
          <ParamsSigmoid5Trans
            v-if="experimentWell.tm_model_params.Model == 'sigmoid5_trans'"
            :params="experimentWell.tm_model_params"
            @paramChange="changeParams"
          ></ParamsSigmoid5Trans>
          <ParamsDerivative
            v-if="experimentWell.tm_model_params.Model.includes('derivative')"
            :params="experimentWell.tm_model_params"
            @paramChange="changeParams"
          ></ParamsDerivative>
          <template v-if="experimentWell.tm_model_params.Model == 'none'">
            <span v-if="!showTmWarning"><Param class="font-weight-bold" parameter="Tm" /> {{ expWellTm }}°C</span>
            <span v-else><Param parameter="Tm" /><v-icon color="error" class="ml-1">mdi-alert</v-icon></span>
          </template>
        </div>
      </v-sheet>
    </div>
  </v-sheet>
</template>

<script lang="ts">
import { ActiveGain } from "../../utils/utils";
import { ExperimentWell } from "../../models";
import { TmModels } from "@/utils/tm_models";
import Param from "@/components/Generic/DisplayParamater.vue";
import ParamsThermodynamic from "./ModelDescriptions/ParamsThermodynamic.vue";
import ParamsBoltzmannTrans from "./ModelDescriptions/ParamsBoltzmannTrans.vue";
import ParamsSigmoid5Trans from "./ModelDescriptions/ParamsSigmoid5Trans.vue";
import ParamsDerivative from "./ModelDescriptions/ParamsDerivative.vue";
import { defineComponent, computed, PropType, ref } from "@vue/composition-api";
import { useAppData } from "@/store";

export default defineComponent({
  components: {
    Param,
    ParamsThermodynamic,
    ParamsBoltzmannTrans,
    ParamsSigmoid5Trans,
    ParamsDerivative,
  },
  props: {
    selectedExperimentWells: { type: Array as PropType<ExperimentWell[]> },
  },
  emits: ["refit"],
  setup(props, { emit }) {
    //refs
    const showDetailedTmParams = ref(false);

    const appData = useAppData();

    //computed
    const experimentWell = computed(() => props.selectedExperimentWells[0]);
    const name = computed(() => (experimentWell?.value.name ?? "-") + ` (#${experimentWell.value.id})`);
    const expWellTm = computed(() => experimentWell?.value.tm_model_params?.Tm.toFixed(2) ?? "-");
    const showTmWarning = computed(() => experimentWell?.value.tm_model_params?.Tm == null);
    const originFile = computed(() => appData.originFiles.find((x) => x.id == experimentWell.value.file_id));

    const selectedModelName = computed(() => {
      if (experimentWell?.value.tm_model_params?.Model) {
        return TmModels.find((x) => x.key == experimentWell.value.tm_model_params?.Model).display_name ?? "None";
      } else {
        return "None";
      }
    });

    //methods
    const changeModel = (newModel: string) => {
      experimentWell.value.tm_model_params = { Model: newModel, Tm: null };
      //emit("TmModelChange", experimentWell.value);
      emit("refit", [experimentWell.value]);
    };
    const changeGain = (newGainId: number) => {
      experimentWell.value.active_gain = newGainId;
      //emit("gainchange", experimentWell.value);
      emit("refit", [experimentWell.value]);
    };
    const changeParams = () => {
      emit("refit", experimentWell);
    };

    return {
      showDetailedTmParams,
      expWellTm,
      experimentWell,
      showTmWarning,
      originFile,
      name,
      selectedModelName,
      tmModels: TmModels,
      changeModel,
      changeGain,
      changeParams,
      activeGain: ActiveGain,
    };
  },
});
</script>

<style scoped>
.v-text-field >>> input {
  font-size: 0.9em;
  font-weight: 400;
  text-transform: capitalize;
}
.v-input.small_input {
  width: 9%;
}

.v-list-item {
  min-height: 24px;
}

.item-spacing :not(:first-child) {
  margin: 5px;
}

.chip {
  display: inline-block;
  padding: 0 20px;
  line-height: 50px;
  border-radius: 0 0 25px 0;
}
</style>
