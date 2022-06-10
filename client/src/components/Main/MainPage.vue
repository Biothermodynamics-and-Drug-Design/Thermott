<template>
  <v-app>
    <!-- <v-container fluid class="px-xs-1  px-sm-2  px-md-10  px-lg-16"> -->
    <AppBar
      @preferencesDialog="preferencesDialog = true"
      @sessionDialog="sessionInfoDialog = true"
      @saveSessionDialog="saveSessionDialog = true"
      @loadSession="loadFromFileLocalStorageClick"
    />
    <confirm-dialog />

    <v-row justify="center">
      <!-- <v-col xs="12" sm="12" md="12" lg="10" > -->
      <v-col xl="11">
        <GlobalSnackbar style="z-index: 99999999" />
        <PreferencesDialog :dialog="preferencesDialog" @update-dialog="preferencesDialog = $event" />
        <save-session-dialog :dialog="saveSessionDialog" @update:dialog="saveSessionDialog = $event" />
        <SessionInfoDialog :dialog="sessionInfoDialog" @update:dialog="sessionInfoDialog = $event" />
        <input id="fileinput" type="file" hidden style="height: 0px; width: 0px" @change="loadFromFileLocalStorage" />
        <!--demo-->
        <v-row no-gutters class="my-1" justify="center">
          <demo-component class="mb-3" />
        </v-row>

        <v-row v-if="appSettings.AlwaysShowRawFileNames && appData.originFiles.length > 0" class="mt-0" no-gutters justify="center">
          <show-raw-filenames />
        </v-row>
        <v-row no-gutters justify="center">
          <v-card color="grey lighten-1" class="ma-2 mt-3" tile outlined style="max-width: 1980px; width: 100%">
            <v-card-text class="pa-0">
              <v-tabs v-model="tab" color="indigo" height="40" active-class="active-tab">
                <v-tab v-show="false" to="/Home">
                  <v-avatar color="indigo" size="20" class="mr-1"> <span class="white--text button">?</span> </v-avatar>Start
                </v-tab>
                <v-tab to="/RawData">
                  <v-avatar :color="tab === '/RawData' ? 'indigo' : 'grey'" size="20" class="mr-2">
                    <span class="white--text button">1</span> </v-avatar
                  >Add raw data
                </v-tab>
                <v-icon color="grey darken-2" class="mdi-rotate-90 mx-4" v-text="'mdi-navigation'" />
                <v-tab to="/MetaData">
                  <v-avatar :color="tab === '/MetaData' ? 'indigo' : 'grey'" size="20" class="mr-2">
                    <span class="white--text button">2</span> </v-avatar
                  >Add experiment info
                </v-tab>
                <v-icon color="grey darken-2" class="mdi-rotate-90 mx-4" v-text="'mdi-navigation'" />
                <v-tab key="Binding" value="Binding" to="/Binding">
                  <v-avatar :color="tab === '/Binding' ? 'indigo' : 'grey'" size="20" class="mr-2">
                    <span class="white--text button">3</span> </v-avatar
                  >Fit binding parameters
                </v-tab>
                <!-- <v-spacer /> -->
                <v-tab v-if="false" key="database" to="/Database"> <v-icon small class="mr-2">mdi-database</v-icon>Database </v-tab>
                <v-tab v-if="false" key="preferences" to="/Preferences"> <v-icon small class="mr-2">mdi-cog</v-icon>Settings </v-tab>
              </v-tabs>
              <v-divider />

              <v-tabs-items v-model="tab" class="px-3 pt-2">
                <v-tab-item id="/RawData">
                  <!-- <keep-alive>
                  <router-view v-if="tab === '/RawData'" />
                </keep-alive> -->
                  <router-view v-if="tab === '/RawData'" />
                </v-tab-item>
                <v-tab-item id="/MetaData">
                  <keep-alive>
                    <router-view v-if="tab === '/MetaData'" />
                  </keep-alive>
                </v-tab-item>
                <v-tab-item id="/Binding">
                  <!-- <keep-alive>
                  <router-view v-if="tab === '/Binding'" />
                </keep-alive> -->
                  <router-view v-if="tab === '/Binding'" />
                </v-tab-item>
                <v-tab-item id="/Database">
                  <router-view v-if="tab === '/Database'" />
                </v-tab-item>
                <v-tab-item id="/Preferences">
                  <router-view v-if="tab === 'Preferences'" />
                </v-tab-item>
                <v-tab-item id="/NI">
                  <router-view v-if="tab === 'NI'" />
                </v-tab-item>
              </v-tabs-items>
            </v-card-text>
          </v-card>
        </v-row>
      </v-col>
    </v-row>
    <v-footer class="text-caption">
      <ChangelogDialog> </ChangelogDialog>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "@vue/composition-api";
import GlobalSnackbar from "@/components/Generic/GlobalSnackbar.vue";
import DemoComponent from "@/components/Generic/Demo/DemoCard.vue";
import SaveSessionDialog from "./SaveSessionDialog.vue";
import PreferencesDialog from "@/components/PreferencesDialog/PreferencesDialog.vue";
import SessionInfoDialog from "@/components/Main/SessionInfoDialog.vue";
import ChangelogDialog from "@/components/Main/ChangelogDialog.vue";
import AppBar from "./AppBar.vue";
import { SaveAppData_LocalStorage, SaveAppSetting_LocalStorage, Load_Appdata } from "@/utils/localStorage";
import { AppData } from "@/models";
import ShowRawFilenames from "./ShowRawFilenames.vue";
import ConfirmDialog from "@/components/Generic/ConfirmDialog.vue";
import { useAppData, useAppSettings } from "@/store";

export default defineComponent({
  components: {
    AppBar,
    GlobalSnackbar,
    SaveSessionDialog,
    DemoComponent,
    PreferencesDialog,
    SessionInfoDialog,
    ChangelogDialog,
    ShowRawFilenames,
    ConfirmDialog,
  },
  setup() {
    const tab = ref("Home");

    const saveSessionDialog = ref(false);

    const preferencesDialog = ref(false);
    const sessionInfoDialog = ref(false);

    const loadFromFileLocalStorageClick = () => {
      const fileinput = document.getElementById("fileinput");
      fileinput.click();
    };

    const loadFromFileLocalStorage = async (e: any) => {
      const file = e.target.files[0] as File;
      const reader = new FileReader();
      reader.readAsText(file);
      let text_data = null;
      //const ctx = this;
      reader.onload = function () {
        text_data = reader.result.toString();
        const parsedData: AppData = JSON.parse(text_data);
        Load_Appdata(parsedData);
      };

      const fileinput = document.getElementById("fileinput") as HTMLInputElement;
      fileinput.value = null;

      await SaveAppData_LocalStorage();
    };

    const appData = useAppData();
    const appSettings = useAppSettings();

    watch(appData, () => {
      SaveAppData_LocalStorage();
    });

    watch(appSettings.TabPreferences, () => {
      SaveAppSetting_LocalStorage();
    });

    return {
      tab,
      saveSessionDialog,
      preferencesDialog,
      sessionInfoDialog,
      appSettings,
      loadFromFileLocalStorageClick,
      loadFromFileLocalStorage,
      appData,
    };
  },
});
</script>

<style scoped>
.active-tab {
  background-color: #e0e0e0;
}
</style>
