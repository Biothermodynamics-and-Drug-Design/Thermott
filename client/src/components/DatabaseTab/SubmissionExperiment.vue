<template>
  <v-container fluid class="pt-0">
    <div class="d-flex">
      <v-col xs="6" sm="5" md="3" lg="3" xl="3">
        <binding-list
          :binding-experiment="selectedBindingExperiment"
          :binding-experiments="session.bindingExperiments"
          :session="session"
          @update:bindingExperiment="selectedBindingExperiment = $event"
        />
      </v-col>
      <v-col xs="6" sm="7" md="9" lg="9" xl="9">
        <request-view
          :binding-experiment="selectedBindingExperiment"
          :api-link="apiLink"
          :auth="auth"
          :db-data="dbData"
          :session="session"
          :hide-fields="hideFields"
        />
      </v-col>
    </div>
    <div class="d-flex flex-row justify-end">
      <v-btn small depressed color="primary" @click="submissionModel.step = 4">Next <v-icon>mdi-chevron-right</v-icon></v-btn>
    </div>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from "@vue/composition-api";
import { Auth, DatabasePageModel, DBdata, ExperimentRequest } from "./database";
import RequestView from "./RequestView.vue";
import BindingList from "./BindingList.vue";
import { AppData } from "@/models";

export default defineComponent({
  components: { RequestView, BindingList },

  props: {
    session: Object as PropType<AppData>,
    apiLink: String,
    auth: Object as PropType<Auth>,
    dbData: Object as PropType<DBdata>,
    hideFields: { type: Array as PropType<string[]>, default: () => [] as string[] },
    submissionModel: Object as PropType<DatabasePageModel>,
  },

  setup(props) {
    const selectedBindingExperiment = ref(null as ExperimentRequest);

    watch(
      () => props.session.bindingExperiments,
      (newValue) => {
        if (newValue.length == 0) selectedBindingExperiment.value = null;
      }
    );

    return { selectedBindingExperiment };
  },
});
</script>
