<template>
  <v-container>
    <v-alert
      v-if="submissionModel.submissionResponse"
      :color="submissionModel.submissionResponse.status === 200 ? 'success' : 'error'"
      text
      outlined
    >
      <div class="d-flex flex-wrap">
        <div v-if="submissionModel.submissionResponse.status == 200" class="mx-4">Experiments submitted successfully</div>
        <div v-else class="mx-4">Failed to submit experiments</div>
        <div class="mx-4">(Status Code: {{ submissionModel.submissionResponse.status }})</div>
      </div>
    </v-alert>

    <!-- <v-alert v-if="submissionModel.submissionResult && submissionModel.submissionResult.data" color="grey lighten-1" outlined>
      
      <v-chip v-for="(item, index) in submissionModel.submissionResult.data" :key="index" :href="experimentHREF(item)" target="_blank" class="ma-1">
        Experiment <span class="ml-2">{{ index + 1 }}</span>
        <v-icon>mdi-link</v-icon>
      </v-chip>
    </v-alert> -->

    <v-sheet
      v-if="submissionModel.submissionResult && submissionModel.submissionResult.data"
      color="grey lighten-1"
      class="pa-0"
      outlined
      elevation-1
    >
      <v-data-table :items="submissionModel.submissionResult.data" :headers="headers" disable-sort style="border-radius: 0px">
        <template #[`header.kb_kd`]="{}">
          <div><i>K</i><sub>b obs</sub> / <i>K</i><sub>d obs</sub></div>
        </template>
        <template #[`item.kb_kd`]="{ item }">
          <span v-html="`${formatKbValue(item.attributes.kb_obs, 'Kb', true)}/${formatKbValue(item.attributes.kb_obs, 'Kd', true)}`" />
        </template>
        <template #[`item.idlabel`]="{ item }">
          <ViewDatabaseItemBttn
            :database-link="submissionModel.databaseInfo.dbLink"
            :item="item"
            :text="`${item.id}/${item.attributes.label}`"
            class="mx-1"
          />
        </template>
        <template #[`item.author`]="{ item }">
          <ViewDatabaseItemBttn
            :database-link="submissionModel.databaseInfo.dbLink"
            :item="item.attributes.author_id"
            :text="`${item.attributes.author_id.attributes.name} ${item.attributes.author_id.attributes.surname}`"
            class="mx-1"
          />
        </template>
        <template #[`item.compound`]="{ item }">
          <ViewDatabaseItemBttn
            :database-link="submissionModel.databaseInfo.dbLink"
            :item="item.attributes.compound_batch_id"
            :text="getCompoundTextFromBatch(item.attributes.compound_batch_id.attributes.compound_id)"
            class="mx-1"
          />
        </template>
        <template #[`item.protein`]="{ item }">
          <ViewDatabaseItemBttn
            :database-link="submissionModel.databaseInfo.dbLink"
            :item="item.attributes.protein_batch_id"
            :text="getProteinTextFromBatch(item.attributes.protein_batch_id.attributes.protein_id)"
            class="mx-1"
          />
        </template>
      </v-data-table>
    </v-sheet>
    <div v-if="submissionModel.submissionResult && submissionModel.submissionResult.errors">
      <v-alert v-for="(error, index) in submissionModel.submissionResult.errors" :key="index" text>{{ error.detail }}</v-alert>
    </div>
    <v-divider class="my-4" />
    <div class="d-flex justify-center">
      <v-btn depressed small color="primary" @click="reset"> Submit more experiments </v-btn>
    </div>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, PropType } from "@vue/composition-api";
import { confirmDialog } from "../Generic/confirmdialog";
import { DatabasePageModel } from "./database";
import { generateExperimentLabel } from "./databaseFunc";
import { formatKb } from "@/utils/utils";
import ViewDatabaseItemBttn from "./ViewDatabaseItemBttn.vue";

export default defineComponent({
  components: { ViewDatabaseItemBttn },
  props: { submissionModel: Object as PropType<DatabasePageModel> },
  setup(props) {
    const experimentHREF = (item: any) => `${props.submissionModel.databaseInfo.dbLink}/experiment_tsa/${item.id}`;

    const headers = [
      { value: "idlabel", text: "ID/label", align: "center" },
      { value: "protein", text: "Protein", align: "center" },
      { value: "compound", text: "Compound", align: "center" },
      { value: "kb_kd", text: "Kb/Kd", align: "center" },
      // { value: "author", text: "Author" },
    ];
    console.log(props.submissionModel.submissionResult);

    const reset = async () => {
      const res = await confirmDialog({
        text: "Are you sure you want to submit more experiments?",
      });
      if (!res) return;

      const experimentCount = props.submissionModel.session.bindingExperiments.length;
      props.submissionModel.initialExperimentLabel = generateExperimentLabel(props.submissionModel.initialExperimentLabel, experimentCount);
      props.submissionModel.session = null;
      props.submissionModel.analysisFile = null;
      props.submissionModel.step = 2;
      props.submissionModel.files.splice(0, props.submissionModel.files.length);
      props.submissionModel.submissionResult = null;
      props.submissionModel.submissionResponse = null;
    };
    const formatKbValue = (value: number, format: "Kb" | "Kd", unit: boolean) => {
      console.log(props.submissionModel.submissionResult);
      return formatKb(value, 2, format, unit);
    };

    const getProteinTextFromBatch = (protein_id: number) => {
      const protein = props.submissionModel.dbData.protein.find((x) => x.id == protein_id);
      if (protein == null) return "";
      return `${protein.name}`;
    };

    const getCompoundTextFromBatch = (compound_id: number) => {
      const compound = props.submissionModel.dbData.compound.find((x) => x.id == compound_id);
      if (compound == null) return "";
      return `${compound.name}`;
    };

    return { experimentHREF, reset, headers, formatKbValue, getProteinTextFromBatch, getCompoundTextFromBatch };
  },
});
</script>
