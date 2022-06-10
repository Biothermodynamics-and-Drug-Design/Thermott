<template>
  <v-card class="ma-0 pa-0" elevation="0" max-width="500px" tile style="border: 1px solid #cecece">
    <v-card-title class="pa-1 pl-3 text-body-1 font-weight-medium text--primary grey lighten-3" style="border-bottom: 1px solid #d5d5d5">
      Experiment wells
      <v-spacer />
      <v-badge v-if="expWellsNoTmCount > 0" color="grey" class="mr-2" inline left :content="expWellsNoTmCount" overlap>
        <v-icon color="error darken-1">mdi-alert-circle</v-icon>
      </v-badge>
      <ExperimentWellMenu />
    </v-card-title>
    <v-divider />
    <v-list class="overflow-y-auto" dense style="height: 65vh">
      <template v-for="(item, index) in experimentWells">
        <v-divider v-if="index !== 0" :key="index"></v-divider>

        <v-list-item
          :key="index + 'b'"
          active-class="primary--text"
          style="min-height: 20px"
          :input-value="_selection.includes(item)"
          :value="item"
          dense
          @click="selectItem(item, $event)"
        >
          <v-list-item-avatar class="ma-1" size="20">
            <span class="font-weight-black caption primary--text text--darken-2" v-text="item.id"></span>
            <!-- <v-avatar color="indigo lighten-2" class="ma-0" size="20">
                <span class="white--text caption" v-text="item.id"></span>
              </v-avatar> -->
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title v-text="item.name" />
            <!-- <v-list-item-title v-text="item.id+' '+item.name"/> -->
          </v-list-item-content>
          <v-list-item-action v-if="!(item.tm_model_params && item.tm_model_params.Tm)" class="ma-0">
            <v-tooltip bottom>
              <template #activator="{ on, attrs }">
                <v-icon color="error darken-1" v-bind="attrs" v-on="on">mdi-alert-circle</v-icon>
              </template>
              <span><i>T</i><sub>m</sub> not fitted</span>
            </v-tooltip>
          </v-list-item-action>
        </v-list-item>
      </template>
    </v-list>
    <v-divider />
    <div class="py-1 px-2 grey lighten-4" style="user-select: none">
      <span class="grey--text">Select</span>
      <div class="inputHint">Ctrl</div>
      <span class="mx-1">/</span>
      <div class="inputHint">Shift</div>
      + <v-icon small color="grey lighten-1">mdi-mouse</v-icon>
    </div>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "@vue/composition-api";
import { MultiSelect } from "@/utils/utils";
import ExperimentWellMenu from "./ExperimentWellMenu/ExperimentWellMenu.vue";
import { ExperimentWell } from "@/models";

export default defineComponent({
  components: { ExperimentWellMenu },
  props: {
    experimentWells: Array as PropType<ExperimentWell[]>,
    selection: Array as PropType<ExperimentWell[]>,
  },
  emits: ["update-selection"],
  setup(props, { emit }) {
    const _selection = computed({
      get(): ExperimentWell[] {
        return props.selection;
      },
      set(newSelection: ExperimentWell[]): void {
        emit("update-selection", newSelection);
      },
    });

    const selectItem = (item: ExperimentWell, evt: MouseEvent) => {
      const newSelection = MultiSelect(item, props.experimentWells, _selection.value, evt);
      _selection.value = newSelection;
    };

    const expWellsNoTmCount = computed(() => props.experimentWells.filter((x) => x.tm_model_params.Tm == null).length);

    return { _selection, selectItem, expWellsNoTmCount };
  },
});
</script>
