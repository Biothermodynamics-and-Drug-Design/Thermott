<template>
  <v-data-table
    :headers="headers_expWell"
    dense
    elevation="0"
    :hide-default-footer="true"
    :items-per-page="999"
    :items="experimentWells"
    item-key="id"
    style
  >
    <template #item="{ item }">
      <tr>
        <td>{{ item.id }}</td>
        <td>{{ item.name }}</td>
        <td>{{ item.protein }}</td>
        <td>{{ (item.protein_conc * 10 ** 6).toFixed(2) }}</td>
        <td>{{ item.ligand }}</td>
        <td>{{ (item.ligand_conc * 10 ** 6).toFixed(2) }}</td>
      </tr>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import { ExperimentWell } from "@/models";
import { defineComponent, PropType } from "@vue/composition-api";

export default defineComponent({
  props: { experimentWells: Array as PropType<ExperimentWell[]> },
  setup() {
    const headers_expWell: any[] = [
      { text: "id", value: "id" },
      { text: "name", value: "name" },
      { text: "protein", value: "protein" },
      { text: "protein conc. (μM)", value: "protein_conc" },
      { text: "ligand", value: "ligand" },
      { text: "ligand conc. (μM)", value: "ligand_conc" },
    ];
    return { headers_expWell };
  },
});
</script>

<style scoped>
.v-data-table > .v-data-table__wrapper > table > tbody > tr > td {
  padding: 4px;
}

.v-data-table > .v-data-table__wrapper > table > thead > tr > th {
  padding: 3px !important;
}
</style>
<style>
.v-data-table > .v-data-table__wrapper > table > thead > tr > th {
  padding: 4px;
}

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
