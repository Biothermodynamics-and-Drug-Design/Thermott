<template>
  <v-app>
    <confirm-dialog />
    <GlobalSnackbar />

    <v-container fill-height fluid>
      <v-row justify="center">
        <v-col>
          <div class="d-flex flex-row align-center justify-center mb-2">
            <v-chip v-if="submissionModel.isDbLoaded" :href="submissionModel.databaseInfo.dbLink" target="_blank" outlined color="primary">
              Database <b class="ml-1">{{ submissionModel.databaseInfo.name }}</b
              ><v-icon size="24" class="ml-2">mdi-link</v-icon>
            </v-chip>
          </div>
          <v-row justify="center">
            <v-col xs="12" sm="12" md="12" lg="11" xl="9">
              <v-sheet outlined>
                <v-stepper v-model="submissionModel.step" elevation="0" class="elevation-0">
                  <v-stepper-header class="elevation-0">
                    <v-stepper-step step="1" :complete="submissionModel.isDbLoaded" editable> Load database </v-stepper-step>

                    <v-divider />

                    <v-stepper-step step="2" :editable="submissionModel.isDbLoaded"> Select session </v-stepper-step>

                    <v-divider />

                    <v-stepper-step step="3" :editable="submissionModel.isDbLoaded && !!submissionModel.session">
                      Fill out experiment data
                    </v-stepper-step>

                    <v-divider />

                    <v-stepper-step step="4" :editable="submissionModel.isDbLoaded && !!submissionModel.session">
                      Link files
                    </v-stepper-step>
                    <v-divider></v-divider>
                    <v-stepper-step step="5" :editable="submissionModel.isDbLoaded && !!submissionModel.session">
                      Overview &#38; submit
                    </v-stepper-step>
                    <v-divider />
                    <v-stepper-step
                      step="6"
                      :editable="submissionModel.isDbLoaded && !!submissionModel.session && !!submissionModel.submissionResponse"
                    >
                      Results
                    </v-stepper-step>
                  </v-stepper-header>
                  <v-divider />

                  <v-stepper-items>
                    <v-stepper-content step="1">
                      <SubmissionLoadDb :submission-model.sync="submissionModel" />
                    </v-stepper-content>
                    <v-stepper-content step="2">
                      <SubmissionSelectSession :submission-model="submissionModel" @update:submissionModel="submissionModel = $event" />
                    </v-stepper-content>
                    <v-stepper-content step="3">
                      <SubmissionExperiment
                        v-if="submissionModel.session"
                        :api-link="submissionModel.databaseInfo.apiLink"
                        :auth="submissionModel.auth"
                        :session="submissionModel.session"
                        :db-data="submissionModel.dbData"
                        :submission-model.sync="submissionModel"
                      />
                    </v-stepper-content>
                    <v-stepper-content step="4">
                      <SubmissionFiles v-if="submissionModel.session" :submission-model.sync="submissionModel" />
                    </v-stepper-content>
                    <v-stepper-content step="5">
                      <SubmissionOverview
                        v-if="submissionModel.step == 5 && submissionModel.session"
                        :submission-model.sync="submissionModel"
                      />
                    </v-stepper-content>
                    <v-stepper-content step="6">
                      <SubmissionResults v-if="submissionModel.session" :submission-model.sync="submissionModel" />
                    </v-stepper-content>
                  </v-stepper-items>
                </v-stepper>
              </v-sheet>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, reactive } from "@vue/composition-api";
import ConfirmDialog from "@/components/Generic/ConfirmDialog.vue";
import { DatabasePageModel } from "./database";
import SubmissionExperiment from "./SubmissionExperiment.vue";
import SubmissionSelectSession from "./SubmissionSelectSession.vue";
import GlobalSnackbar from "@/components/Generic/GlobalSnackbar.vue";
import SubmissionOverview from "./SubmissionOverview.vue";
import SubmissionFiles from "./SubmissionFiles.vue";
import SubmissionLoadDb from "./SubmissionLoadDb.vue";
import SubmissionResults from "./SubmissionResults.vue";

export default defineComponent({
  name: "DatabaseTab",
  components: {
    SubmissionExperiment,
    SubmissionFiles,
    SubmissionOverview,
    SubmissionLoadDb,
    SubmissionResults,
    ConfirmDialog,
    SubmissionSelectSession,
    GlobalSnackbar,
  },
  setup() {
    const submissionModel = reactive(new DatabasePageModel());

    return { submissionModel };
  },
});
</script>
