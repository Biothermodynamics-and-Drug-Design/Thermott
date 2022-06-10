<template>
  <v-dialog v-model="_dialog" fullscreen>
    <v-card>
      <v-card-title class="grey lighten-2">
        Settings
        <v-spacer />
        <v-btn icon @click="_dialog = false"><v-icon>mdi-close</v-icon></v-btn>
      </v-card-title>
      <v-card-text>
        <v-container class="spacedchildren">
          <v-card outlined flat>
            <v-card-title class="py-0 px-2 text-subtitle-1 grey lighten-2">General</v-card-title>
            <v-card-text class="d-flex flex-row flex-wrap spacedchildren pa-2">
              <v-switch
                v-model="AlwaysShowRawFileNames"
                class="mx-2 my-2 font-weight-medium"
                dense
                inset
                hide-details
                label="Always show raw data filenames"
              />
            </v-card-text>
          </v-card>

          <v-card outlined flat>
            <v-card-title class="py-0 px-2 text-subtitle-1 grey lighten-2">Binding model settings</v-card-title>
            <v-card-text class="d-flex flex-row flex-wrap spacedchildren pa-2">
              <BindingParamPresetsDialog />
              <DefaultModelParameters />
            </v-card-text>
          </v-card>

          <v-card outlined flat>
            <v-card-title class="py-0 px-2 text-subtitle-1 grey lighten-2">Tools</v-card-title>
            <v-card-text class="d-flex flex-row flex-wrap spacedchildren pa-2">
              <MergeSessionFileDialog />
              <v-btn small dense target="_blank" href="/ParameterPrediction" depressed outlined
                ><v-icon class="mr-2">mdi-counter</v-icon>Parameter prediction</v-btn
              >
            </v-card-text>
          </v-card>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { useAppSettings } from "@/store";
import { computed, defineComponent } from "@vue/composition-api";
import BindingParamPresetsDialog from "./BindingParamPresetsDialog.vue";
import DefaultModelParameters from "./DefaultModelParameters.vue";
import MergeSessionFileDialog from "./MergeSessionFileDialog.vue";
import { SaveAppSetting_LocalStorage } from "@/utils/localStorage";

export default defineComponent({
  components: { BindingParamPresetsDialog, DefaultModelParameters, MergeSessionFileDialog },
  props: { dialog: { type: Boolean, default: false } },
  emits: ["update-dialog"],
  setup(props, { emit }) {
    const appSettings = useAppSettings();

    const AlwaysShowRawFileNames = computed({
      get(): boolean {
        return appSettings.AlwaysShowRawFileNames;
      },
      set(value: boolean): void {
        appSettings.AlwaysShowRawFileNames = value;
        SaveAppSetting_LocalStorage();
      },
    });

    const _dialog = computed({
      get(): boolean {
        return props.dialog;
      },
      set(value: boolean): void {
        emit("update-dialog", value);
      },
    });

    return { AlwaysShowRawFileNames, _dialog };
  },
});
</script>

<style scoped>
.spacedchildren >>> .v-btn {
  margin: 5px;
}

.spacedchildren >>> .v-card {
  margin-top: 20px;
}
</style>
