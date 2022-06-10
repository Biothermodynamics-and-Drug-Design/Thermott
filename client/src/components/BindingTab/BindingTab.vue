<template>
  <v-container fluid style="width: 100%">
    <v-row no-gutters>
      <v-col xs="5" sm="4" md="4" xl="3">
        <BindingExpermentList
          data-cy="bindingExperimentList"
          :selected-binding-experiments="selectedBindingExperiments"
          @update:selectedBindingExperiments="selectedBindingExperiments = $event"
        ></BindingExpermentList>

        <BindingDescription
          v-if="!advanceFit"
          :binding-experiments="selectedBindingExperiments"
          :experiment-wells="appData.experimentWells"
          :advance-fit="advanceFit"
          data-cy="bindingDescriptionCard"
          @update-advancefit="advanceFit = $event"
        ></BindingDescription>
        <BindingAdvanceFit
          v-if="advanceFit && selectedBindingExperiments && selectedBindingExperiments.length === 1"
          :binding-experiments="selectedBindingExperiments"
          @update:bindingExperiments="selectedBindingExperiments = $event"
          @hide="advanceFit = $event"
        />

        <div class="d-flex flex-wrap">
          <!-- <SummaryTableDialog :bindingExperiments="appData.bindingExperiments" /> -->
          <ErrorCalcDialog :binding-experiments="appData.bindingExperiments" />
          <ReportChartPlotly
            v-if="true"
            :binding-experiments="selectedBindingExperiments"
            :experiment-wells="bindingExperimentWells"
            class="mt-2"
          />
        </div>
      </v-col>

      <v-col xs="7" sm="8" md="8" xl="9" class="pl-2">
        <v-alert
          v-if="ifShowErrorAlert"
          class="ml-3 mb-0 py-1 px-2"
          type="error"
          dense
          prominent
          color="error darken-1"
          style="width: 100%"
        >
          <!-- <v-list dense color="rgba(0,0,0,0)" dark>
            <v-list-item v-for="(error, index)  in getBindingExperimentErrors" :key="index">
              <v-col class="pa-0">
                <v-list-item-title>{{error.title}}</v-list-item-title>
                <v-list-item-subtitle>{{error.description}}</v-list-item-subtitle>
              </v-col>
            </v-list-item>
          </v-list> -->
          <div class="d-flex flex-row">
            <v-sheet v-for="(error, index) in getBindingExperimentErrors" :key="index" class="ma-1 px-2 py-1" color="red darken-4" rounded>
              <div class="text-subtitle-2">{{ error.title }}</div>
              <div v-if="error.htmlDescription" class="text-subtitle-2" v-html="error.htmlDescription" />
              <div v-else class="text-caption">{{ error.description }}</div>
            </v-sheet>
          </div>
        </v-alert>
        <!-- <BindingAdvanceFit v-if="advanceFit && selectedBindingExperiments && selectedBindingExperiments.length === 1"
            :bindingExperiments="selectedBindingExperiments" 
            @change="updateChart" 
            :advanceFit="advanceFit"
            @advanceFit="setAdvanceFit"
          /> -->

        <v-container>
          <BindingChart
            ref="bindingChart"
            class="py-0"
            :binding-experiments="selectedBindingExperiments"
            :experiment-wells="appData.experimentWells"
            :show-conf-interval="showConfInterval"
          />
        </v-container>

        <div class="d-flex flex-row-reverse">
          <BindingGraphDataMenu
            v-if="selectedBindingExperiments.length > 0"
            :show-conf-interval="showConfInterval"
            :binding-experiments="selectedBindingExperiments"
            :experiment-wells="appData.experimentWells"
            @update-showconfinterval="showConfInterval = $event"
          />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "@vue/composition-api";
import type { Ref } from "@vue/composition-api";
import BindingExpermentList from "./BindingExperimentList.vue";
import BindingChart from "./BindingChart.vue";
import BindingDescription from "./BindingDescription.vue";
import { DetermineErrors } from "./BindingExperimentError";
import BindingGraphDataMenu from "./BindingGraphDataMenu.vue";
import BindingAdvanceFit from "./BindingAdvanceFit.vue";
import ReportChartPlotly from "@/components/Generic/ReportChartPlotly.vue";
//import ReportMatplotlib from "./BindingChartMatplotlib.vue";
import ErrorCalcDialog from "./ErrorCalcDialog.vue";
import { useAppData, useAppSettings } from "@/store";
import { BindingExperiment, ExperimentWell } from "@/models";
import { getBindingExperimentWells } from "@/utils/utils";

export default defineComponent({
  components: {
    BindingExpermentList,
    BindingChart,
    BindingDescription,
    BindingGraphDataMenu,
    ReportChartPlotly,
    ErrorCalcDialog,
    BindingAdvanceFit,
  },
  setup() {
    const selectedBindingExperiments: Ref<BindingExperiment[]> = ref([]);
    const advanceFit = ref(false);

    const showConfInterval = ref(true);

    const appData = useAppData();
    const appSettings = useAppSettings();

    const bindingExperimentWells = computed(() => {
      let experimentWells: ExperimentWell[] = [];
      if (selectedBindingExperiments.value && selectedBindingExperiments.value.length === 1) {
        experimentWells = getBindingExperimentWells(selectedBindingExperiments.value[0], appData.experimentWells);
      }
      return experimentWells;
    });

    const getBindingExperimentErrors = computed(() => {
      if (
        selectedBindingExperiments.value === undefined ||
        selectedBindingExperiments.value === null ||
        selectedBindingExperiments.value.length === 0
      )
        return [];
      const errorList = DetermineErrors(selectedBindingExperiments.value, appData.experimentWells);
      return errorList;
    });

    const ifShowErrorAlert = computed(() => {
      const IsSelectedItems = !(
        selectedBindingExperiments.value === undefined ||
        selectedBindingExperiments.value === null ||
        selectedBindingExperiments.value.length === 0
      );
      const IsErrors = getBindingExperimentErrors.value.length > 0;
      return IsSelectedItems && IsErrors;
    });

    return {
      selectedBindingExperiments,
      advanceFit,
      showConfInterval,
      ifShowErrorAlert,
      getBindingExperimentErrors,
      bindingExperimentWells,
      appData,
      appSettings,
    };
  },
});
</script>

<style scoped>
.grid_container {
  display: grid;
  grid-template-columns: fit-content minmax(1fr, 100%);
  grid-template-areas: "itemlist chart";
  gap: 10px;
}
</style>
