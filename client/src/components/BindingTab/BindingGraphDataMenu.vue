<template>
  <v-menu data-cy="bindingChartMenu" right offset-y>
    <template #activator="{ on }">
      <v-btn v-model="menu" icon class="mx-2 my-1" small data-cy="bindingChartMenuButton" v-on="on">
        <v-icon>mdi-cog</v-icon>
        <!-- <v-icon size="large" class="ml-1">mdi-file-export-outline</v-icon> -->
      </v-btn>
    </template>

    <v-list class="denseselect" dense>
      <v-list-item dense @click="downloadTable">
        <v-list-item-title> <v-icon class="mr-2">mdi-file-table</v-icon>Save curve data (CSV) </v-list-item-title>
      </v-list-item>

      <v-list-item dense @click="copyTableToClipboard">
        <v-list-item-title> <v-icon class="mr-2">mdi-content-copy</v-icon>Copy curve data </v-list-item-title>
      </v-list-item>

      <v-list-item dense @click="emit('update-showconfinterval', !showConfInterval)">
        <v-list-item-title>
          <v-icon v-if="showConfInterval" class="mr-2">mdi-eye-off-outline</v-icon>
          <v-icon v-else class="mr-2">mdi-eye-outline</v-icon>
          <span>{{ showConfInterval ? "Hide" : "Show" }} conf. interval </span>
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "@vue/composition-api";
import { ExperimentWell, BindingExperiment } from "../../models";
import { CopyToClipboard, DownloadFile } from "../../utils/utils";
import { useNotify } from "../Generic/GlobalSnackbarStore";
import { GenerateGraphDataCSV } from "./BindingChartFunc";

export default defineComponent({
  props: {
    showConfInterval: Boolean,
    bindingExperiments: Array as PropType<BindingExperiment[]>,
    experimentWells: Array as PropType<ExperimentWell[]>,
  },
  emits: ["update-showconfinterval"],
  setup(props, { emit }) {
    const notify = useNotify();

    const menu = ref(false);

    const headers: { text: string; value: string }[] = [
      { text: "id", value: "id" },
      { text: "name", value: "name" },
      { text: "protein", value: "protein" },
      { text: "ligand", value: "ligand" },
      // { text: "params", value: "params" },
      { text: "Kb", value: "params.Kb" },
      { text: "comment", value: "comment" },
    ];

    const downloadTable = () => {
      const text = GenerateGraphDataCSV(props.bindingExperiments, props.experimentWells, ",");
      DownloadFile(text, "table.csv", {
        anchor: document,
        mimetype: "data:text/plain;charset=utf-8",
      });
    };

    const copyTableToClipboard = () => {
      const text = GenerateGraphDataCSV(props.bindingExperiments, props.experimentWells, "\t");
      CopyToClipboard(text);
      notify("Copied to clipboard", "success");
    };

    return { emit, downloadTable, copyTableToClipboard, headers, menu };
  },
});
</script>
