<template>
  <v-dialog v-model="dialog" fullscreen>
    <template #activator="{ on, attrs }">
      <v-btn color="accent" outlined x-small v-bind="attrs" v-on="on"> PLBD </v-btn>
    </template>
    <v-card>
      <v-card-title class="grey lighten-2">
        PLBD integration
        <v-spacer />
        <v-btn icon @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text class="pt-3">
        <v-container>
          <PLBDOverviewTable v-if="!edit" :binding-experiments="appData.bindingExperiments" database-link="/plbd/BVTS" />
          <LoginPage v-if="!login && edit" :auth="auth" :login="login" @update:login="login = $event" />
          <v-sheet v-if="login && edit" outlined rounded>
            <SubmissionExperiment
              api-link="/plbd/BVTS"
              :db-data="dbData"
              :session="appData"
              :auth="auth"
              :hide-fields="['label', 'date', 'datestamp']"
            />
          </v-sheet>
        </v-container>
      </v-card-text>
      <v-divider />
      <v-card-actions class="d-flex justify-center">
        <v-btn depressed color="primary" @click="changeEdit">{{ !edit ? "Edit" : "Summary" }}</v-btn>
        <!-- <v-btn  depressed color="primary" to="/Database">Edit</v-btn> -->
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { AppData } from "@/models";
import { defineComponent, computed, ref, PropType } from "@vue/composition-api";
import PLBDOverviewTable from "./PLBDIntegration/PLBDOverviewTable.vue";
import LoginPage from "./PLBDIntegration/LoginPage.vue";
import { Auth, DBdata, ExperimentRequest } from "../database";
import { InitialAddDbData } from "../databaseFunc";
import SubmissionExperiment from "../SubmissionExperiment.vue";
import Vue from "vue";

export default defineComponent({
  components: { PLBDOverviewTable, LoginPage, SubmissionExperiment },
  props: { appData: Object as PropType<AppData> },
  setup(props) {
    const _dialog = ref(false);
    const dbData = ref(new DBdata());
    const login = ref(false);
    const auth = ref({ username: "", password: "" } as Auth);
    const edit = ref(false);
    const dialog = computed({
      get: () => _dialog.value,
      set: (value: boolean) => {
        _dialog.value = value;
        if (value == false) {
          edit.value = false;
          login.value = false;
        }
      },
    });

    const changeEdit = () => {
      edit.value = !edit.value;
      if (edit.value == true) {
        const currentDate = new Date().toISOString().replace(/T.*/, "");

        for (const bindingExperiment of props.appData.bindingExperiments) {
          if (!bindingExperiment.PLBDAnnotation) {
            const getValue = (property: keyof ExperimentRequest, defaultValue: any = null) => {
              if (bindingExperiment.PLBDAnnotation && bindingExperiment.PLBDAnnotation[property]) {
                return bindingExperiment.PLBDAnnotation[property];
              } else {
                return defaultValue;
              }
            };

            //const originFileIds = appData.experimentWells.filter((x) => bindingExperiment.expPointIndexes.includes(x.id)).map((x) => x.file_id);
            //const originFileIds = getExperimentWellsFromBindingExperiment(bindingExperiment).map(x => x.file_id);
            const request: ExperimentRequest = {
              enabled: true,
              label: "",
              //notes: bindingExperiment.comment?.slice(),
              ph: getValue("ph", 7.5),
              temperature: bindingExperiment.params.T0,
              reliability: getValue("reliability", 90),
              kb_obs: bindingExperiment.params.Kb,
              dmso_concentration: getValue("dmso_concentration", 2),
              date: props.appData.sessionInfo.experimentDate?.slice(),
              datestamp: currentDate,
              author: getValue("author"),
              device: getValue("device"),
              buffer: getValue("buffer"),
              compound: getValue("compound"),
              compound_batch: getValue("compound_batch"),
              protein_batch: getValue("protein_batch"),
              protein: getValue("protein"),
            };
            //bindingExperiment.PLBDAnnotation = request;
            Vue.set(bindingExperiment, "PLBDAnnotation", request);
          }
        }
        for (const bindingExperiment of props.appData.bindingExperiments) {
          InitialAddDbData(dbData.value, bindingExperiment);
        }
      }
    };

    return { dialog, login, edit, auth, dbData, changeEdit };
  },
});
</script>
