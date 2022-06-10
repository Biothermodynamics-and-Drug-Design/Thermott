<template>
  <v-dialog v-model="_dialog" fullscreen>
    <v-card>
      <v-card-title class="text-h6 grey lighten-2">
        Analysis file info
        <v-spacer />
        <v-icon class="mr-2" @click="closeDialog">mdi-close</v-icon>
      </v-card-title>

      <v-card-text>
        <v-container v-if="tempSessionInfo">
          <div class="d-flex flex-column">
            <v-text-field v-model="tempSessionInfo.name" label="Session name"></v-text-field>
            <v-text-field v-model="tempSessionInfo.author" label="Experiment author"></v-text-field>

            <v-text-field v-model="tempSessionInfo.experimentDate" label="Experiment date" :rules="dateRules" hint="YYYY-MM-DD">
              <template #prepend>
                <v-menu
                  ref="menuExperimentDate"
                  v-model="experimentDateMenu"
                  :close-on-content-click="false"
                  :return-value.sync="tempSessionInfo.experimentDate"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template #activator="{ on, attrs }">
                    <v-icon v-bind="attrs" v-on="on">mdi-calendar</v-icon>
                  </template>
                  <v-date-picker v-model="tempSessionInfo.experimentDate" no-title scrollable>
                    <v-spacer></v-spacer>
                    <v-btn text color="primary" @click="experimentDateMenu = false"> Cancel </v-btn>
                    <v-btn text color="primary" @click="saveDate()"> OK </v-btn>
                  </v-date-picker>
                </v-menu>
              </template>
            </v-text-field>

            <v-text-field v-model="tempSessionInfo.sessionDate" disabled label="Session date" prepend-icon="mdi-calendar"></v-text-field>

            <v-text-field
              v-model="tempSessionInfo.createdClientVersion"
              dense
              disabled
              label="Created client version"
              class="mt-4"
            ></v-text-field>
            <v-text-field v-model="tempSessionInfo.currentClientVersion" dense disabled label="Current client version"></v-text-field>
          </div>

          <div v-if="originFiles && originFiles.length > 0" class="d-flex flex-column text-subtitle-1">
            <div class="font-weight-bold">Raw files:</div>
            <div v-for="(item, index) in originFiles" :key="index">
              {{ `#${item.id} ${item.name}` }}
            </div>
          </div>
        </v-container>
      </v-card-text>
      <v-divider />
      <v-card-actions class="d-flex justify-center">
        <v-btn color="grey lighten-2" depressed @click="closeDialog()">Cancel</v-btn>
        <v-btn color="primary" depressed @click="saveSessionInfo()">Apply</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { AppData, SessionInfo } from "@/models";
import { computed, defineComponent, PropType, ref, watch } from "@vue/composition-api";
import { useNotify } from "../Generic/GlobalSnackbarStore";
import { validationRules } from "@/utils/validationRules";
import { useAppData } from "@/store";

export default defineComponent({
  props: {
    dialog: { type: Boolean, default: false },
    appData: Object as PropType<AppData>,
  },
  emits: ["update:dialog"],
  setup(props, { emit }) {
    const appData = useAppData();

    const menuExperimentDate = ref(null as any);

    const saveDate = () => {
      menuExperimentDate.value.save(tempSessionInfo.value.experimentDate);
    };

    const _dialog = computed({
      get(): boolean {
        return props.dialog;
      },
      set(value: boolean): void {
        emit("update:dialog", value);
      },
    });

    const notify = useNotify();

    const experimentDateMenu = ref(false);
    const sessionDateMenu = ref(false);

    const originFiles = computed(() => appData.originFiles);

    const tempSessionInfo = ref(null as SessionInfo);

    const closeDialog = () => {
      _dialog.value = false;
      tempSessionInfo.value = null;
    };

    const saveSessionInfo = () => {
      appData.sessionInfo = tempSessionInfo.value;
      closeDialog();
      notify("Information updated", "success");
    };

    const dateRules = [validationRules.validISODateYYYYMMDD];

    watch(
      () => _dialog.value,
      (newValue) => {
        if (newValue == true) {
          tempSessionInfo.value = Object.assign({}, appData.sessionInfo);
        }
      }
    );

    return {
      _dialog,
      sessionDateMenu,
      menuExperimentDate,
      saveDate,
      saveSessionInfo,
      closeDialog,
      tempSessionInfo,
      originFiles,
      experimentDateMenu,
      dateRules,
    };
  },
});
</script>
