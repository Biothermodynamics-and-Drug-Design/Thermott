<template>
  <v-container>
    <v-sheet outlined>
      <v-data-table
        :items="submissionModel.session.bindingExperiments"
        :headers="headers"
        disable-sort
      >
        <template #[`item.PLBDAnnotation.compound_batch`]="{ item }">
          <ViewDatabaseItemBttn
            :database-link="`${submissionModel.databaseInfo.dbLink}`"
            :text="compound_batch_display_name(item.PLBDAnnotation)"
            :item="item.PLBDAnnotation.compound_batch"
          />
        </template>
        <template #[`item.PLBDAnnotation.protein_batch`]="{ item }">
          <ViewDatabaseItemBttn
            :database-link="`${submissionModel.databaseInfo.dbLink}`"
            :text="protein_batch_display_name(item.PLBDAnnotation)"
            :item="item.PLBDAnnotation.protein_batch"
          />
        </template>
        <template #[`item.PLBDAnnotation.enabled`]="{ item }">
          <div class="d-flex justify-start align-center">
            <v-simple-checkbox
              v-model="item.PLBDAnnotation.enabled"
              :ripple="false"
            /><span class="ml-1">{{ item.id }}</span>
          </div>
        </template>
        <template #[`item.PLBDAnnotation.buffer`]="{ item }">
          <ViewDatabaseItemBttn
            :database-link="`${submissionModel.databaseInfo.dbLink}`"
            :text="buffer_display_name(item.PLBDAnnotation)"
            :item="item.PLBDAnnotation.buffer"
          />
        </template>
        <template #[`item.params.Kb`]="{ item }">
          <span v-html="formatKbValue(item.params.Kb)" />
        </template>

        <template #[`header.params.Kb`]="{}">
          <DisplayParam parameter="Kb" />
        </template>

        <template #[`item.file`]="{ item }">
          <template v-if="getRequestFiles(item).length > 0">
            <ViewDatabaseItemBttn
              v-for="(file, index) in getRequestFiles(item)"
              :key="index"
              :database-link="`${submissionModel.databaseInfo.dbLink}`"
              :item="file"
            />
          </template>
        </template>
      </v-data-table>
    </v-sheet>
    <div v-if="requestErrors.length == 0" class="d-flex flex-row mt-2">
      <!-- <v-btn depressed color="accent" @click="findDuplicatesAll" class="mr-3">Check Duplicates</v-btn> -->
      <validation-dialog :submission-model="submissionModel" />
      <v-spacer />
      <v-btn depressed color="primary darken-1" small @click="sendData"
        >Send data</v-btn
      >
    </div>
    <v-alert
      v-else
      type="error"
      text
      class="mt-2"
      color="error darken-1"
      prominent
      dense
    >
      <div v-for="error in requestErrors" :key="error">{{ error }}</div>
    </v-alert>
    <v-alert
      v-if="requestWarnings.length > 0"
      type="warning"
      text
      class="mt-2"
      color="warning darken-1"
      prominent
      dense
    >
      <div v-for="error in requestWarnings" :key="error">{{ error }}</div>
    </v-alert>
  </v-container>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  Ref,
  ref,
} from "@vue/composition-api";
import ViewDatabaseItemBttn from "./ViewDatabaseItemBttn.vue";
import {
  DatabasePageModel,
  ExperimentRequest,
  PLBDExperimentTSA,
} from "./database";
import { confirmDialog } from "../Generic/confirmdialog";
import { GetOriginFiles } from "./databaseFunc";
import ValidationDialog from "./components/ValidationDialog.vue";
import { BindingExperiment } from "@/models";
import { formatKb } from "@/utils/utils";
import DisplayParam from "@/components/Generic/DisplayParamater.vue";

export default defineComponent({
  components: { ViewDatabaseItemBttn, ValidationDialog, DisplayParam },
  props: { submissionModel: Object as PropType<DatabasePageModel> },
  emits: ["update:submissionModel"],
  setup(props, { emit }) {
    const submissionModel = computed({
      get: () => props.submissionModel,
      set: (value: DatabasePageModel) => emit("update:submissionModel", value),
    });

    const headers: { text: string; value: string; align?: string }[] = [
      { text: "#", value: "PLBDAnnotation.enabled", align: "center" },
      { text: "Protein", value: "PLBDAnnotation.protein_batch" },
      { text: "Compound", value: "PLBDAnnotation.compound_batch" },
      { text: "Buffer", value: "PLBDAnnotation.buffer" },
      // { text: "pH", value: "PLBDAnnotation.ph" },
      { text: "T (°C)", value: "params.T0" },
      { text: "Reliab.", value: "PLBDAnnotation.reliability" },
      { text: "DMSO (%)", value: "PLBDAnnotation.dmso_concentration" },
      { text: "Kb", value: "params.Kb" },
      { text: "File", value: "file" },
      // { text: "Duplicates", value: "duplicates" },
    ];

    const getRequestFiles = (bindingExperiment: BindingExperiment) => {
      const originFileIds = GetOriginFiles(
        props.submissionModel.session,
        bindingExperiment
      ).map((x) => x.id);
      const fileRequests = props.submissionModel.files.filter((x) =>
        originFileIds.includes(x.originFile_id)
      );
      return fileRequests;
    };

    const experimentHREF = (id: string) =>
      `${submissionModel.value.databaseInfo.dbLink}/experiment_tsa/${id}?depth=0`;
    const fileById = (fileRequestId: number) => {
      return submissionModel.value.files.find((x) => x.id == fileRequestId)
        .file;
    };

    const protein_batch_display_name = (
      experimentRequest: ExperimentRequest
    ) => {
      if (experimentRequest.protein_batch !== null) {
        const protein = experimentRequest.protein;
        const protein_batch = experimentRequest.protein_batch;
        //console.log(protein.id, protein_batch.id);
        //const protein = submissionModel.value.dbData.protein.find((x) => x.id == protein_batch.protein_id);
        return `[${protein.id}] <b>${protein?.name}</b><br/>[${protein_batch.id}] ${protein_batch?.label} ${protein_batch?.plasmid}`;
      } else return "-";
    };

    const compound_batch_display_name = (
      experimentRequest: ExperimentRequest
    ) => {
      if (experimentRequest.compound_batch !== null) {
        const compound = experimentRequest.compound;
        const compound_batch = experimentRequest.compound_batch;
        //const compound = submissionModel.value.dbData.compound.find((x) => x.id == compound_batch.compound_id);
        return `[${compound.id}] <b>${compound?.name}</b><br/>[${compound_batch.id}] ${compound_batch?.label}`;
      } else return "-";
    };

    const buffer_display_name = (experimentRequest: ExperimentRequest) => {
      if (experimentRequest.buffer === null) return "-";
      const buffer = experimentRequest.buffer;
      return `[${buffer.id}] ${buffer.label}, <b>pH ${experimentRequest.ph}<br/>${buffer.system}, ${buffer.salt}</b>`;
    };

    const duplicates: Ref<
      {
        loading: boolean;
        duplicateIds: number[];
        experimentRequestIndex: number;
      }[]
    > = ref([]);

    const sendData = async () => {
      const TSA_experiment_requests = [];

      const bindingExperiments =
        submissionModel.value.session.bindingExperiments.filter(
          (x) => x.PLBDAnnotation.enabled
        );

      for (let index = 0; index < bindingExperiments.length; index++) {
        const bindingExperiment = bindingExperiments[index];
        const experimentRequest = bindingExperiment.PLBDAnnotation;

        const tsa_file_relationships = [];
        const experimentWells =
          submissionModel.value.session.experimentWells.filter((x) =>
            bindingExperiment.expPointIndexes.includes(x.id)
          );
        const originFileIds = Array.from(
          new Set(experimentWells.map((x) => x.file_id))
        );
        for (let f = 0; f < originFileIds.length; f++) {
          const originFileId = originFileIds[f];
          const fileRequest = submissionModel.value.files.find(
            (x) => x.originFile_id == originFileId
          );

          const relationship_originFile: {
            type: "tsa_file";
            attributes: { file_id: string | number };
          } = {
            type: "tsa_file",
            attributes: {
              file_id: fileRequest.file.id,
            },
          };
          tsa_file_relationships.push(relationship_originFile);
        }

        const relationship_analysisFile: {
          type: "tsa_file";
          attributes: { file_id: string | number };
        } = {
          type: "tsa_file",
          attributes: {
            file_id: submissionModel.value.analysisFile.file.id,
          },
        };
        tsa_file_relationships.push(relationship_analysisFile);

        const convertedRequest: PLBDExperimentTSA = {
          type: "experiment_tsa",
          attributes: {
            uuid: bindingExperiment.uuid ?? null,
            author_id: experimentRequest.author?.id,
            device_id: experimentRequest.device?.id,
            buffer_id: experimentRequest.buffer?.id,
            label: experimentRequest.label,
            private_notes: bindingExperiment.comment,
            temperature: bindingExperiment.params.T0,
            reliability: experimentRequest.reliability,
            dmso_concentration: experimentRequest.dmso_concentration,
            kb_obs: bindingExperiment.params.Kb,
            ph: experimentRequest.ph,
            date: experimentRequest.date,
            datestamp: experimentRequest.datestamp,
            compound_batch_id: experimentRequest.compound_batch?.id,
            protein_batch_id: experimentRequest.protein_batch?.id,
            buffer_concentration: experimentRequest.buffer_concentration,
            compound_max_concentration:
              experimentRequest.compound_max_concentration,
            dilution_factor: experimentRequest.dilution_factor,
            step_count: experimentRequest.step_count,
            protein_concentration: Number.isNaN(bindingExperiment.params?.Pt)
              ? null
              : bindingExperiment.params.Pt * 10 ** 6,
          },
          relationships: {
            tsa_file: {
              data: tsa_file_relationships,
            },
          },
        };

        TSA_experiment_requests.push(convertedRequest);
      }

      const final_request = {
        data: TSA_experiment_requests,
      };

      console.log(final_request);

      const confirmText = `<div><span class='font-weight-bold'>${props.submissionModel.databaseInfo.name}</span> database </div><div><span class='font-weight-bold'>${TSA_experiment_requests.length}</span> experiments</div>`;

      const confirmation = (await confirmDialog({
        title: `Are you sure you want to send request to database?`,
        text: confirmText,
      })) as boolean;
      if (!confirmation) return;

      submissionModel.value.submissionResponse = null;
      submissionModel.value.submissionResult = null;

      const putSettings = {
        method: "POST",
        headers: {
          //"Content-Type": "application/vnd.api+json",
          "Content-Type": "application/json",
          Authorization:
            "Basic " +
            btoa(
              `${submissionModel.value.auth.username}:${submissionModel.value.auth.password}`
            ),
        },
        body: JSON.stringify(final_request),
      };

      const res = await fetch(
        `${props.submissionModel.databaseInfo.apiLink}/experiment_tsa`,
        putSettings
      );
      submissionModel.value.submissionResponse = res;
      const result = await res.json();
      submissionModel.value.submissionResult = result;

      if (res.ok) {
        const params = [
          `user=${encodeURI(props.submissionModel.auth.username)}`,
          `database=${encodeURI(props.submissionModel.databaseInfo.name)}`,
          `url=${encodeURI(props.submissionModel.databaseInfo.dbLink)}`,
          `count=${encodeURI(TSA_experiment_requests.length.toString())}`,
        ].join("&");
        fetch(`/api/metrics/plbd/experiment_tsa_create?${params}`);
      }

      submissionModel.value.step++;
      duplicates.value = [];
      console.log(res);
      console.log(result);
    };

    const requestErrors = computed(() => {
      if (submissionModel.value.session.bindingExperiments.length < 1) {
        return ["No experiments"];
      }
      if (submissionModel.value.analysisFile.file == null) {
        return [`No analysis file`];
      }
      if (submissionModel.value.files.some((x) => x.file == null))
        return ["Raw file undefined"];
      const enabledRequests =
        submissionModel.value.session.bindingExperiments.filter(
          (x) => x.PLBDAnnotation.enabled == true
        );
      if (enabledRequests.length == 0) {
        return ["All experiments are disabled"];
      }
      for (const bindingExperiment of enabledRequests) {
        if (
          bindingExperiment.PLBDAnnotation.compound_batch == null ||
          bindingExperiment.PLBDAnnotation.protein_batch == null
        ) {
          return [
            `Experiment #${bindingExperiment.id} has undefined protein/compound batch`,
          ];
        }
      }
      return [];
    });

    const missingValuesCheck = (
      property: keyof ExperimentRequest,
      missingText: string
    ) => {
      const ids = [];
      for (const bindingExperiment of submissionModel.value.session
        .bindingExperiments) {
        const experimentRequest = bindingExperiment.PLBDAnnotation;
        if (
          experimentRequest[property] == null ||
          (typeof experimentRequest[property] == "string" &&
            (experimentRequest[property] as string).trim().length == 0)
        ) {
          ids.push(bindingExperiment.id);
        }
      }

      if (ids.length == 0) return "";
      else return `${missingText}: ${ids.join(", ")}`;
    };

    const requestWarnings = computed(() => {
      let warnings: string[] = [];

      //warnings.push(missingValuesCheck("temperature", "Undefined temperate"));
      warnings.push(missingValuesCheck("author", "Undefined author"));
      warnings.push(missingValuesCheck("device", "Undefined device"));
      warnings.push(missingValuesCheck("label", "Undefined label"));
      warnings.push(missingValuesCheck("ph", "Undefined buffer pH"));
      warnings.push(missingValuesCheck("buffer", "Undefined buffer system"));

      warnings = warnings.filter((x) => x.length != 0);
      return warnings;
    });

    const formatKbValue = (value: number) => formatKb(value, 2, "Kb", false);

    return {
      duplicates,
      headers,
      requestErrors,
      requestWarnings,
      compound_batch_display_name,
      buffer_display_name,
      protein_batch_display_name,
      fileById,
      getRequestFiles,
      sendData,
      experimentHREF,
      formatKbValue,
    };
  },
});
</script>

<style>
.v-data-table > .v-data-table__wrapper > table > tbody > tr > td {
  padding: 0px 6px;
}
</style>
