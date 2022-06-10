<template>
  <v-container fluid class="overflow-x-auto">
    <div v-show="bindingExperiment.expPointIndexes.length > 0" ref="container" />
    <div v-show="!(bindingExperiment.expPointIndexes.length > 0)">No experiments well added</div>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, PropType } from "@vue/composition-api";
import { SaveAppData_LocalStorage } from "@/utils/localStorage";
import jspreadsheet from "jspreadsheet-ce";
import "jspreadsheet-ce/dist/jspreadsheet.css";
import { BindingExperiment, ExperimentWell } from "@/models";
import { confirmDialog } from "./confirmdialog";

export default defineComponent({
  name: "ExperimentWellSpreadsheet",
  props: {
    bindingExperiment: Object as PropType<BindingExperiment>,
    experimentWells: Array as PropType<ExperimentWell[]>,
  },
  emits: ["update:bindingExperiment", "update:experimentWells"],

  setup(props, { emit }) {
    const bindingExperiment = computed({
      get: () => props.bindingExperiment,
      set: (value: BindingExperiment) => emit("update:bindingExperiment", value),
    });
    const experimentWells = computed({
      get: () => props.experimentWells,
      set: (value: ExperimentWell[]) => emit("update:experimentWells", value),
    });

    const container = ref(null as HTMLDivElement);
    const table = ref(null);

    const deleteExperiment = async (event: Event) => {
      const res = (await confirmDialog({ text: "Do you want to delete selected experiment well?" })) as boolean;
      if (res) {
        const path = (event as any).path as HTMLElement[];
        const TR = path.find((x) => x.tagName == "TR");
        const rowIndex = TR.getAttribute("data-y");
        const expWellId = parseInt(table.value.getValueFromCoords(0, rowIndex));

        bindingExperiment.value.expPointIndexes = bindingExperiment.value.expPointIndexes.filter((x) => x != expWellId);

        const index = experimentWells.value.findIndex((x) => x.id == expWellId);
        if (index > -1) experimentWells.value.splice(index, 1);

        emit("update:bindingExperiment", bindingExperiment.value);
        emit("update:experimentWells", experimentWells.value);
        updateGrid(experimentWells.value);
      }
    };

    const updateGrid = (expWells: ExperimentWell[]) => {
      const rows = [];
      const columns = options.value.columns;
      for (let index = 0; index < expWells.length; index++) {
        const expWell = expWells[index];
        const row: (number | string)[] = [];
        for (let index = 0; index < columns.length; index++) {
          const column = columns[index];

          let value: number | string = column.value === "Tm" ? expWell.tm_model_params.Tm : (expWell as any)[column.value];
          if (column.value.includes("conc")) value = ((value as number) * 10 ** 6)?.toPrecision(5);
          row.push(value);
        }
        rows.push(row);
      }

      table.value.setData(rows);
      table.value.hideIndex();

      table.value.refresh();

      const buttonCells = container.value.querySelectorAll('[data-x="4"]');
      buttonCells[0].innerHTML = "";

      for (let index = 1; index < buttonCells.length; index++) {
        const button = buttonCells[index];
        button.innerHTML = "<button type='button' class='v-icon  v-icon--link mdi mdi-delete'></button";
        //const row = button.getAttribute("data-x");
        //const id = table.value.getValueFromCoords(0, row);

        button.addEventListener("click", async (event: Event) => {
          await deleteExperiment(event);
        });
      }
    };

    const cellchange = (instance: HTMLDivElement, cell: HTMLDivElement, x: string, y: string, value: string) => {
      const columnIndex = Number.parseInt(x);
      const rowIndex = Number.parseInt(y);

      const row = table.value.getRowData(rowIndex);

      const expWellID = row[0] as number;
      const expWell = experimentWells.value.find((x) => x.id === expWellID);

      const column = options.value.columns[columnIndex];

      let parsedValue = column.type == "numeric" ? Number.parseFloat(value) : (value as string);
      if (column.value.includes("conc")) parsedValue = (parsedValue as number) / 10 ** 6;

      if (column.value == "Tm") expWell.tm_model_params.Tm = parsedValue as number;
      else (expWell as any)[column.value] = parsedValue;

      SaveAppData_LocalStorage();

      updateGrid(experimentWells.value);
    };

    const options = ref({
      data: [] as number | string[],
      allowToolbar: false,
      columnSorting: false,
      contextMenu: false,
      tableOverflow: false,
      columns: [
        { type: "text", title: "ID", value: "id", readOnly: true, width: "50px" },
        { type: "text", title: "Name", value: "name", width: "350px" },
        { type: "numeric", title: "Ligand conc. (μM)", value: "ligand_conc", width: "160px" },
        { type: "numeric", title: "Tm", value: "Tm", readOnly: true, width: "100px" },
        { type: "text", title: "", value: "action", readOnly: true, width: "50px" },
      ],
      onchange: cellchange,
    });

    onMounted(() => {
      table.value = jspreadsheet(container.value, options.value as any);
      updateGrid(experimentWells.value);
      const columnElement = container.value.querySelector('td[title="Tm"]');
      columnElement.innerHTML = "<i>T</i><sub>m</sub> (°C)";
    });

    return {
      container,
      table,
      props,
      options,
      updateGrid,
    };
  },
});
</script>
