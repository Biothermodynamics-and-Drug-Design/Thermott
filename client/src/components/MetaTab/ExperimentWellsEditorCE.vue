<template>
  <v-container fluid class="mt-3 mx-3">
    <div class="d-flex align-center">
      <!-- <v-alert border="left" class="py-1 px-2 ma-0" text type="info" dense>
        Here you can fill out data about experiment wells. For binding analysis you must fill out <span class="font-italic">ligand concentration</span>.
      </v-alert> -->
      <v-switch v-model="isTmReadOnly" class="mx-2 my-0" inset dense hide-details @change="updateTmOption">
        <template #label>
          <span>Allow editing &nbsp;<i>T</i><sub>m</sub></span>
        </template>
      </v-switch>
      <v-menu offset-y>
        <template #activator="{ on, attrs }">
          <v-btn class="mx-6" color="accent" small outlined tile v-bind="attrs" v-on="on">Export table</v-btn>
        </template>
        <v-list dense>
          <v-list-item @click="downloadTable">
            <v-list-item-title>Download CSV</v-list-item-title>
          </v-list-item>
          <v-list-item @click="copyTableToClipboard">
            <v-list-item-title>Copy to clipboard</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <v-container class="overflow-x-auto" fluid>
      <div ref="container" />
    </v-container>

    <v-dialog v-model="applyDialogOptions.model" max-width="290">
      <v-card>
        <v-card-title class="grey lighten-2 text-subtitle-1 pa-1 pl-3">Apply value to all cells in the column</v-card-title>

        <v-card-text class="pa-3">
          <v-text-field
            v-if="applyDialogOptions.column.type == 'numeric'"
            v-model.number="applyDialogOptions.valueNumber"
            :label="applyDialogOptions.column.title"
            outlined
          />
          <v-text-field v-else v-model="applyDialogOptions.valueString" :label="applyDialogOptions.column.title" outlined />
        </v-card-text>
        <v-divider />

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="applyDialogClick">Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, onMounted, Ref, ref, watch } from "@vue/composition-api";
import { ExperimentWell } from "@/models";
import jspreadsheet from "jspreadsheet-ce";
import "jspreadsheet-ce/dist/jspreadsheet.css";
import { SaveAppData_LocalStorage } from "@/utils/localStorage";
import { CopyToClipboard, DownloadFile, GenerateCSV } from "@/utils/utils";
import type { CSVHeader } from "@/utils/utils";
import { useAppData } from "@/store";

export default defineComponent({
  setup() {
    const appData = useAppData();

    const container: Ref<HTMLDivElement> = ref(null);
    let table: any = null;

    const isTmReadOnly = ref(false);

    //const applyColDialog = false;
    const applyDialogOptions = ref({ model: false, column: { type: "text", title: "ID", value: "id" }, valueString: "", valueNumber: 0 });

    const updateTmOption = () => {
      table.options.columns.find((x: { value: string }) => x.value == "Tm").readOnly = !isTmReadOnly;
      table.refresh();
    };

    const exportHeaders: CSVHeader[] = [
      { type: "text", text: "ID", value: "id" },
      { type: "text", text: "Name", value: "name" },
      { type: "text", text: "Protein", value: "protein" },
      { type: "numeric", text: "Protein conc. (μM)", value: "protein_conc", multiplyAmount: 10 ** 6 },
      { type: "text", text: "Ligand", value: "ligand" },
      { type: "numeric", text: "Ligand conc. (μM)", value: "ligand_conc", multiplyAmount: 10 ** 6 },
      { type: "numeric", text: "Tm (°C)", value: "tm_model_params.Tm" },
    ];

    const contextMenu = (el: any, x: any, y: any, e: Event) => {
      el;
      y;
      e;
      const columnIndex = x;
      const column = options.columns[columnIndex];
      applyDialogOptions.value.model = true;
      applyDialogOptions.value.column = column as any;
      return false;
    };

    const applyDialogClick = () => {
      const column = applyDialogOptions.value.column;
      if (column.type === "numeric") {
        if (column.value.includes("conc")) applyDialogOptions.value.valueNumber = applyDialogOptions.value.valueNumber / 10 ** 6;
        appData.experimentWells.forEach((expWell) => {
          (expWell as any)[column.value] = applyDialogOptions.value.valueNumber;
        });
      } else {
        appData.experimentWells.forEach((expWell) => {
          (expWell as any)[column.value] = applyDialogOptions.value.valueString;
        });
      }
      applyDialogOptions.value.model = false;
    };

    const cellchange = (instance: HTMLDivElement, cell: HTMLDivElement, x: string, y: string, value: string) => {
      const columnIndex = Number.parseInt(x);
      const rowIndex = Number.parseInt(y);

      const row = table.getRowData(rowIndex);

      const expWellID = row[0] as number;
      const expWell = appData.experimentWells.find((x) => x.id === expWellID);

      const column = options.columns[columnIndex];

      let parsedValue = column.type == "numeric" ? Number.parseFloat(value) : (value as string);
      if (column.value.includes("conc")) parsedValue = (parsedValue as number) / 10 ** 6;

      if (column.value == "Tm") expWell.tm_model_params.Tm = parsedValue as number;
      else (expWell as any)[column.value] = parsedValue;

      SaveAppData_LocalStorage();

      updateGrid(appData.experimentWells);
    };

    const options = {
      data: [] as number | string[],
      allowToolbar: false,
      contextMenu: contextMenu,
      tableOverflow: false,
      columns: [
        { type: "text", title: "ID", value: "id", readOnly: true, width: "50px" },
        { type: "text", title: "Name", value: "name", width: "350px" },
        { type: "text", title: "Protein", value: "protein", width: "160px" },
        { type: "numeric", title: "Protein conc. (μM)", value: "protein_conc", width: "160px" },
        { type: "text", title: "Ligand", value: "ligand", width: "160px" },
        { type: "numeric", title: "Ligand conc. (μM)", value: "ligand_conc", width: "160px" },
        { type: "numeric", title: "Tm (°C)", value: "Tm", readOnly: true, width: "100px" },
      ],
      onchange: cellchange,
    };

    const updateGrid = (expWells: ExperimentWell[]) => {
      const rows = [];
      for (let index = 0; index < expWells.length; index++) {
        const expWell = expWells[index];
        const row: (number | string)[] = [];
        for (let index = 0; index < options.columns.length; index++) {
          const column = options.columns[index];

          let value: number | string = column.value === "Tm" ? expWell.tm_model_params.Tm : (expWell as any)[column.value];
          if (column.value.includes("conc")) value = (value as number) * 10 ** 6;
          row.push(value);
        }
        rows.push(row);
      }
      table.setData(rows);
      table.hideIndex();

      table.refresh();
    };

    onMounted(() => {
      table = jspreadsheet(container.value, options as any);
      updateGrid(appData.experimentWells);
    });

    const downloadTable = () => {
      const text = GenerateCSV(exportHeaders, appData.experimentWells, ",", []);
      DownloadFile(text, "table.csv");
    };

    const copyTableToClipboard = () => {
      const text = GenerateCSV(exportHeaders, appData.experimentWells, ",", []);
      CopyToClipboard(text);
    };

    watch(
      () => appData.experimentWells,
      () => {
        updateGrid(appData.experimentWells);
      },
      { deep: true }
    );

    return { applyDialogOptions, applyDialogClick, downloadTable, copyTableToClipboard, container, updateTmOption, isTmReadOnly };
  },
});
</script>
