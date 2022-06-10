<template>
  <v-container class="pa-0">
    <v-card v-if="session.bindingExperiments" outlined elevation="0">
      <v-card-title class="pa-1 pl-3 text-body-1 font-weight-medium grey lighten-3">
        Binding experiments
        <v-spacer />
      </v-card-title>
      <v-divider />

      <v-list class="pa-0 overflow-y-auto" style="max-height: 50vh">
        <v-list-item-group v-if="session.bindingExperiments.length > 0" v-model="_selectedBindingExperiment" color="primary">
          <template v-for="(item, i) in bindingExperiments">
            <v-divider v-if="i !== 0" :key="i + 'a'" />
            <v-list-item :key="i" :value="item" dense>
              <span class="font-weight-black caption primary--text text-body-1 text--darken-2 pr-3" v-text="item.id"></span>
              <v-list-item-content>
                <v-list-item-title v-text="item.name"></v-list-item-title>
                <v-list-item-subtitle v-text="item.protein + ' : ' + item.ligand"></v-list-item-subtitle>
              </v-list-item-content>
              <!-- <v-list-item-action>
            <v-row>
          <v-icon small class="mr-2" @click.stop="openEditDialog(item)">mdi-pencil</v-icon>
          <v-icon small @click.stop="deleteBindingExperiment(item)">mdi-delete</v-icon>
          </v-row>
        </v-list-item-action> -->
            </v-list-item>
          </template>
        </v-list-item-group>
        <v-list v-else class="mx-2 py-2">
          <v-icon class="mr-2" color="warning darken-1" v-text="'mdi-alert'" /><span class="warning--text">No binding experiments</span>
        </v-list>
      </v-list>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { AppData, BindingExperiment } from "@/models";
import { computed, defineComponent, PropType } from "@vue/composition-api";

export default defineComponent({
  props: {
    bindingExperiment: Object as PropType<BindingExperiment>,
    bindingExperiments: Array as PropType<BindingExperiment[]>,
    session: Object as PropType<AppData>,
  },

  emits: ["update:bindingExperiment"],
  setup(props, { emit }) {
    const _selectedBindingExperiment = computed({
      get: () => props.bindingExperiment,
      set: (value: BindingExperiment) => emit("update:bindingExperiment", value),
    });

    return { _selectedBindingExperiment };
  },
});
</script>
