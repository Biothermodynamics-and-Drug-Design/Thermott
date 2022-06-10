<template>
  <v-container class="pa-0">
    <BindingExperimentEditDialog
      :binding-experiment="editBindingDialog.bindingExperiment"
      :experiment-wells="appData.experimentWells"
      :dialog="editBindingDialog.dialog"
      :tab="editBindingDialog.tab"
      @update-tab="editBindingDialog.tab = $event"
      @update-dialog="editBindingDialog.dialog = $event"
    ></BindingExperimentEditDialog>

    <v-card elevation="0" style="border: 1px solid #cecece">
      <v-card-title class="pa-1 pl-3 text-body-1 font-weight-medium grey lighten-3" style="border-bottom: 1px solid #d5d5d5">
        Binding experiments

        <v-spacer />
        <PLBDIntegrationDialog v-if="appSettings.DevelopmentSettings.PLBDIntegration" :app-data="appData" />
      </v-card-title>
      <v-divider />

      <v-list class="pa-0 overflow-y-auto" style="max-height: 30vh">
        <template v-if="appData.bindingExperiments.length > 0">
          <v-list-item
            v-for="(item, i) in appData.bindingExperiments"
            :key="i"
            :value="item"
            dense
            style="border-bottom: 1px solid #d5d5d5"
            active-class="primary--text"
            :input-value="_selectedBindingExperiments.includes(item)"
            @click="selectItem(item, $event)"
          >
            <span class="font-weight-black caption primary--text text-body-1 text--darken-2 pr-3" v-text="item.id"></span>
            <v-list-item-content>
              <v-list-item-title v-text="item.name"></v-list-item-title>
              <v-list-item-subtitle v-text="item.protein + ' : ' + item.ligand"></v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-row>
                <!--  -->
                <v-icon small class="mr-2" @click.stop="openEditDialog(item)">mdi-pencil</v-icon>
                <v-icon small @click.stop="deleteBindingExperiment(item)">mdi-delete</v-icon>
              </v-row>
            </v-list-item-action>
          </v-list-item>
        </template>
        <v-list v-else class="mx-2 py-2">
          <v-icon class="mr-2" color="grey" dense v-text="'mdi-information'" /><span class="grey--text">No binding experiments</span>
        </v-list>
      </v-list>
      <div class="py-1 px-2 grey lighten-4" style="user-select: none">
        <span class="grey--text mr-2">Select</span>
        <div class="inputHint">Ctrl</div>
        <span class="mx-1">/</span>
        <div class="inputHint">Shift</div>
        + <v-icon small color="grey lighten-1">mdi-mouse</v-icon>
      </div>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, computed } from "@vue/composition-api";
import { MultiSelect } from "@/utils/utils";
import BindingExperimentEditDialog from "../Generic/BindingExperimentEditDialog.vue";
import { confirmDialog } from "@/components/Generic/confirmdialog";
import { BindingExperiment } from "@/models";
import PLBDIntegrationDialog from "@/components/DatabaseTab/components/PLBDIntegrationDialog.vue";
import { useAppData, useAppSettings } from "@/store";

export default defineComponent({
  components: { BindingExperimentEditDialog, PLBDIntegrationDialog },
  props: { selectedBindingExperiments: Array as PropType<BindingExperiment[]> },
  emits: ["update:selectedBindingExperiments"],
  setup(props, { emit }) {
    const editBindingDialog = ref({ dialog: false, bindingExperiment: null as BindingExperiment | null, tab: 0 });
    const openEditDialog = (item: BindingExperiment) => {
      editBindingDialog.value = { dialog: true, bindingExperiment: item, tab: 0 };
    };

    const appData = useAppData();

    //const IsMultiSelect = ref(true);

    const appSettings = useAppSettings();

    const showPLBDIntegration = appSettings.ShowPLBDIntegration;

    const _selectedBindingExperiments = computed({
      get() {
        return props.selectedBindingExperiments;
      },
      set(value: BindingExperiment[]) {
        emit("update:selectedBindingExperiments", value);
      },
    });

    const selectItem = (item: BindingExperiment, evt: MouseEvent) => {
      const newSelection = MultiSelect(item, appData.bindingExperiments, _selectedBindingExperiments.value, evt);
      _selectedBindingExperiments.value = newSelection as BindingExperiment[];
    };

    const deleteBindingExperiment = async (bindingExperiment: BindingExperiment) => {
      const index = appData.bindingExperiments.findIndex((x) => x.id == bindingExperiment.id);
      if (index > -1) {
        const res = (await confirmDialog({
          text: `Do want to delete this binding experiment\n(#${bindingExperiment.id} ${bindingExperiment.name})?`,
        })) as boolean;
        if (!res) return;
        const deletedBindingExperiment = appData.bindingExperiments.splice(index, 1)[0];
        _selectedBindingExperiments.value = _selectedBindingExperiments.value.filter((x) => x.id != deletedBindingExperiment.id);
      }
    };

    const updateModel = () => {
      emit("update:selectedBindingExperiments", _selectedBindingExperiments.value);
    };

    return {
      updateModel,
      editBindingDialog,
      openEditDialog,
      appSettings,
      selectItem,
      _selectedBindingExperiments,
      deleteBindingExperiment,
      appData,
      showPLBDIntegration,
    };
  },
});
</script>
