<template>
  <v-data-table
    :headers="headers_bindingExp"
    :items="bindingExperiments"
    item-key="id"
    show-expand
    class="elevation-0"
    :expanded="expandedGroups"
    disable-pagination
    hide-default-footer
  >
    <template #[`item.protein`]="{ item }"> {{ item.protein }}({{ formatProteinConc(item.params.Pt) }}) </template>

    <template #[`item.matched_params`]="{ item }">
      <MatchedParamPresetChip :binding-params="item.params" :protein="item.protein" />
    </template>

    <template #expanded-item="{ headers, item }">
      <td :colspan="headers.length" class="pa-0">
        <v-data-table
          :headers="headers_expWell"
          dense
          elevation="0"
          :hide-default-footer="true"
          :items-per-page="999"
          :items="_getExperimentWells(item.expPointIndexes)"
          item-key="id"
          style="border-style: solid; border-width: 1px; border-color: rgb(189, 189, 189); border-radius: 0px"
        >
          <template #item="props">
            <tr>
              <td>{{ props.item.id }}</td>
              <td>{{ props.item.name }}</td>
              <td>{{ props.item.protein }}</td>
              <td>{{ (props.item.protein_conc * 10 ** 6).toFixed(2) }}</td>
              <td>{{ props.item.ligand }}</td>
              <td>{{ (props.item.ligand_conc * 10 ** 6).toFixed(2) }}</td>
            </tr>
          </template>
        </v-data-table>
      </td>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import { BindingExperiment, ExperimentWell } from "@/models";
import { formatConc, getExperimentWells } from "@/utils/utils";
import { defineComponent, PropType, Ref, ref } from "@vue/composition-api";
import MatchedParamPresetChip from "@/components/Generic/MatchedParamPresetChip.vue";

export default defineComponent({
  components: { MatchedParamPresetChip },
  props: { experimentWells: Array as PropType<ExperimentWell[]>, bindingExperiments: Array as PropType<BindingExperiment[]> },
  setup(props) {
    const expandedGroups: Ref<BindingExperiment[]> = ref([]);

    const headers_bindingExp = [
      { text: "id", value: "id" },
      { text: "name", value: "name" },
      { text: "protein", value: "protein" },
      { text: "ligand", value: "ligand" },
      { text: "params", value: "matched_params" },
    ];

    const headers_expWell = [
      { text: "id", value: "id" },
      { text: "name", value: "name" },
      { text: "protein", value: "protein" },
      { text: "protein conc. (μM)", value: "protein_conc" },
      { text: "ligand", value: "ligand" },
      { text: "ligand conc. (μM)", value: "ligand_conc" },
    ];

    function formatProteinConc(protein_conc: number): string | number {
      if (protein_conc !== null) return formatConc(protein_conc, "micromolar", true);
      else return "-";
    }

    const _getExperimentWells = (indexes: number[]) => getExperimentWells(indexes, props.experimentWells);

    //const _getExperimentWell = (index: number) => getExperimentWell(index, props.experimentWells);

    return { expandedGroups, headers_bindingExp, headers_expWell, _getExperimentWells, formatProteinConc };
  },
});
</script>

<style>
.v-data-table__expanded__row {
  background-color: rgb(189, 189, 189);
}

.theme--light.v-data-table
  tbody
  tr.v-data-table__expanded__row:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) {
  background-color: rgb(189, 189, 189);
}

.v-expansion-panel-content__wrap {
  padding: 0;
}
</style>
