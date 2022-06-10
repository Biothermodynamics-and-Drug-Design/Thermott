<template>
  <v-app>
    <v-container fill-height fluid justify-center align-center>
      <v-card class="ma-0" elevation="0" outlined>
        <v-card-title class="grey lighten-2">
          Developer settings
          <v-spacer />
        </v-card-title>

        <v-card-text class="pa-2 pt-6 ma-2 pb-4 text-subtitle-1">
          <v-switch v-model="plbdIntegration" inset label="PLBD integration" />
          <span>In binding experiment tab shows PLBD button to annotate binding experiments</span>
        </v-card-text>

      </v-card>

    </v-container>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, computed } from "@vue/composition-api";
import { SaveAppSetting_LocalStorage } from "@/utils/localStorage";
import { useAppSettings } from "@/store";

export default defineComponent({
  setup() {
    const appSettings = useAppSettings();
    const plbdIntegration = computed({
      get: () => appSettings.DevelopmentSettings.PLBDIntegration,
      set: (value: boolean) => {
        appSettings.DevelopmentSettings.PLBDIntegration = value;
        SaveAppSetting_LocalStorage();
      },
    });

    return { plbdIntegration };
  },
});
</script>

