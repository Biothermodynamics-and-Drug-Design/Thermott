<template>
  <div class="pa-2">
    <v-form ref="loginForm" v-model="allowLogin" class="d-flex flex-column align-center">
      <v-select v-model="submissionModel.databaseInfo.name" :items="databases" label="Database" outlined />
      <div class="d-flex flex-row align-center">
        <v-text-field
          v-model="submissionModel.auth.username"
          outlined
          type="text"
          autocomplete="username"
          label="Username"
          :rules="loginRules"
          placeholder=" "
          persistent-placeholder
        />
        <v-text-field
          v-model="submissionModel.auth.password"
          outlined
          type="password"
          autocomplete="current-password"
          label="Password"
          class="mx-2"
          :rules="loginRules"
          placeholder=" "
          persistent-placeholder
        />
      </div>
      <div class="d-flex flex-row justify-space-between">
        <v-btn depressed class="mx-2" color="primary" small :loading="isLoadingDBdata" :disabled="!loginForm" @click="loadDatabase"
          >Load data</v-btn
        >
        <v-btn depressed class="mx-2" color="primary" small :disabled="!submissionModel.isDbLoaded" @click="submissionModel.step++"
          >Next <v-icon> mdi-chevron-right</v-icon>
        </v-btn>
      </div>

      <v-spacer />
    </v-form>
    <div v-if="submissionModel.isDbLoaded" class="d-flex flex-row justify-center mt-4">Loaded</div>
    <div v-else class="d-flex flex-row justify-center mt-4">No data loaded</div>
  </div>
</template>

<script lang="ts">
import { validationRules } from "@/utils/validationRules";
import { defineComponent, PropType, ref } from "@vue/composition-api";
import { DatabasePageModel, DBdata } from "./database";
import { DownloadDbTable, GetTSAExperimentLabel } from "./databaseFunc";

export default defineComponent({
  props: { submissionModel: Object as PropType<DatabasePageModel> },
  setup(props) {
    const loginForm = ref(null);
    const allowLogin = ref(false);

    const databases = ["BVTS", "BVTS_test"];
    const loginRules = [validationRules.exists];

    const isLoadingDBdata = ref(false);

    const loadDatabase = async () => {
      const loadTable = async (table: string, target: keyof DBdata) => {
        const data = await DownloadDbTable(props.submissionModel.databaseInfo.apiLink, table, props.submissionModel.auth, {
          format: "csv",
          rows: 999999,
        });
        props.submissionModel.dbData[target].splice(0, props.submissionModel.dbData[target].length);
        props.submissionModel.dbData[target].push(...data);
      };
      const setLabel = async () => {
        const label = await GetTSAExperimentLabel(props.submissionModel.databaseInfo.apiLink, props.submissionModel.auth);
        props.submissionModel.initialExperimentLabel = label;
      };
      isLoadingDBdata.value = true;
      const promises: Promise<void>[] = [];
      // promises.push(loadTable("protein", "proteins"));
      // promises.push(loadTable("compound", "compounds"));
      // promises.push(loadTable("author", "authors"));
      promises.push(loadTable("device", "device"));
      promises.push(loadTable("buffer", "buffer"));
      promises.push(setLabel());

      await Promise.all(promises);
      isLoadingDBdata.value = false;

      // props.submissionModel.session = null;

      // props.submissionModel.experimentRequests.splice(0, props.submissionModel.experimentRequests.length);
      // props.submissionModel.files.splice(0, props.submissionModel.files.length);
      // props.submissionModel.analysisFile = null;

      props.submissionModel.isDbLoaded = true;
      props.submissionModel.step = 2;
    };

    return { loginForm, loadDatabase, databases, loginRules, allowLogin, isLoadingDBdata };
  },
});
</script>
