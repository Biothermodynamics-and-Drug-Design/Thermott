<template>
  <v-container fluid class="pa-0">
    <BindingExperimentEditDialog
      :binding-experiment="editBindingDialog.bindingExperiment"
      :experiment-wells="experimentWells"
      :tab="editBindingDialog.tab"
      :dialog="editBindingDialog.dialog"
      @update-dialog="editBindingDialog.dialog = $event"
      @update-tab="editBindingDialog.tab = $event"
    ></BindingExperimentEditDialog>
    <v-card outlined tile elevation="0">
      <v-card-title class="pl-3 pb-0 text-body-1 font-weight-medium text--primary pa-3" style="background-color: #f7f7f7"
        >Binding experiments</v-card-title
      >
      <v-data-table
        :headers="headers"
        :items="bindingExperiments"
        single-expand
        item-key="id"
        show-expand
        class="elevation-0"
        :expanded="expandedRows"
      >
        <template #expanded-item="{ item }">
          <td :colspan="6" class="pa-0">
            <ExperimentWellTable
              :binding-experiment="item"
              :experiment-wells="experimentWells"
              :is-expanded="expandedRows.includes(item)"
            ></ExperimentWellTable>
          </td>
        </template>

        <template #item="props">
          <drop
            tag="tr"
            mode="cut"
            class="dragover"
            :style="`${isExpanded(props.item) ? 'background-color: rgb(189, 189, 189)' : ''}; ${''}`"
            @drop="onDrop($event, props.item)"
            @click="expandRow(props.item)"
          >
            <td class="d-flex align-center pl-1">
              <v-btn class="ma-2" text icon color="gray">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  version="1.1"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  :style="expandedRows.map((x) => x.id).includes(props.item.id) ? 'transform: rotate(180deg)' : ''"
                >
                  <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
                </svg>
              </v-btn>
              <span class="ml-1">{{ props.item.id }}</span>
            </td>

            <td v-for="header in headers.filter((x) => x.value != 'actions')" :key="header.value">
              <template v-if="header.value == 'protein'">
                {{ props.item[header.value] }}
                {{ getFormatProteinConc(props.item) }}
              </template>
              <template v-else-if="header.value == 'matched_params'">
                <MatchedParamPresetChip :binding-params="props.item.params" :protein="props.item.protein" />
              </template>
              <template v-else>
                {{ props.item[header.value] }}
              </template>
            </td>
            <td>
              <v-icon small class="mr-2" @click.stop="openDialog(props.item)">mdi-pencil</v-icon>
              <v-icon small @click.stop="deleteBindingExperiment(props.item)">mdi-delete</v-icon>
            </td>
          </drop>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { formatConc } from "@/utils/utils";
import { Drop } from "vue-easy-dnd";
import BindingExperimentEditDialog from "../../Generic/BindingExperimentEditDialog.vue";
import ExperimentWellTable from "./ExperimentWellTable.vue";
import MatchedParamPresetChip from "../../Generic/MatchedParamPresetChip.vue";
import { useConfirm } from "@/components/Generic/confirmdialog";
import { BindingExperiment, ExperimentWell } from "../../../models";
import { defineComponent, PropType, Ref, ref } from "@vue/composition-api";

export default defineComponent({
  components: { Drop, BindingExperimentEditDialog, ExperimentWellTable, MatchedParamPresetChip },
  props: { bindingExperiments: Array as PropType<BindingExperiment[]>, experimentWells: Array as PropType<ExperimentWell[]> },
  setup(props) {
    const editBindingDialog = ref({ dialog: false, bindingExperiment: null as BindingExperiment | null, tab: 0 });

    const expandedRows: Ref<BindingExperiment[]> = ref([]);

    const confirm = useConfirm();

    const headers = [
      //{ text: "id", value: "id" },
      { text: "name", value: "name" },
      { text: "protein", value: "protein" },
      { text: "ligand", value: "ligand" },
      { text: "params", value: "matched_params" },
      { text: "Actions", value: "actions", sortable: false },
    ];

    const openDialog = (item: BindingExperiment) => {
      editBindingDialog.value = { dialog: true, bindingExperiment: item, tab: 0 };
    };

    const onDrop = (evt: any, item: BindingExperiment) => {
      let ids = [];
      if (Array.isArray(evt.data)) ids = [...evt.data];
      else ids = [evt.data];
      ids = ids.filter((index) => !item.expPointIndexes.includes(index));
      item.expPointIndexes.push(...ids);
    };

    const expandRow = (row: BindingExperiment) => {
      const toExpand = expandedRows.value.map((x) => x.id).includes(row.id);
      if (!toExpand) expandedRows.value.push(row);
      else expandedRows.value = expandedRows.value.filter((x) => x.id != row.id);
    };

    const isExpanded = (item: BindingExperiment) => expandedRows.value.includes(item);

    const getExpWell = (index: number) => props.experimentWells.filter((x) => x.id === index)[0];

    const formatLigandLine = (value: number) => {
      return "ligand " + getExpWell(value).ligand + " conc. " + formatConc(getExpWell(value).ligand_conc, "micromolar");
    };

    const formatProteinLine = (value: number) => {
      return "protein " + getExpWell(value).protein + " conc. " + formatConc(getExpWell(value).protein_conc, "micromolar");
    };

    const getFormatProteinConc = (bindingExperiment: BindingExperiment) => {
      if (bindingExperiment.params.Pt != null && bindingExperiment.params.Pt != undefined)
        return `(${formatConc(bindingExperiment.params.Pt, "micromolar")})`;
      else return "";
    };

    const deleteBindingExperiment = async (bindingExperiment: BindingExperiment) => {
      const index = props.bindingExperiments.findIndex((x: BindingExperiment) => x.id == bindingExperiment.id);
      if (index > -1) {
        const res = (await confirm({
          text: `Do want to delete this binding experiment\n(#${bindingExperiment.id} ${bindingExperiment.name})?`,
        })) as boolean;
        if (!res) return;
        props.bindingExperiments.splice(index, 1);
      }
    };

    return {
      editBindingDialog,
      headers,
      expandedRows,
      openDialog,
      onDrop,
      expandRow,
      getExpWell,
      formatLigandLine,
      formatProteinLine,
      isExpanded,
      getFormatProteinConc,
      deleteBindingExperiment,
    };
  },
});
</script>

<style>
.dragover.drop-in {
  background-color: #bfe6ff !important;
  border-color: #bfe6ff !important;
  border-width: 5px !important;
}

.v-data-table-header {
  background-color: #f7f7f7;
}
</style>
