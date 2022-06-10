<template>
  <v-sheet outlined>
    <v-data-table :items="bindingExperiments" :headers="headers" disable-sort>
      <template #[`item.PLBDAnnotation.compound_batch`]="{ item }">
        <ViewDatabaseItemBttn
          :database-link="`${databaseLink}`"
          :text="compound_batch_display_name(item.PLBDAnnotation)"
          :item="item.PLBDAnnotation.compound_batch"
        />
      </template>
      <template #[`item.PLBDAnnotation.protein_batch`]="{ item }">
        <ViewDatabaseItemBttn
          :database-link="`${databaseLink}`"
          :text="protein_batch_display_name(item.PLBDAnnotation)"
          :item="item.PLBDAnnotation.protein_batch"
        />
      </template>
      <template #[`item.PLBDAnnotation.buffer`]="{ item }">
        <ViewDatabaseItemBttn
          :database-link="`${databaseLink}`"
          :text="buffer_display_name(item.PLBDAnnotation)"
          :item="item.PLBDAnnotation.buffer"
        />
      </template>
      <template #[`item.params.Kb`]="{ item }">
        <span
          style="white-space: nowrap"
          v-html="formatKbValue(item.params.Kb)"
        />
      </template>

      <template #[`header.params.Kb`]="{}">
        <span><DisplayParam parameter="Kb" class="justify-center" /></span>
      </template>
    </v-data-table>
  </v-sheet>
</template>

<script lang="ts">
import { BindingExperiment, BindingModelParams } from "@/models";
import { defineComponent, PropType } from "@vue/composition-api";
import { ExperimentRequest } from "@/components/DatabaseTab/database";
import { formatKb } from "@/utils/utils";
import DisplayParam from "@/components/Generic/DisplayParamater.vue";
import ViewDatabaseItemBttn from "../../ViewDatabaseItemBttn.vue";

export default defineComponent({
  components: { DisplayParam, ViewDatabaseItemBttn },
  props: {
    bindingExperiments: Array as PropType<BindingExperiment[]>,
    databaseLink: String,
  },
  setup(props) {
    type header = {
      value:
        | keyof BindingExperiment
        | `${keyof BindingExperiment}.${keyof ExperimentRequest}`
        | `${keyof BindingExperiment}.${keyof BindingModelParams}`;
      text: string;
      align?: string;
    };
    const headers: header[] = [
      { text: "#", value: "id", align: "center" },
      {
        text: "Protein",
        value: "PLBDAnnotation.protein_batch",
        align: "start",
      },
      {
        text: "Compound",
        value: "PLBDAnnotation.compound_batch",
        align: "start",
      },
      { text: "Buffer", value: "PLBDAnnotation.buffer", align: "start" },
      { text: "pH", value: "PLBDAnnotation.ph", align: "center" },
      { text: "T (°C)", value: "params.T0", align: "center" },
      { text: "Reliab.", value: "PLBDAnnotation.reliability", align: "center" },
      {
        text: "DMSO (%)",
        value: "PLBDAnnotation.dmso_concentration",
        align: "center",
      },
      { text: "Kb", value: "params.Kb", align: "center" },
      // { text: "Duplicates", value: "duplicates" },
    ];

    const protein_batch_display_name = (
      experimentRequest: ExperimentRequest
    ) => {
      if (experimentRequest.protein_batch !== null) {
        const protein = experimentRequest.protein;
        const protein_batch = experimentRequest.protein_batch;
        //console.log(protein.id, protein_batch.id);
        //const protein = submissionModel.value.dbData.protein.find((x) => x.id == protein_batch.protein_id);
        return [
          `[${protein.id}] ${protein.name}`,
          `[${protein_batch.id}] ${protein_batch.label} ${protein_batch.plasmid}`,
        ].join("<br/>");
      } else return "-";
    };

    const compound_batch_display_name = (
      experimentRequest: ExperimentRequest
    ) => {
      if (experimentRequest.compound_batch !== null) {
        const compound = experimentRequest.compound;
        const compound_batch = experimentRequest.compound_batch;
        //const compound = submissionModel.value.dbData.compound.find((x) => x.id == compound_batch.compound_id);
        return [
          `[${compound.id}] ${compound?.name}`,
          `[${compound_batch.id}] ${compound_batch?.label}`,
        ].join("<br/>");
      } else return "-";
    };

    const buffer_display_name = (experimentRequest: ExperimentRequest) => {
      if (experimentRequest.buffer === null) return "-";
      const buffer = experimentRequest.buffer;
      return [
        `[${buffer.id}] ${buffer.label}`,
        `${buffer.system}, ${buffer.salt}`,
      ].join("<br/>");
    };

    const formatKbValue = (value: number) => formatKb(value, 2, "Kb", false);

    return {
      headers,
      protein_batch_display_name,
      compound_batch_display_name,
      buffer_display_name,
      formatKbValue,
      props,
    };
  },
});
</script>
