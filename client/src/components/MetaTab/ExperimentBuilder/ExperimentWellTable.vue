<template>
  <div>
    <v-simple-table
      v-if="bindingExperiment.expPointIndexes.length > 0"
      dense
      elevation="0"
      class="mytable"
      style="border-style: solid; border-width: 0px 4px 4px 4px; border-color: rgb(189, 189, 189); border-radius: 0px"
    >
      <template #default>
        <thead>
          <tr>
            <th v-for="header in headers_expWell" :key="header.value" class="text-left">
              <template v-if="header.value == 'Tm'">T<sub>m</sub></template>
              <template v-else>{{ header.text }}</template>
            </th>
          </tr>
        </thead>
        <!-- $event.apply(bindingExperiment.expPointIndexes) -->
        <drop-list :items="bindingExperiment.expPointIndexes" mode="cut" tag="tbody" @reorder="reorder_expWell" @insert="insert">
          <template #item="{ item }">
            <drag :key="item" ref="drag" :data="item" tag="tr" @cut="remove(bindingExperiment.expPointIndexes, item)">
              <!-- <drag :key="item" :data="item" @cut="remove(bindingExperiment.expPointIndexes, item)" tag="tr" ref="drag" @dragend="dragAwayDrop($event)"> -->
              <td>{{ getExpWell(item).id }}</td>
              <td>{{ getExpWell(item).name }}</td>
              <!-- <td>{{ getExpWell(item).protein }}</td>
            <td>{{ getExpWell(item).protein_conc | formatConc("micromolar") }}</td>
            <td>{{ getExpWell(item).ligand }}</td> -->
              <td>{{ _formatConc(getExpWell(item).ligand_conc) }}</td>
              <td>{{ _formatTemp(getExpWell(item).tm_model_params.Tm) }}</td>
              <td><v-icon small @click="remove(bindingExperiment.expPointIndexes, item)">mdi-delete</v-icon></td>
            </drag>
          </template>
          <template #feedback="{ data }">
            <template v-if="typeof data == 'object'">
              <tr
                v-for="item in data"
                :key="'0' + item.toString()"
                :style="!bindingExperiment.expPointIndexes.includes(item) ? 'background-color:#BFE6FF' : 'background-color:#F08080'"
              >
                <td>{{ getExpWell(item).id }}</td>
                <td>{{ getExpWell(item).name }}</td>
                <!-- <td>{{ getExpWell(item).protein }}</td>
              <td>{{ getExpWell(item).protein_conc | formatConc("micromolar") }}</td>
              <td>{{ getExpWell(item).ligand }}</td> -->
                <td>{{ _formatConc(getExpWell(data).ligand_conc) }}</td>
                <td>{{ _formatTemp(getExpWell(data).tm_model_params.Tm) }}</td>
                <td></td>
              </tr>
            </template>
            <template v-else>
              <tr
                :key="'0' + data.toString()"
                :class="{ dropIncludes: dropExperimentWellIncludes(data), dropExclude: !dropExperimentWellIncludes(data) }"
              >
                <td>{{ getExpWell(data).id }}</td>
                <td>{{ getExpWell(data).name }}</td>
                <!-- <td>{{ getExpWell(data).protein }}</td>
              <td>{{ getExpWell(data).protein_conc | formatConc("micromolar") }}</td>
              <td>{{ getExpWell(data).ligand }}</td> -->
                <td>{{ _formatConc(getExpWell(data).ligand_conc) }}</td>
                <td>{{ _formatTemp(getExpWell(data).tm_model_params.Tm) }}</td>
                <td></td>
              </tr>
            </template>
          </template>
        </drop-list>
      </template>
    </v-simple-table>
    <drop v-if="bindingExperiment.expPointIndexes.length === 0" class="dropEmpty" mode="cut" tag="div" @drop="insert">
      <p
        class="text-center text--secondary text-subtitle-1 py-2"
        style="border-style: solid; border-width: 0px 4px 4px 4px; border-color: rgb(189, 189, 189); border-radius: 0px"
      >
        No experiment wells
      </p>
    </drop>
  </div>
</template>

<script lang="ts">
import { BindingExperiment, ExperimentWell } from "@/models";
import { defineComponent, PropType } from "@vue/composition-api";
import { formatConc, formatTemp, toArray } from "@/utils/utils";
import { Drag, Drop, DropList, ReorderEvent } from "vue-easy-dnd";

export default defineComponent({
  components: { Drag, Drop, DropList },
  filters: { formatConc, formatTemp },
  props: {
    bindingExperiment: Object as PropType<BindingExperiment>,
    experimentWells: Array as PropType<ExperimentWell[]>,
    isExpanded: Boolean,
  },
  setup(props) {
    const headers_expWell: any[] = [
      { text: "id", value: "id", class: "red lighten-2" },
      { text: "name", value: "name" },
      { text: "ligand conc.", value: "ligand_conc" },
      { text: "Tm", value: "Tm" },
      { text: "actions", value: "actions" },
    ];

    function reorder_expWell(event: ReorderEvent) {
      event.apply(props.bindingExperiment.expPointIndexes);
    }

    function onDrop(evt: any) {
      props.bindingExperiment.expPointIndexes.push(...evt.data);
    }

    function insert(event: any) {
      event.data = toArray(event.data);
      event.data = event.data.filter((x: number) => !props.bindingExperiment.expPointIndexes.includes(x));
      event.data.reverse().forEach((element: number) => {
        props.bindingExperiment.expPointIndexes.splice(event.index, 0, element);
      });
    }

    function remove(array: any[], value: any) {
      const index = array.indexOf(value);
      array.splice(index, 1);
    }

    const getExpWell = (id: number): ExperimentWell => props.experimentWells.find((x) => x.id === id);
    const getExpWells = (indexes: number[]): ExperimentWell[] => props.experimentWells.filter((x) => indexes.includes(x.id));

    function formatLigandLine(value: number) {
      return "ligand " + getExpWell(value).ligand + " conc. " + formatConc(getExpWell(value).ligand_conc, "micromolar");
    }

    function formatProteinLine(value: number) {
      return "protein " + getExpWell(value).protein + " conc. " + formatConc(getExpWell(value).protein_conc, "micromolar");
    }

    function dropExperimentWellIncludes(item: unknown) {
      return props.bindingExperiment.expPointIndexes.includes(item as number);
    }

    const _formatTemp = (value: number) => formatTemp(value, "celsius", 2, true);
    const _formatConc = (value: number) => formatConc(value, "micromolar");

    return {
      headers_expWell,
      reorder_expWell,
      onDrop,
      insert,
      remove,
      getExpWell,
      getExpWells,
      formatLigandLine,
      formatProteinLine,
      _formatTemp,
      _formatConc,
      dropExperimentWellIncludes,
    };
  },
});
</script>

<style scoped>
.dropEmpty.drop-allowed {
  background-color: rgb(223, 240, 250);
}
.dropEmpty.drop-in {
  background-color: #bfe6ff;
}

.dropIncludes {
  background-color: #bfe6ff;
}
.dropExclude {
  background-color: #f08080;
}
</style>
