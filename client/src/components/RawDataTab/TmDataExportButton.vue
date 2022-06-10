<template>
  <v-menu right offset-y>
    <template #activator="{ on }">
      <v-btn v-model="menu" :icon="!IsButton" text class="mt-2" height="36" v-on="on">
        <span v-if="IsButton">Export</span>
        <v-icon size="large">mdi-file-export-outline</v-icon>
      </v-btn>
    </template>

    <v-list class="denseselect">
      <v-list-item dense @click="downloadTable">
        <v-list-item-title>
          <v-icon small class="ml-2">mdi-file-table</v-icon>
          Save table (CSV)
        </v-list-item-title>
      </v-list-item>

      <v-list-item dense @click="copyTableToClipboard">
        <v-list-item-title>
          <v-icon small class="ml-2">mdi-content-copy</v-icon>
          Copy table
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { ExperimentWell } from "@/models";
import { CopyToClipboard, CSVHeader, DownloadFile, GenerateCSV } from "@/utils/utils";
import { defineComponent, PropType, ref } from "@vue/composition-api";

export default defineComponent({
  props: { experimentWells: Array as PropType<ExperimentWell[]>, isButton: { type: Boolean, default: false } },
  setup(props) {
    const menu = ref(false);

    const headers: CSVHeader[] = [
      { text: "name", value: "name" },
      //{ text: "id", value: "id" },
      { text: "Tm", value: "tm_model_params.Tm" },
      { text: "gain", value: "active_gain" },
      { text: "yf", value: "tm_model_params.yf" },
      { text: "yfs", value: "tm_model_params.yfs" },
      { text: "yu", value: "tm_model_params.yu" },
      { text: "yus", value: "tm_model_params.yus" },
      { text: "dH", value: "tm_model_params.dH" },
      { text: "dCp", value: "tm_model_params.dCp" },
    ];

    const downloadTable = () => {
      const text = GenerateCSV(headers, props.experimentWells, ",", []);
      DownloadFile(text, "table.csv");
    };

    const copyTableToClipboard = () => {
      const text = GenerateCSV(headers, props.experimentWells, "\t");
      CopyToClipboard(text);
    };

    return { downloadTable, copyTableToClipboard, menu };
  },
});
</script>
