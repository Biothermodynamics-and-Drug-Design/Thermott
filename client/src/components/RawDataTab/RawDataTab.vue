<template>
  <div class="grid_container" data-cy="rawDataTab">
    <div class="d-flex flex-row" style="grid-area: upload">
      <data-upload-dialog
        @selectExpWell="selectExpWell"
        @dialog-open="_demoEvent('uploadDialogOpened')"
        @dialog-closed="_demoEvent('uploadDialogClosed')"
      />
      <div v-if="appData.experimentWells.length === 0" class="text-h6 ml-3">Upload raw data to start analysis</div>
    </div>

    <template v-if="appData.experimentWells && appData.experimentWells.length > 0">
      <div style="grid-area: itemlist; min-width: 200px">
        <experiment-well-list
          :selection="selectedItems"
          :experiment-wells="appData.experimentWells"
          data-cy="experimentWells_list"
          @update-selection="selectExpWell"
        />
        <div class="d-flex flex-row flex-wrap flex-gap">
          <SummaryTableDialog :experiment-wells="appData.experimentWells"></SummaryTableDialog>
          <SummaryHeatmap :experiment-wells="appData.experimentWells" />
          <ReportChartPlotly :experiment-wells="appData.experimentWells" :preselected-experiment-wells="selectedItems" />
        </div>
      </div>

      <tm-data-description-card
        v-if="selectedItems.length == 1"
        :selected-experiment-wells="selectedItems"
        style="grid-area: description"
        data-cy="tmDataDescriptionCard"
        @refit="refitExperimentWells"
      />
      <v-container fluid style="grid-area: chart; align-self: start; justify-self: center">
        <tm-chart ref="chart" :experiment-wells="selectedItems" />
      </v-container>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "@vue/composition-api";
import TmChart from "./TmChart.vue";
import TmDataDescriptionCard from "./TmDataDescriptionCard.vue";
import ExperimentWellList from "./ExperimentWellList.vue";
import DataUploadDialog from "./DataUploadDialog.vue";
import SummaryTableDialog from "./SummaryTableDialog.vue";
import SummaryHeatmap from "./SummaryHeatmapPlotly.vue";
import ReportChartPlotly from "@/components/Generic/ReportChartPlotly.vue";
import { useAppData } from "@/store";
import { useRoute, useRouter } from "@/main";
import { ExperimentWell } from "@/models";
import { demoEvent } from "../Generic/Demo/Demo";
import { FitExperimentWellsTm } from "@/utils/api";
import { useNotify } from "../Generic/GlobalSnackbarStore";

export default defineComponent({
  components: {
    TmChart,
    TmDataDescriptionCard,
    ExperimentWellList,
    DataUploadDialog,
    SummaryTableDialog,
    SummaryHeatmap,
    ReportChartPlotly,
  },
  setup() {
    const appData = useAppData();
    const router = useRouter();

    const notify = useNotify();

    const selectedItems = computed({
      get() {
        let param = useRoute().query.wells as string;
        if (!param) param = window.sessionStorage.getItem("RawData_selectedExpWellIds");
        if (!param) return [];

        const well_ids = param
          .split(",")
          .map((x) => parseInt(x))
          .filter((x) => !Number.isNaN(x));
        const expWells = well_ids.map((id) => appData.experimentWells.find((x) => x.id === id));
        return expWells;
      },
      set(experimentWells: ExperimentWell[]) {
        const param_string = experimentWells.map((x) => x.id).join(",");
        window.sessionStorage.setItem("RawData_selectedExpWellIds", param_string);
        router.replace({ query: { wells: param_string } });
      },
    });

    const refitExperimentWells = async (experimentWells: ExperimentWell[]) => {
      const res = await FitExperimentWellsTm(experimentWells);
      if (res.ok) {
        const failedFits = res.FitData.filter((x) => !x.ok);
        const successFits = res.FitData.filter((x) => x.ok);
        for (const fit of successFits) {
          const expWell = appData.experimentWells.find((x) => x.id === fit.id);
          if (expWell) {
            expWell.tm_model_params = fit.tm_params;
          }
          if (failedFits.length > 0) {
            const ids = failedFits.map((x) => x.id).join(" ,");
            notify(`Failed to fit ${ids} experiment wells`, "error", 10_000);
          } else {
            notify("Fit successful", "success");
          }
        }
      } else {
        notify(res.message, "error", 10_000);
      }
    };

    function selectExpWell(value: ExperimentWell[]) {
      selectedItems.value = value;
    }

    function _demoEvent(event_name: string) {
      demoEvent(event_name);
    }

    return { selectedItems, selectExpWell, _demoEvent, appData, refitExperimentWells };
  },
});
</script>

<style scoped>
.grid_container {
  display: grid;
  width: 100%;
  grid-template-columns: fit-content(25%) minmax(100px, 2fr);
  grid-template-rows: auto 1fr 19fr;
  grid-template-areas:
    "upload upload"
    "itemlist description"
    "itemlist chart";
  gap: 10px;
}

.flex-gap > * {
  margin: 20px;
}
</style>
