<template>
  <!-- <v-row><v-switch v-model="allowCopies" label="Allow copies" dense></v-switch></v-row> -->
  <v-row class="pr-6">
    <v-card class="pt-0" elevation="0" data-cy="BuilderExperimentWellsList" outlined tile style="width: 100%">
      <v-card-title
        class="pa-1 pl-3 text-body-1 font-weight-medium text--primary"
        style="border-bottom: 1px solid #d5d5d5; background-color: #f7f7f7"
      >
        Experiment wells
        <v-spacer />

        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-icon
              color="secondary"
              class="mx-1"
              v-bind="attrs"
              v-on="on"
              @click="isCompactList = !isCompactList"
              v-text="isCompactList ? 'mdi-format-list-text' : 'mdi-format-list-bulleted'"
              >mdi-home</v-icon
            >
          </template>
          <span>{{ isCompactList ? "Show detailed list" : "Show compact list" }}</span>
        </v-tooltip>

        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-icon
              color="secondary"
              class="mx-1"
              v-bind="attrs"
              v-on="on"
              @click="showCopies = !showCopies"
              v-text="showCopies ? 'mdi-checkbox-multiple-blank-circle' : 'mdi-checkbox-blank-circle'"
              >mdi-home</v-icon
            >
          </template>
          <span>{{ showCopies ? "Disallow copies" : "Show copies" }}</span>
        </v-tooltip>
      </v-card-title>
      <div v-if="appData.experimentWells.length === 0" class="px-2 py-1">No experiments wells</div>
      <div v-else-if="allIndexes.length === 0" class="px-2 py-1">All experiment wells are assigned to binding experiments</div>
      <drag v-else :data="selectedItems" mode="cut" @cut="nothing">
        <v-list :two-line="!isCompactList" dense class="overflow-y-auto py-0" style="max-height: 50vh">
          <v-list-item
            v-for="item in allIndexes"
            :key="item"
            dense
            class="pl-1"
            :style="'border-bottom: 1px solid rgb(233,233,233); background-color:' + (isSelectedItem(item) ? '#BFE6FF' : 'white')"
            @click="selectItem(item, $event)"
          >
            <v-list-item-action :class="(isCompactList ? 'my-0' : '') + ' mr-3'">
              <v-checkbox :input-value="isSelectedItem(item)" @click.stop.prevent="selectItemCheckbox(item)"></v-checkbox>
            </v-list-item-action>
            <v-list-item-content dense @mousedown="singleDrag(item, $event)">
              <v-list-item-title>
                <span class="font-weight-black caption primary--text text--darken-2 mr-1" v-text="getExpWell(item).id" />
                {{ getExpWell(item).name }}
              </v-list-item-title>
              <v-list-item-subtitle v-if="!isCompactList" class="text-truncate">
                {{ formatLigandLine(item) }}<br />{{ formatProteinLine(item) }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <template #drag-image>
          <v-badge color="red" style="transform: translate(10px, 5px)">
            <template #badge>{{ selectedItems.length }}</template>
            <v-icon large color="black">mdi-test-tube</v-icon>
          </v-badge>
        </template>
      </drag>
      <v-divider />
      <div class="py-1 px-2 grey lighten-4" style="user-select: none">
        <span class="grey--text mr-2">Select</span>
        <div class="inputHint">Ctrl</div>
        <span class="mx-1">/</span>
        <div class="inputHint">Shift</div>
        + <v-icon small color="grey lighten-1">mdi-mouse</v-icon>
      </div>
    </v-card>
  </v-row>
</template>

<script lang="ts">
import { ExperimentTSA } from "@/components/DatabaseTab/database";
import { useAppData, useAppSettings } from "@/store";
import { defineComponent, PropType, computed, ref, onBeforeUnmount, Ref, onMounted } from "@vue/composition-api";
import { formatConc } from "@/utils/utils";
import { Drag } from "vue-easy-dnd";

export default defineComponent({
  components: { Drag },
  props: { experimentWells: Array as PropType<ExperimentTSA[]>, selected: Array as PropType<number[]> },
  emits: ["update-selected"],
  setup(props, { emit }) {
    const appSettings = useAppSettings();
    const appData = useAppData();

    const listlist: Ref<number[]> = ref([]);

    const selectedItems = computed({
      get() {
        return props.selected;
      },
      set(v: number[]) {
        emit("update-selected", v);
      },
    });

    const isCompactList = computed({
      get() {
        return appSettings.TabPreferences.Meta_ExperimentBuilder_ExperimentWellList_CompactList;
      },
      set(v: boolean) {
        appSettings.TabPreferences.Meta_ExperimentBuilder_ExperimentWellList_CompactList = v;
      },
    });

    const showCopies = computed({
      get() {
        return appSettings.TabPreferences.Meta_ExperimentBuilder_ExperimentWellList_ShowCopies;
      },
      set(v: boolean) {
        appSettings.TabPreferences.Meta_ExperimentBuilder_ExperimentWellList_ShowCopies = v;
      },
    });

    const tempSelectedItems: number[] = [];

    const singleDrag = (item: number, evt: MouseEvent) => {
      if (selectedItems.value.length === 0 || (!selectedItems.value.includes(item) && !evt.shiftKey && !evt.ctrlKey)) {
        tempSelectedItems.push(item);
        selectedItems.value = [item];
        document.addEventListener("mouseup", clearTempItems);
      }
    };

    //const clearTempItems = (evt: MouseEvent) => {
    const clearTempItems = () => {
      selectedItems.value = selectedItems.value.filter((x) => !tempSelectedItems.includes(x));
      document.removeEventListener("mouseup", clearTempItems);
    };

    onBeforeUnmount(() => {
      document.removeEventListener("mouseup", clearTempItems);
    });

    const nothing = () => {
      return;
    };

    const selectItemCheckbox = (item: number) => {
      if (selectedItems.value.includes(item))
        selectedItems.value.splice(
          selectedItems.value.findIndex((x) => x === item),
          1
        );
      else selectedItems.value.push(item);
    };

    const allIndexes = computed(() => {
      if (showCopies.value) {
        return appData.experimentWells.map((x) => x.id);
      }
      //const test = [].concat.apply([], appData.bindingExperiments.map((x) => x.expPointIndexes) as any[]) as number[];

      const test: number[] = [].concat(...appData.bindingExperiments.map((x) => x.expPointIndexes));

      const test2 = appData.experimentWells.map((x) => x.id).filter((x) => !test.includes(x));
      return test2;
    });

    const selectItem = (item: number, evt: MouseEvent) => {
      if (!evt.shiftKey && evt.ctrlKey) {
        if (selectedItems.value.includes(item)) selectedItems.value = selectedItems.value.filter((x) => x != item);
        else selectedItems.value.push(item);
      } else if (!evt.shiftKey && !evt.ctrlKey) {
        if (selectedItems.value.includes(item)) selectedItems.value = [];
        else selectedItems.value = [item];
      } else if (evt.shiftKey && !evt.ctrlKey) {
        if (!selectedItems) selectedItems.value = [item];
        else {
          const itemIndex = allIndexes.value.findIndex((x) => x === item);
          const selectedIndexes = selectedItems.value.map((y) => allIndexes.value.findIndex((x) => x === y));
          const maxIndex = Math.max(...selectedIndexes);
          const minIndex = Math.min(...selectedIndexes);
          if (itemIndex > maxIndex) {
            const newIndexes: number[] = [];
            for (let index = minIndex; index <= itemIndex; index++) {
              newIndexes.push(allIndexes.value[index]);
            }
            selectedItems.value = newIndexes;
          } else if (itemIndex < minIndex) {
            const newIndexes: number[] = [];
            for (let index = itemIndex; index <= maxIndex; index++) {
              newIndexes.push(allIndexes.value[index]);
            }
            selectedItems.value = newIndexes;
          }
        }
      }
    };

    onMounted(() => {
      listlist.value = allIndexes.value;
    });

    const isSelectedItem = (item: number) => selectedItems.value.includes(item);

    const getExpWell = (id: number) => appData.experimentWells.find((x) => x.id == id);

    const formatLigandLine = (item: number) => {
      const ligand_conc = getExpWell(item).ligand_conc !== null ? formatConc(getExpWell(item).ligand_conc, "micromolar") : "-";
      const ligand = getExpWell(item).ligand !== null ? getExpWell(item).ligand : "-";
      return "ligand " + ligand + " conc. " + ligand_conc;
    };

    const formatProteinLine = (item: number) => {
      const protein_conc = getExpWell(item).protein_conc !== null ? formatConc(getExpWell(item).protein_conc, "micromolar") : "-";
      const protein = getExpWell(item).protein !== null ? getExpWell(item).protein : "-";
      return "protein " + protein + " conc. " + protein_conc;
    };

    return {
      selectedItems,
      isCompactList,
      showCopies,
      singleDrag,
      nothing,
      selectItemCheckbox,
      selectItem,
      isSelectedItem,
      getExpWell,
      formatLigandLine,
      formatProteinLine,
      appData,
      allIndexes,
    };
  },
});
</script>
