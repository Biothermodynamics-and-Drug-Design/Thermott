<template>
  <v-dialog v-model="dialog" max-width="700px">
    <template #activator="{ on }">
      <v-btn depressed outlined color="blue-grey darken-1" class="my-1" small v-on="on">Validation</v-btn>
    </template>

    <v-card>
      <v-card-title class="grey lighten-2 text-subtitle-1 py-1">
        <span>Validation</span>
        <v-spacer />
        <v-icon @click="dialog = false">mdi-close</v-icon>
      </v-card-title>
      <v-card-text class="pa-2">
        <v-container>

          <template v-if="validated">

            <v-alert v-if="duplicates.proteinCompoundDuplicates.length == 0 && duplicates.experimentTsaUuidDuplicates.length == 0" text outlined type="success">
              <v-icon>mdi-check</v-icon> No validation errors
            </v-alert>
            <v-alert v-else text outlined type="error">
              Validation errors
            </v-alert>
          </template>
          <template v-else> 
            Here you can validate your experiment for duplicates <br />(Protein/Compound combinations, already submitted experiments)
          </template>

          <v-sheet v-if="duplicates.proteinCompoundDuplicates.length > 0" outlined rounded class="pa-2 ma-1">
            <div class="text-subtitle-1 font-weight-medium">Duplicate protein/compound experiments</div>
            <div class="d-flex flex-row flex-wrap">
              <ViewDatabaseItemBttn
v-for="(item, index) in duplicates.proteinCompoundDuplicates" :key="index"
                :database-link="submissionModel.databaseInfo.dbLink" :item="item" :text="proteinCompoundDupLabel(item)" class="mx-1" />
            </div>
          </v-sheet>

          <v-sheet v-if="duplicates.experimentTsaUuidDuplicates.length > 0" outlined rounded class="pa-2 ma-1">
            <div class="text-subtitle-1 font-weight-medium">Experiment is already uploaded (duplicate UUID)</div>
            <div class="d-flex flex-row flex-wrap">
              <ViewDatabaseItemBttn
v-for="(item, index) in duplicates.experimentTsaUuidDuplicates" :key="index"
                :database-link="submissionModel.databaseInfo.dbLink" :item="item" :text="experimentTsaLabel(item)" class="mx-1" />
            </div>
          </v-sheet>
        </v-container>
      </v-card-text>
      <v-divider />
      <v-card-actions class="pt-2">
        <v-btn color="primary" small depressed :loading="loading" :disabled="loading" @click="validate">Validate</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, ref } from "@vue/composition-api";
import { DatabasePageModel, ExperimentTSA, ExperimentTSA_ProteinCompoundView } from "../database";
import { findProteinCompoundDuplicates, findExperimentTsaUuidDuplicates } from "./validationFunc";
import ViewDatabaseItemBttn from "../ViewDatabaseItemBttn.vue";

export default defineComponent({
  components: { ViewDatabaseItemBttn },
  props: { submissionModel: Object as PropType<DatabasePageModel> },
  setup(props) {
    const dialog = ref(false);
    const loading = ref(false);

    const validated = ref(false);

    const duplicates = reactive({
      proteinCompoundDuplicates: [] as ExperimentTSA_ProteinCompoundView[],
      experimentTsaUuidDuplicates: [] as ExperimentTSA[],
    });

    const validate = async () => {
      loading.value = true;
      const promises: Promise<void>[] = [];
      const proteinCompoundDupPromise = findProteinCompoundDuplicates(
        props.submissionModel.session.bindingExperiments,
        props.submissionModel.databaseInfo.apiLink,
        props.submissionModel.auth
      ).then((result) => {
        duplicates.proteinCompoundDuplicates = [];
        duplicates.proteinCompoundDuplicates.push(...result);
      });
      promises.push(proteinCompoundDupPromise);

      const experimentTSAUuidPromise = findExperimentTsaUuidDuplicates(
        props.submissionModel.session.bindingExperiments,
        props.submissionModel.databaseInfo.apiLink,
        props.submissionModel.auth
      ).then((result) => {
        duplicates.experimentTsaUuidDuplicates = [];
        duplicates.experimentTsaUuidDuplicates.push(...result);
      });
      promises.push(experimentTSAUuidPromise);
      await Promise.all(promises);
      loading.value = false;
      validated.value = true;
    };

    const proteinCompoundDupLabel = (exp: ExperimentTSA_ProteinCompoundView) => `${exp.id} ${exp.protein_label}/${exp.compound_name}`;
    const experimentTsaLabel = (exp: ExperimentTSA) => `${exp.id} ${exp.label}`;

    return { dialog, loading, validate, proteinCompoundDupLabel, experimentTsaLabel, validated, duplicates };
  },
});
</script>
