<template>
  <v-container>
    <div
      v-if="bindingExperiment && bindingExperiment.PLBDAnnotation"
      class="d-flex flex-column align-self-center justify-self-center"
    >
      <v-form ref="formElement" v-model="form">
        <div class="d-flex flex-row flex-wrap align-center">
          <div class="d-flex flex-row flex-wrap displayItem mt-2 align-center">
            <div>Experiment Name</div>
            <div>{{ bindingExperiment.name }}</div>
            <Param parameter="Kb" />
            <div v-html="formatKb(bindingExperiment.params.Kb, 2, 'Kb')" />
            <Param parameter="Kd" />
            <div v-html="formatKb(bindingExperiment.params.Kb, 2, 'Kd')" />
          </div>

          <div class="d-flex flex-row flex-wrap displayItem mt-2 align-center">
            <div>Protein</div>
            <div>
              {{ bindingExperiment.protein }}&nbsp;({{
                formatConc(bindingExperiment.params.Pt, "micromolar", true)
              }})
            </div>
            <div>Ligand</div>
            <div>{{ bindingExperiment.ligand }}</div>
            <div>
              <Param parameter="T0" />
            </div>
            <div>{{ bindingExperiment.params.T0 }}°C</div>
          </div>
          <div class="d-flex flex-row flex-wrap displayItem mt-2 align-center">
            <div>File</div>
            <div
              v-for="(file, index) in GetOriginFiles(
                session,
                bindingExperiment
              )"
              :key="index"
            >
              {{ file.name }}
            </div>
          </div>
          <ReportChartPlotly
            button="texticon"
            :binding-experiments="[bindingExperiment]"
            :experiment-wells="experimentWells"
          />

          <div class="d-flex flex-row flex-wrap displayItem mt-2 align-center">
            <div>Max. cmp. conc.</div>
            <div>
              {{ bindingExperiment.PLBDAnnotation.compound_max_concentration
              }}<Param parameter="uM" class="ml-2" />
            </div>
            <div>Steps</div>
            <div>{{ bindingExperiment.PLBDAnnotation.step_count }}</div>
            <div>Dilution factor</div>
            <div>{{ bindingExperiment.PLBDAnnotation.dilution_factor }}</div>
          </div>
        </div>

        <v-divider class="my-5" />

        <v-text-field
          v-if="!hideFields.includes('label')"
          v-model="experimentRequest.label"
          outlined
          label="Label"
          dense
          class="grey--text text--darken-1"
        />
        <div class="d-flex flex-row my-1">
          <DbAutocomplete
            :binding-experiment="bindingExperiment"
            :binding-experiments="session.bindingExperiments"
            :db-data="dbData"
            label="Protein"
            hide-apply-all
            :api-link="apiLink"
            :auth="auth"
            type="protein"
            @update:bindingExperiment="experimentRequest.protein_batch = null"
          />

          <DbAutocomplete
            :binding-experiment="bindingExperiment"
            :binding-experiments="session.bindingExperiments"
            :db-data="dbData"
            label="Batch"
            :api-link="apiLink"
            :auth="auth"
            type="protein_batch"
            :disabled="!experimentRequest.protein"
          />
        </div>

        <div class="d-flex flex-row my-1">
          <DbAutocomplete
            :binding-experiment="bindingExperiment"
            :binding-experiments="session.bindingExperiments"
            :db-data="dbData"
            label="Compound"
            hide-apply-all
            :api-link="apiLink"
            :auth="auth"
            type="compound"
            @update:bindingExperiment="experimentRequest.compound_batch = null"
          />

          <DbAutocomplete
            :binding-experiment="bindingExperiment"
            :binding-experiments="session.bindingExperiments"
            :db-data="dbData"
            label="Batch"
            :api-link="apiLink"
            :auth="auth"
            type="compound_batch"
            :disabled="!experimentRequest.protein"
          />
        </div>

        <div class="d-flex justify-space-between my-1 mt-2">
          <DbAutocomplete
            :binding-experiment="bindingExperiment"
            :binding-experiments="session.bindingExperiments"
            :db-data="dbData"
            label="Buffer"
            :api-link="apiLink"
            :auth="auth"
            type="buffer"
          />
          <v-text-field
            v-model.number="experimentRequest.ph"
            label="pH"
            outlined
            dense
            class="ml-4"
            :rules="rules.pH"
            style="max-width: 200px"
          >
            <template #append-outer>
              <ApplyAllButton
                type="PLBDAnnotation.ph"
                :binding-experiment="bindingExperiment"
                :binding-experiments="session.bindingExperiments"
              />
            </template>
          </v-text-field>

          <v-text-field
            v-model.number="experimentRequest.buffer_concentration"
            label="Buffer conc. (mM)"
            outlined
            dense
            class="ml-4"
            :rules="rules.bufferConcentration"
            style="max-width: 200px"
          >
            <template #append-outer>
              <ApplyAllButton
                type="PLBDAnnotation.buffer_concentration"
                :binding-experiment="bindingExperiment"
                :binding-experiments="session.bindingExperiments"
              />
            </template>
          </v-text-field>
        </div>

        <div class="d-flex justify-space-between my-1 mt-2">
          <v-text-field
            v-model.number="experimentRequest.dmso_concentration"
            outlined
            label="DMSO (%)"
            suffix="%"
            dense
            class="mr-4"
            :rules="rules.dmso"
          >
            <template #append-outer>
              <ApplyAllButton
                type="PLBDAnnotation.dmso_concentration"
                :binding-experiment="bindingExperiment"
                :binding-experiments="session.bindingExperiments"
              />
            </template>
          </v-text-field>
          <!-- <v-text-field :value="format_Kb" label="Kb_obs" disabled class="mx-1" /> -->
          <v-text-field
            v-if="!hideFields.includes('date')"
            v-model.trim="experimentRequest.date"
            label="exp. date"
            outlined
            dense
            class="mr-4"
            hint="YYYY-MM-DD"
            :rules="rules.date"
          >
            <template #append-outer>
              <ApplyAllButton
                type="PLBDAnnotation.date"
                :binding-experiment="bindingExperiment"
                :binding-experiments="session.bindingExperiments"
              />
            </template>
          </v-text-field>
          <v-text-field
            v-if="!hideFields.includes('datestamp')"
            v-model.trim="experimentRequest.datestamp"
            label="DB date"
            outlined
            dense
            class="mr-4"
            hint="YYYY-MM-DD"
            :rules="rules.date"
          >
            <template #append-outer>
              <ApplyAllButton
                type="PLBDAnnotation.datestamp"
                :binding-experiment="bindingExperiment"
                :binding-experiments="session.bindingExperiments"
              />
            </template>
          </v-text-field>
          <v-text-field
            v-model.number="experimentRequest.reliability"
            outlined
            dense
            label="reliability"
            :rules="rules.reliability"
          >
            <template #append-outer>
              <ApplyAllButton
                type="PLBDAnnotation.reliability"
                :binding-experiment="bindingExperiment"
                :binding-experiments="session.bindingExperiments"
              />
            </template>
          </v-text-field>
        </div>
        <div class="d-flex justify-space-between my-1 mt-2">
          <DbAutocomplete
            :binding-experiment="bindingExperiment"
            :binding-experiments="session.bindingExperiments"
            :db-data="dbData"
            label="Device"
            :api-link="apiLink"
            :auth="auth"
            type="device"
          />
          <DbAutocomplete
            :binding-experiment="bindingExperiment"
            :binding-experiments="session.bindingExperiments"
            :db-data="dbData"
            label="Author"
            :api-link="apiLink"
            :auth="auth"
            type="author"
          />
        </div>
        <v-text-field
          v-model.trim="bindingExperiment.comment"
          outlined
          dense
          label="Private notes"
        >
          <template #append-outer>
            <ApplyAllButton
              type="comment"
              :binding-experiment="bindingExperiment"
              :binding-experiments="session.bindingExperiments"
            />
          </template>
        </v-text-field>
      </v-form>
    </div>
    <div v-else>No selection</div>
  </v-container>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  reactive,
  ref,
  watch,
} from "@vue/composition-api";
import { validationRules } from "@/utils/validationRules";
import {
  Author,
  Device,
  Buffer,
  DBdata,
  ProteinBatch,
  CompoundBatch,
  Protein,
  Compound,
  Auth,
} from "./database";
import ApplyAllButton from "./ApplyAllButton.vue";
import { DownloadDbTable, GetOriginFiles } from "./databaseFunc";
import Param from "@/components/Generic/DisplayParamater.vue";
import { formatKb, formatConc } from "@/utils/utils";
import { AppData, BindingExperiment } from "@/models";
import DbAutocomplete from "./components/DbAutocomplete.vue";
import ReportChartPlotly from "@/components/Generic/ReportChartPlotly.vue";

export default defineComponent({
  components: { ApplyAllButton, Param, DbAutocomplete, ReportChartPlotly },
  props: {
    bindingExperiment: Object as PropType<BindingExperiment>,
    session: Object as PropType<AppData>,
    dbData: Object as PropType<DBdata>,
    auth: Object as PropType<Auth>,
    apiLink: String,
    hideFields: Array as PropType<string[]>,
  },
  setup(props) {
    const form = ref(false);
    const formElement = ref(null as HTMLFormElement);

    const experimentRequest = computed(
      () => props.bindingExperiment.PLBDAnnotation
    );
    const experimentRequests = computed(() =>
      props.session.bindingExperiments.map((x) => x.PLBDAnnotation)
    );

    const search = reactive({
      proteinBatch: { text: "", timeout: null, loading: false },
      compoundBatch: { text: "", timeout: null, loading: false },
    });

    const resetValidation = () => {
      if (formElement.value == null) return;
      formElement.value.resetValidation();
    };

    watch(
      () => props.session?.bindingExperiments,
      () => {
        resetValidation();
      }
    );

    watch(
      () => props.bindingExperiment?.PLBDAnnotation?.compound,
      async (compound) => {
        resetValidation();
        if (compound == null) return;

        const exists = props.dbData.compound_batch.some(
          (x) => x.compound_id == compound.id
        );
        if (exists) return;
        else {
          search.compoundBatch.loading = true;
          const results = (await DownloadDbTable(
            props.apiLink,
            "compound_batch",
            props.auth,
            {
              format: "csv",
              rows: 99999,
              filter: `(compound_id = "${compound.id}")`,
            }
          )) as CompoundBatch[];
          search.compoundBatch.loading = false;
          if (results.length > 0 && results[0].id) {
            props.dbData.compound_batch.push(...results);
          }
        }
      }
    );

    watch(
      () => props.bindingExperiment?.PLBDAnnotation?.protein,
      async (protein) => {
        search.proteinBatch.loading = false;
        resetValidation();

        if (protein == null) return;
        const exists = props.dbData.protein_batch.some(
          (x) => x.protein_id == protein.id
        );
        if (exists) return;
        else {
          search.proteinBatch.loading = true;
          const results = (await DownloadDbTable(
            props.apiLink,
            "protein_batch",
            props.auth,
            {
              filter: `(protein_id = "${protein.id}")`,
            }
          )) as ProteinBatch[];
          console.log("protein_batch", results);
          search.proteinBatch.loading = false;
          if (results.length > 0 && results[0].id) {
            props.dbData.protein_batch.push(...results);
          }
        }
      }
    );

    const rules = {
      label: [validationRules.exists],
      dmso: [validationRules.exists, validationRules.between(0, 100, "[]")],
      reliability: [
        validationRules.exists,
        validationRules.between(0, 100, "[]"),
      ],
      object: [validationRules.exists],
      date: [validationRules.exists, validationRules.validISODateYYYYMMDD],
      pH: [validationRules.exists, validationRules.between(0, 14, "[]")],
      bufferConcentration: [
        validationRules.exists,
        validationRules.positiveOrZeroNumber,
      ],
    };

    const display = {
      proteinBatch: (proteinBatch: ProteinBatch) =>
        `(${proteinBatch.id}) ${proteinBatch.label} |  ${proteinBatch.plasmid}`,
      protein: (protein: Protein) =>
        protein != null
          ? `(${protein.id}) ${protein.label} |  ${protein.name}`
          : "-",
      compoundBatch: (compoundBatch: CompoundBatch) =>
        compoundBatch != null
          ? `(${compoundBatch.id}) ${compoundBatch.label} | ${compoundBatch.date}`
          : "-",
      compound: (compound: Compound) =>
        compound != null
          ? `(${compound.id}) ${compound.label} | ${compound.name} ${
              compound.generic_name ? "(" + compound.generic_name + ")" : ""
            }`
          : "-",
      author: (author: Author) =>
        author != null
          ? `(${author.id}) ${author.surname} ${author.name}`
          : "-",
      device: (device: Device) =>
        device != null
          ? `(${device.id}) ${device.manufacturer} ${device.model}`
          : "-",
      buffer: (buffer: Buffer) =>
        buffer != null
          ? `(${buffer.id}) ${buffer.label} | ${buffer.system}, ${buffer.salt}`
          : "-",
    };

    const experimentKb = computed(() => {
      const kb = props.bindingExperiment.params.Kb;
      if (typeof kb == "number") return kb.toExponential(1);
      else return "-";
    });

    const experimentWells = computed(() => {
      // console.log(props.session);
      // console.log(props.session.experimentWells.filter(x => props.bindingExperiment.expPointIndexes.includes(x.id)))
      return props.session.experimentWells.filter((x) =>
        props.bindingExperiment.expPointIndexes.includes(x.id)
      );
    });

    return {
      form,
      display,
      experimentKb,
      experimentRequest,
      experimentRequests,
      formElement,
      rules,
      formatKb,
      formatConc,
      search,
      experimentWells,
      resetValidation,
      GetOriginFiles,
    };
  },
});
</script>

<style>
.displayItem > :nth-child(odd) {
  padding-right: 1em;
  padding-left: 5px;
  background: var(--v-secondary-lighten5);
  border-radius: 0 9999px 9999px 0;
  border-bottom: 0.2em solid var(--v-secondary-lighten5);
}

.displayItem > :nth-child(even) {
  padding: 0 1em;
  margin-right: 2em;
  border-bottom: 0.2em solid var(--v-secondary-lighten5);
}
</style>
