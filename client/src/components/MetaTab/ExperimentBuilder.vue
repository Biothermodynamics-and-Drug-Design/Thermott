<template>
  <v-container fluid fill-height>
    <v-row class="pt-2 ma-1"
      ><NewBindingExpDialog
        id="NewbindingExperimentDialog"
        :selected-experiment-well-indexes="selectedExperimentWellIndexes"
        @open-new-binding-experiment-dialog="demo_dialogOpened"
    /></v-row>
    <v-row class="pt-2 ma-1">
      <v-col xs="12" sm="4" md="4" lg="4" xl="3">
        <BuilderExperimentWellList
          :selected="selectedExperimentWellIndexes"
          @update-selected="selectedExperimentWellIndexes = $event"
        ></BuilderExperimentWellList>
      </v-col>
      <v-col xs="12" sm="8" md="8" lg="8" xl="9" class="px-0 pt-0">
        <BindingExperimentTable
          :binding-experiments="appData.bindingExperiments"
          :experiment-wells="appData.experimentWells"
        ></BindingExperimentTable>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, Ref, ref } from "@vue/composition-api";
import BuilderExperimentWellList from "./ExperimentBuilder/BuilderExperimentWellList.vue";
import BindingExperimentTable from "./ExperimentBuilder/BindingExperimentTable.vue";
import NewBindingExpDialog from "./ExperimentBuilder/NewBindingExpDialog.vue";
import { demoEvent } from "../Generic/Demo/Demo";
import { useAppData } from "@/store";

export default defineComponent({
  components: { BuilderExperimentWellList, BindingExperimentTable, NewBindingExpDialog },
  setup() {
    const appData = useAppData();

    const selectedExperimentWellIndexes: Ref<number[]> = ref([]);

    const demo_dialogOpened = () => {
      demoEvent("newBindingExperimentDialogOpened");
    };

    return { selectedExperimentWellIndexes, demo_dialogOpened, appData };
  },
});
</script>
