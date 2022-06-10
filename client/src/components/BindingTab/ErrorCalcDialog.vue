<template>
  <v-dialog v-model="dialog" max-width="1000px">
    <template #activator="{ on }">
      <v-btn depressed outlined color="blue-grey darken-1" class="my-1" x-small v-on="on">Summary/Error</v-btn>
    </template>

    <v-card>
      <v-card-title class="grey lighten-2 text-subtitle-1 py-1">
        Summary/Error
        <v-spacer></v-spacer>

        <v-menu offset-y>
          <template #activator="{ on, attrs }">
            <v-btn color="secondary" text small v-bind="attrs" v-on="on">
              Get table data
              <v-icon class="ml-2">mdi-clipboard-text-outline</v-icon>
            </v-btn>
          </template>
          <v-list dense>
            <v-list-item @click="getTableData('copy')">
              <v-list-item-title>Copy to clipboard</v-list-item-title>
              <v-list-item-icon>
                <v-icon>mdi-content-copy</v-icon>
              </v-list-item-icon>
            </v-list-item>
            <v-list-item @click="getTableData('download')">
              <v-list-item-title>Download table</v-list-item-title>
              <v-list-item-icon>
                <v-icon>mdi-download</v-icon>
              </v-list-item-icon>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-icon class="mr-2" @click="dialog = false">mdi-close</v-icon>
      </v-card-title>

      <v-card-text ref="anchor" class="pa-0">
        <v-tabs v-model="tab">
          <v-tab>Binding experiments</v-tab>
          <v-tab>Group errors</v-tab>
        </v-tabs>
        <v-divider />

        <v-tabs-items v-model="tab">
          <v-tab-item key="binding_exp">
            <v-data-table
              v-model="selectedBindingexperiments"
              dense
              disable-pagination
              hide-default-footer
              :headers="headers"
              :items="bindingExperiments"
              item-key="id"
              :show-select="isCreatingGroup"
              class="elevation-0 overflow-y-auto"
              fixed-header
              height="70vh"
            >
              <template #[`item.params.Kb`]="{ item }">
                {{ item.params.Kb ? item.params.Kb.toExponential(2) : item.params.Kb }}
                <v-icon v-if="!item.params.Kb" class="mdi-rotate-180" color="error">mdi-information</v-icon>
              </template>
              <template #[`item.params.Kb_confidence_interval`]="{ item }">
                {{
                  item.params.Kb_confidence_interval
                    ? `[${item.params.Kb_confidence_interval[0].toExponential(2)}, ${item.params.Kb_confidence_interval[1].toExponential(
                        2
                      )}]`
                    : "-"
                }}
              </template>
              <template #[`header.params.T0`]="{}"> <Param parameter="T0" />&nbsp;(°C) </template>
              <template #[`header.params.Kb`]="{}">
                <Param parameter="Kb" />
              </template>
              <template #[`item.params`]="{ item }">
                <table style="width: 100%">
                  <tr>
                    <td><Param parameter="DuH_Tr" /></td>
                    <td>{{ item.params.DuH_Tr }}</td>
                    <td>J/mol</td>
                  </tr>
                  <tr>
                    <td><Param parameter="DuCp" /></td>
                    <td>{{ item.params.DuCp }}</td>
                    <td>J/(mol⋅K)</td>
                  </tr>
                  <tr>
                    <td><Param parameter="DbH_T0" /></td>
                    <td>{{ item.params.DbH_T0 }}</td>
                    <td>J/mol</td>
                  </tr>
                  <tr>
                    <td><Param parameter="DbCp" /></td>
                    <td>{{ item.params.DbCp }}</td>
                    <td>J/(mol⋅K)</td>
                  </tr>
                </table>
                <!-- <div>
                  <span><i>D</i><sub>u</sub><i>H</i><sub class="ml-1"><i>T</i><sub>r</sub></sub></span>:{{item.params.DuH_Tr}} J/mol
                </div>
                <div>
                  <span><i>D</i><sub>u</sub><i>C</i><sub>p</sub></span>:{{item.params.DuCp}} J/(mol⋅K)
                </div>
                <div>
                  <span><i>D</i><sub>b</sub><i>H</i><sub class="ml-1"><i>T</i><sub>0</sub></sub></span>:{{item.params.DbH_T0}} J/mol
                </div>
                <div>
                  <span><i>D</i><sub>b</sub><i>C</i><sub>p</sub></span>: &nbsp; {{item.params.DbCp}} &nbsp; J/(mol⋅K)
                </div> -->
              </template>
            </v-data-table>
            <v-divider />
            <v-row class="mt-2 px-2">
              <v-btn v-if="!isCreatingGroup" class="ma-1 ml-2 mb-4" small color="primary" depressed @click="startGroupMode">
                <v-icon class="mr-2">mdi-plus</v-icon>Create error group
              </v-btn>
              <template v-else>
                <v-btn
                  class="ma-1 ml-2"
                  small
                  color="success"
                  :disabled="!selectedBindingexperiments || selectedBindingexperiments.length < 2 || isRequesting"
                  :loading="isRequesting"
                  @click="createGroup"
                >
                  <v-icon>mdi-check</v-icon>Create group
                </v-btn>
                <v-text-field v-model="groupLabel" class="mr-2" dense single-line label="Group label"></v-text-field>
                <v-btn class="ma-1" icon small color="error" @click="cancelGroupModel">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-spacer />
              </template>
            </v-row>
          </v-tab-item>

          <v-tab-item key="errors">
            <v-data-table
              dense
              disable-pagination
              hide-default-footer
              :headers="error_headers"
              :items="errorBindingExpGroups"
              class="elevation-0"
            >
              <template #[`header.averageKb`]="{}"> average <Param parameter="Kb" /> </template>

              <template #[`item.averageKb`]="{ item }">
                {{ item.averageKb ? item.averageKb.toExponential(2) : item.params.Kb }}
              </template>

              <template #[`item.bindingExpIDs`]="{ item }">
                <v-tooltip bottom>
                  <template #activator="{ on }">
                    <v-chip v-on="on">{{ item.bindingExpIDs }}</v-chip>
                  </template>
                  <div v-for="bindingExpID in item.bindingExpIDs" :key="bindingExpID">
                    {{ tooltipText(bindingExpID) }}
                  </div>
                </v-tooltip>
              </template>

              <template #[`item.errorKb`]="{ item }">
                {{ item.errorKb ? `[${item.errorKb[0].toExponential(2)}, ${item.errorKb[1].toExponential(2)}]` : item.errorKb }}
              </template>

              <template #[`item.actions`]="{ item }">
                <v-btn icon @click="deleteError(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
                <v-btn icon @click="recalculateError(item)">
                  <v-icon :class="{ 'mdi-spin': calculatingList.includes(item.id) }">mdi-refresh</v-icon>
                </v-btn>
              </template>
            </v-data-table>
            <v-divider />
            <v-row no-gutters class="ma-1">
              <v-btn small color="primary" :disabled="isRequesting" depressed :loading="isRequesting" @click="recalculateErrors"
                >Recalculate</v-btn
              >
            </v-row>
          </v-tab-item>
        </v-tabs-items>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, Ref, ref } from "@vue/composition-api";
import { BindingExperiment, ErrorBindingExpGroup } from "../../models";
import { CopyToClipboard, DownloadFile, GenerateCSV } from "../../utils/utils";
import { getBindingExperimentFromIndex, getBindingExperimentsFromIndexes } from "../../utils/bindingexperiment_manager";
import { useAppData } from "@/store";
import { CalculateBindingExperimentGroupError } from "@/utils/api_hub";
import { useNotify } from "../Generic/GlobalSnackbarStore";

export default defineComponent({
  props: { bindingExperiments: Array as PropType<BindingExperiment[]> },
  setup(props) {
    const appData = useAppData();
    const notify = useNotify();

    const dialog = computed({
      get(): boolean {
        return _dialog.value;
      },
      set(v: boolean) {
        if (v == false) {
          cancelGroupModel();
        }
        _dialog.value = v;
      },
    });

    const _dialog = ref(false);
    const tab = ref(0);
    const groupLabel = ref("");
    const isCreatingGroup = ref(false);
    const isRequesting = ref(false);
    const selectedBindingexperiments: Ref<BindingExperiment[]> = ref([]);

    const errorBindingExpGroups = computed(() => appData.errorBindingExpGroups);

    const anchor: Ref<HTMLElement> = ref(null);

    const headers = [
      { text: "id", value: "id" },
      { text: "name", value: "name" },
      { text: "protein", value: "protein" },
      { text: "ligand", value: "ligand" },
      // { text: "params", value: "params" },
      { text: "Kb", value: "params.Kb" },
      { text: "Conf. interval.", value: "params.Kb_confidence_interval" },
      { text: "T0 (°C)", value: "params.T0" },
      { text: "Parameters", value: "params" },
      { text: "comment", value: "comment" },
    ];
    const error_headers = [
      { text: "id", value: "id" },
      { text: "name", value: "name" },
      { text: "binding experiments", value: "bindingExpIDs" },
      { text: "averageKb", value: "averageKb" },
      { text: "error range", value: "errorKb" },
      { text: "", value: "actions" },
    ];

    const startGroupMode = () => {
      selectedBindingexperiments.value = [];
      isCreatingGroup.value = true;
    };
    const cancelGroupModel = () => {
      isCreatingGroup.value = false;
      selectedBindingexperiments.value = [];
      groupLabel.value = "";
    };

    const calculatingList: Ref<number[]> = ref([]);

    const createGroup = async () => {
      isCreatingGroup.value = false;
      isRequesting.value = true;

      const params = selectedBindingexperiments.value.map((x) => x.params);
      //const res_data = await this.calculateErrorsRequest(params);
      const res = await CalculateBindingExperimentGroupError(params);

      if (!res.ok) {
        notify(res.message, "error", 10_000);
        return;
      }

      const new_id = appData.errorBindingExpGroups.length !== 0 ? Math.max(...appData.errorBindingExpGroups.map((x) => x.id)) + 1 : 1;
      const bindingExpGroupError: ErrorBindingExpGroup = {
        id: new_id,
        name: groupLabel.value,
        bindingExpIDs: selectedBindingexperiments.value.map((x) => x.id),
        averageKb: res.data.averageKb,
        errorKb: res.data.errorKb,
      };
      errorBindingExpGroups.value.push(bindingExpGroupError);
      cancelGroupModel();
      isRequesting.value = false;
      notify("Group created", "success", 4000);
    };

    const deleteError = (errorBindingExpGroup: ErrorBindingExpGroup) => {
      const index = appData.errorBindingExpGroups.findIndex((x) => x.id == errorBindingExpGroup.id);
      if (index > -1) {
        appData.errorBindingExpGroups.splice(index, 1);
      }
    };

    const recalculateError = async (errorBindingExpGroup: ErrorBindingExpGroup) => {
      calculatingList.value.push(errorBindingExpGroup.id);
      const params = getBindingExperimentsFromIndexes(errorBindingExpGroup.bindingExpIDs).map((x) => x.params);
      const res = await CalculateBindingExperimentGroupError(params);
      if (!res.ok) return;
      errorBindingExpGroup.averageKb = res.data.averageKb;
      errorBindingExpGroup.errorKb = res.data.errorKb;
      calculatingList.value = calculatingList.value.filter((x) => x != errorBindingExpGroup.id);
      //delete (errorBindingExpGroup as any).calculating;
    };

    const recalculateErrors = async () => {
      isRequesting.value = true;
      const requests: Promise<void>[] = [];
      for (const errorGroup of errorBindingExpGroups.value) {
        requests.push(recalculateError(errorGroup));
      }
      await Promise.all(requests);
      isRequesting.value = false;
    };

    const getTableData = (type: "download" | "copy" = "copy") => {
      let h: { value: string; text: string }[] = [];
      if (tab.value == 0) {
        h = [
          ...headers.filter((x) => x.value != "params"),
          { value: "params.DuH_Tr", text: "DuH_Tr" },
          { value: "params.DuCp", text: "DuCp" },
          { value: "params.DbH_T0", text: "DbH_T0" },
          { value: "params.DbCp", text: "DbCp" },
          { value: "params.Pt", text: "Pt" },
        ];
      } else {
        h = error_headers.filter((x) => x.text != "");
      }

      const data = tab.value == 0 ? props.bindingExperiments : appData.errorBindingExpGroups;

      if (type === "copy") {
        const text = GenerateCSV(h, data, "\t");
        CopyToClipboard(text);
        notify("Copied to clipboard", "success", 4_000);
      } else {
        const text = GenerateCSV(h, data, ",");
        DownloadFile(text, "table.csv", { anchor: anchor.value, mimetype: "data:text/plain;charset=utf-8" });
      }
    };

    const tooltipText = (bindingExperimentID: number) => {
      const bindingExperiment = getBindingExperimentFromIndex(bindingExperimentID);
      if (bindingExperiment != null) {
        return `(${bindingExperiment.id}) ${bindingExperiment.name} | ${bindingExperiment.params?.Kb?.toExponential(3)}`;
      }
      return "";
    };

    return {
      dialog,
      tab,
      groupLabel,
      isRequesting,
      isCreatingGroup,
      selectedBindingexperiments,
      errorBindingExpGroups,
      headers,
      error_headers,
      calculatingList,
      anchor,
      startGroupMode,
      cancelGroupModel,
      createGroup,
      tooltipText,
      deleteError,
      recalculateError,
      recalculateErrors,
      getTableData,
    };
  },
});
</script>
