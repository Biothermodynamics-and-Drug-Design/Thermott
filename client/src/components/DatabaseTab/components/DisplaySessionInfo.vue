<template>
  <div>
    <div class="d-flex flex-wrap">
      <table class="text-subtitle-1 font-weight-medium text-center ma-1">
        <tr class="data">
          <td>Author</td>
          <td>{{ sessionData.sessionInfo.author }}</td>
        </tr>
        <tr class="spacer" />
        <tr class="data">
          <td>Session name</td>
          <td>{{ sessionData.sessionInfo.name }}</td>
        </tr>
        <tr class="spacer" />
        <tr class="data">
          <td>Analysis date</td>
          <td>{{ sessionData.sessionInfo.sessionDate }}</td>
        </tr>
        <tr class="spacer" />
        <tr class="data">
          <td>Experiment count</td>
          <td>{{ sessionData.bindingExperiments.length }}</td>
        </tr>
      </table>

      <table class="text-subtitle-1 font-weight-medium text-center ma-1">
        <tr class="data">
          <td>Proteins</td>
          <td>{{ uniqueProteins.join("; ") }}</td>
        </tr>
        <tr class="spacer" />
        <tr class="data">
          <td>Ligands</td>
          <td>{{ uniqueLigands.join("; ") }}</td>
        </tr>
      </table>
    </div>
    <table class="text-subtitle-1 font-weight-medium text-center ma-1 mt-3">
      <template v-if="sessionFileName">
        <tr class="data">
          <td>Analysis file</td>
          <td>{{ sessionFileName }}</td>
        </tr>
        <tr class="spacer" />
      </template>
      <tr class="data">
        <td>Raw files</td>
        <td>
          <v-list>
            <v-list-item v-for="(item, index) in sessionData.originFiles" :key="index" style="min-height: 0">
              <v-list-item-title class="d-flex align-center">
                <div class="accent--text text--darken-2 font-weight-bold mr-2">{{ index + 1 }}</div>
                <div>{{ item.name }}</div>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { AppData } from "@/models";
import { computed, defineComponent, PropType } from "@vue/composition-api";

export default defineComponent({
  props: { sessionData: Object as PropType<AppData>, sessionFileName: String },
  setup(props) {
    const uniqueProteins = computed(() => {
      if (props.sessionData && props.sessionData.bindingExperiments) {
        return Array.from(new Set(props.sessionData.bindingExperiments.map((x) => x.protein.trim())));
      } else {
        return [];
      }
    });
    const uniqueLigands = computed(() => {
      if (props.sessionData && props.sessionData.bindingExperiments) {
        return Array.from(new Set(props.sessionData.bindingExperiments.map((x) => x.ligand.trim())));
      } else {
        return [];
      }
    });

    return { uniqueProteins, uniqueLigands };
  },
});
</script>

<style scoped>
table {
  border-collapse: collapse;
}

tr.data > :nth-child(odd) {
  background: var(--v-secondary-lighten5);
  border-radius: 0 9999px 9999px 0;
  color: black;
  padding: 0.05em 1em;
}

tr.data > :nth-child(even) {
  padding: 0.05em 1em;
  color: black;
}

tr.spacer {
  height: 0.5em;
}

tr.data {
  border-bottom: 0.2em solid var(--v-secondary-lighten5);
}
</style>
