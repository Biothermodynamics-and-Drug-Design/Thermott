<template>
  <v-card v-if="!submissionModel.session" class="ma-2" elevation="0">
    <v-card-title>
      <v-select
        v-model="selectedSessionType"
        outlined
        label="Select session"
        hide-details
        :items="sessionTypes"
        item-value="value"
        item-text="text"
      />
    </v-card-title>
    <v-card-text class="mt-4">
      <template v-if="selectedSessionType == 'currentSession'">
        <v-btn color="primary" :disabled="currentSessionBindingExperimentCount < 1" @click="loadCurrentSession">Load</v-btn>
      </template>
      <v-file-input v-model="file" label="File input" outlined :rules="rules" truncate-length="70" />
      <div class="d-flex justify-center">
        <v-btn depressed color="primary" @click="loadUploadSession">Load</v-btn>
      </div>
    </v-card-text>
  </v-card>

  <v-card v-else class="ma-2" outlined elevation="0">
    <v-card-title class="grey lighten-3">
      Loaded session
      <v-spacer />
      <v-btn small text @click="clearSession">Cancel <v-icon>mdi-close</v-icon> </v-btn>
    </v-card-title>
    <v-card-text class="px-0 py-2">
      <session-info
        class="ma-4"
        :session-data="submissionModel.session"
        :session-file-name="submissionModel.analysisFile.sessionFileName"
      />
    </v-card-text>
    <v-divider />
    <v-card-actions>
      <v-spacer />
      <v-btn depressed small color="primary" @click="submissionModel.step++">Next</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from "@vue/composition-api";
import { Author, DatabasePageModel, ExperimentRequest, FileRequest } from "./database";
import { AppData } from "@/models";
import { CompoundDilutions, DownloadDbTable, generateExperimentLabel, InitialAddDbData } from "./databaseFunc";
import SessionInfo from "./components/DisplaySessionInfo.vue";
import { confirmDialog } from "../Generic/confirmdialog";
import Vue from "vue";
import { CompatibilityFix } from "@/utils/localStorage";
import { useAppData } from "@/store";

export default defineComponent({
  components: { SessionInfo },
  props: {
    submissionModel: Object as PropType<DatabasePageModel>,
  },
  emits: ["update:submissionModel"],
  setup(props, { emit }) {
    const appData = useAppData();
    const file = ref(null as File);

    const rules = computed(() => [
      (v: File) => !!v || "missing file",
      (v: File) => (v && v.name.split(".")[1].toLowerCase() == "json") || "must be a JSON file",
    ]);

    const loadSession = async (appData: AppData, sessionFileName: string | null = null) => {
      CompatibilityFix(appData);
      console.log(appData);
      props.submissionModel.files = [];
      const files = props.submissionModel.files;

      const authorFullName = appData.sessionInfo.author;

      const authorNames = authorFullName.split(" ") as string[];
      let searchNames = [] as string[];
      if (authorNames.length > 0) {
        searchNames = authorNames.slice(0, Math.min(authorNames.length, 2));
      }

      let authorPromise = null as Promise<any[]>;
      if (searchNames.length > 0) {
        const firstNameSearch = searchNames[0];
        const filter = {
          filter: `((name CONTAINS "${firstNameSearch}") OR (middle_names CONTAINS "${firstNameSearch}") OR (birth_name CONTAINS "${firstNameSearch}") OR (surname CONTAINS "${firstNameSearch}"))`,
        };
        authorPromise = DownloadDbTable(
          props.submissionModel.databaseInfo.apiLink,
          "author",
          props.submissionModel.auth,
          filter
        ) as Promise<Author[]>;
      }

      for (let i = 0; i < appData.originFiles.length; i++) {
        const originFile = appData.originFiles[i];
        const file: FileRequest = {
          //file_name:  originFile.name,
          id: i + 1,
          name: originFile.name,
          originFile_id: originFile.id,
          file: null,
          notes: "",
        };
        files.push(file);
      }

      props.submissionModel.analysisFile = {
        file: null,
        notes: "",
        sessionFileName: sessionFileName,
      };

      //TSA_experiments
      const currentDate = new Date().toISOString().replace(/T.*/, "");

      for (let index = 0; index < appData.bindingExperiments.length; index++) {
        const bindingExperiment = appData.bindingExperiments[index];

        const getValue = (property: keyof ExperimentRequest, defaultValue: any = null) => {
          if (bindingExperiment.PLBDAnnotation && bindingExperiment.PLBDAnnotation[property]) {
            return bindingExperiment.PLBDAnnotation[property];
          } else {
            return defaultValue;
          }
        };

        //const originFileIds = appData.experimentWells.filter((x) => bindingExperiment.expPointIndexes.includes(x.id)).map((x) => x.file_id);
        //const originFileIds = getExperimentWellsFromBindingExperiment(bindingExperiment).map(x => x.file_id);\
        const experimentWells = appData.experimentWells.filter((x) => bindingExperiment.expPointIndexes.includes(x.id));
        const compoundDilutions = CompoundDilutions(experimentWells.map((x) => x.ligand_conc));

        const request: ExperimentRequest = {
          enabled: true,
          label: generateExperimentLabel(props.submissionModel.initialExperimentLabel, index),
          //notes: bindingExperiment.comment?.slice(),
          ph: getValue("ph", 7.5),
          //temperature: bindingExperiment.params.T0,
          reliability: getValue("reliability", 90),
          //kb_obs: bindingExperiment.params.Kb,
          dmso_concentration: getValue("dmso_concentration", 2),
          date: appData.sessionInfo?.experimentDate?.slice(),
          datestamp: currentDate,
          author: getValue("author"),
          device: getValue("device"),
          buffer: getValue("buffer"),
          compound: getValue("compound"),
          compound_batch: getValue("compound_batch"),
          protein_batch: getValue("protein_batch"),
          protein: getValue("protein"),
          compound_max_concentration: compoundDilutions.compound_max_concentration,
          step_count: compoundDilutions.step_count,
          dilution_factor: compoundDilutions.dilution_factor,
          buffer_concentration: 50,
        };
        //bindingExperiment.PLBDAnnotation = request;
        Vue.set(bindingExperiment, "PLBDAnnotation", request);
        InitialAddDbData(props.submissionModel.dbData, bindingExperiment);
      }

      if (searchNames.length > 0) {
        const filterAuthors = (await authorPromise) as Author[];
        for (const author of filterAuthors) {
          const index = props.submissionModel.dbData.author.findIndex((x) => x.id == author.id);
          if (index > -1) {
            props.submissionModel.dbData.author[index] = author;
          } else {
            props.submissionModel.dbData.author.push(author);
          }
        }
        const authorLength = filterAuthors.length;
        if (authorLength > 0) {
          if (authorLength == 1) {
            const author = filterAuthors[0];
            const res = await confirmDialog({
              text: `Is '${author.name} ${author.surname}' author of the experiments?`,
            });
            if (res) {
              appData.bindingExperiments.forEach((x) => {
                x.PLBDAnnotation.author = author;
              });
            }
          } else if (searchNames.length > 1) {
            const secondFilter = filterAuthors.filter(
              (x) => x.name == searchNames[1] || x.surname == searchNames[1] || x.birth_name == searchNames[1]
            );
            if (secondFilter.length == 1) {
              const author = secondFilter[0];
              const res = await confirmDialog({
                text: `Is '${author.name} ${author.surname}' author of the experiments?`,
              });
              if (res) {
                appData.bindingExperiments.forEach((x) => {
                  x.PLBDAnnotation.author = author;
                });
              }
            }
          }
        }
      }
      file.value = null;
      props.submissionModel.session = appData;
      emit("update:submissionModel", props.submissionModel);
      console.log(props.submissionModel);
    };

    const loadCurrentSession = () => {
      loadSession(Object.assign({}, appData));
    };

    const loadUploadSession = () => {
      const reader = new FileReader();
      console.log(file.value);
      reader.readAsText(file.value);
      let text_data = null;
      reader.onload = function () {
        text_data = reader.result.toString();
        const parsedData: AppData = JSON.parse(text_data);
        loadSession(parsedData, file.value.name);
      };
    };

    const currentSessionBindingExperimentCount = computed(() => appData.bindingExperiments?.length ?? 0);

    const sessionTypes = ref([
      { value: "loadFile", text: "Load JSON file" },
      {
        value: "currentSession",
        text: "Load current session",
      },
    ]);
    const selectedSessionType = ref("loadFile");
    const uniqueProteins = computed(() => {
      if (props.submissionModel && props.submissionModel.session && props.submissionModel.session.bindingExperiments) {
        return Array.from(new Set(props.submissionModel.session.bindingExperiments.map((x) => x.protein.trim())));
      } else {
        return [];
      }
    });
    const uniqueLigands = computed(() => {
      if (props.submissionModel && props.submissionModel.session && props.submissionModel.session.bindingExperiments) {
        return Array.from(new Set(props.submissionModel.session.bindingExperiments.map((x) => x.ligand.trim())));
      } else {
        return [];
      }
    });

    const clearSession = () => {
      // props.submissionModel.experimentRequests = [];
      // props.submissionModel.analysisFile = null;
      // props.submissionModel.session = null;
      // props.submissionModel.files = [];
      props.submissionModel.session = null;
    };

    return {
      file,
      rules,
      sessionTypes,
      uniqueProteins,
      uniqueLigands,
      selectedSessionType,
      currentSessionBindingExperimentCount,
      clearSession,
      loadUploadSession,
      loadCurrentSession,
    };
  },
});
</script>
