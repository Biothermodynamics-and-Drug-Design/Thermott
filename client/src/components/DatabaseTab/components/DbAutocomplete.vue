<template>
  <v-autocomplete
    v-model="experimentRequest[type]"
    :items="dbDataItems"
    :label="label"
    outlined
    return-object
    dense
    item-text="label"
    :no-data-text="loading ? 'Loading...' : 'No data, input to search'"
    item-value="id"
    :rules="rulesObject"
    class="grey--text text--darken-1 mr-2"
    :search-input.sync="searchText"
    :loading="loading"
    :filter="searchFilter"
  >
    <template #item="{ item }">{{ displayFormat(item) }}</template>
    <template #selection="{ item }">{{ displayFormat(item) }}</template>
    <template v-if="!hideApplyAll" #append-outer>
      <ApplyAllButton :binding-experiment="bindingExperiment" :binding-experiments="bindingExperiments" :type="`PLBDAnnotation.${type}`" />
    </template>
  </v-autocomplete>
</template>

<script lang="ts">
import { validationRules } from "@/utils/validationRules";
import { defineComponent, PropType, ref, computed, watch } from "@vue/composition-api";
import * as Models from "../database";
import { DownloadDbTable } from "../databaseFunc";
import ApplyAllButton from "../ApplyAllButton.vue";
import { BindingExperiment } from "@/models";

export default defineComponent({
  components: { ApplyAllButton },
  props: {
    bindingExperiment: Object as PropType<BindingExperiment>,
    bindingExperiments: Array as PropType<BindingExperiment[]>,
    dbData: Object as PropType<Models.DBdata>,
    disabled: Boolean,
    label: String,
    apiLink: String,
    auth: Object as PropType<Models.Auth>,
    type: String as PropType<Models.DbType>,
    hideApplyAll: Boolean,
  },
  emits: ["update:bindingExperiment"],
  setup(props, { emit }) {
    const loading = ref(false);
    const rulesObject = [validationRules.exists];
    const searchText = ref("");
    const timeoutTime = 2_000;
    let timeout: ReturnType<typeof setTimeout> = null;
    const experimentRequest = computed({
      get: () => props.bindingExperiment.PLBDAnnotation,
      set: (value: any) => {
        props.bindingExperiment.PLBDAnnotation = value;
        emit("update:bindingExperiment");
      },
    });

    const dbDataItems = computed(() => {
      if (props.type == "compound_batch") {
        if (!experimentRequest.value.compound) return [];
        return props.dbData.compound_batch.filter((x) => x.compound_id == experimentRequest.value.compound.id);
      } else if (props.type == "protein_batch") {
        if (!experimentRequest.value.protein) return [];
        return props.dbData.protein_batch.filter((x) => x.protein_id == experimentRequest.value.protein.id);
      } else return props.dbData[props.type] as any[];
    });

    const display = {
      protein_batch: (proteinBatch: Models.ProteinBatch) =>
        proteinBatch != null
          ? `(${proteinBatch.id}) ${proteinBatch.label} |  ${proteinBatch.plasmid} | ${proteinBatch.notes?.slice(0, 25)}...`
          : "-",
      protein: (protein: Models.Protein) => (protein != null ? `(${protein.id}) ${protein.label} |  ${protein.name}` : "-"),
      compound_batch: (compoundBatch: Models.Compound) =>
        compoundBatch != null ? `(${compoundBatch.id}) ${compoundBatch.label} | ${compoundBatch.date}` : "-",
      compound: (compound: Models.Compound) =>
        compound != null
          ? `(${compound.id}) ${compound.label} | ${compound.name} ${compound.generic_name ? "(" + compound.generic_name + ")" : ""}`
          : "-",
      author: (author: Models.Author) => (author != null ? `(${author.id}) ${author.surname} ${author.name}` : "-"),
      device: (device: Models.Device) => (device != null ? `(${device.id}) ${device.manufacturer} ${device.model}` : "-"),
      buffer: (buffer: Models.Buffer) => (buffer != null ? `(${buffer.id}) ${buffer.label} | ${buffer.system}, ${buffer.salt}` : "-"),
    };

    const filter = {
      author: ["name", "middle_names", "birth_name", "surname"],
      device: ["manufacturer", "model"],
      protein: ["id", "label", "name"],
      compound: ["id", "name", "label", "generic_name"],
      compound_batch: ["id", "label"],
      protein_batch: ["id", "label"],
      buffer: ["label", "system", "salt"],
    };

    const displayFormat = (item: Models.DatabaseItem) => {
      if (!item) return "";
      else if (display[props.type]) {
        return display[props.type](item as any);
      } else return "";
    };

    const searchFilter = (item: Models.DatabaseItem, queryText: string) => displayFormat(item).includes(queryText);

    watch(
      () => searchText.value,
      (text) => {
        const isBatch = props.type == "protein_batch" || props.type == "compound_batch";

        clearTimeout(timeout);
        if (text == null || text.trim().length == 0) return;
        loading.value = false;
        const selectedFilter = (filter as any)[props.type] as unknown as string[];
        console.log();
        timeout = setTimeout(async () => {
          const searchParams = {
            format: "csv",
            rows: 20,
            filter: `(${selectedFilter.map((x) => `(${x} CONTAINS "${encodeURIComponent(text)}")`).join(" OR ")})`,
          };

          loading.value = true;
          const results = (await DownloadDbTable(props.apiLink, props.type, props.auth, searchParams)) as Models.DatabaseItem[];
          loading.value = false;

          for (const item of results) {
            const index = dbDataItems.value.findIndex((x) => x.id == item.id);
            if (index > -1) dbDataItems.value[index] = item as any;
            else dbDataItems.value.push(item as any);
          }
        }, timeoutTime + (isBatch ? 2_000 : 0));
      }
    );

    return { loading, rulesObject, searchText, experimentRequest, displayFormat, dbDataItems, searchFilter };
  },
});
</script>
