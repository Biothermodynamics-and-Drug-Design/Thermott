<template>
  <v-tooltip bottom>
    <template #activator="{ on, attrs }">
      <v-btn small icon v-bind="attrs" :outlined="isConstantValue" color="accent" v-on="on" @click="applyParamAll()">
        <v-icon>mdi-playlist-check</v-icon>
      </v-btn>
    </template>
    <span>Apply the same value to all experiments</span>
  </v-tooltip>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "@vue/composition-api";
import { confirmDialog } from "../Generic/confirmdialog";
import { ExperimentRequest } from "./database";
import Vue from "vue";
import { BindingExperiment } from "@/models";

export default defineComponent({
  props: {
    bindingExperiment: Object as PropType<BindingExperiment>,
    bindingExperiments: Array as PropType<BindingExperiment[]>,
    type: { type: String as PropType<`${keyof BindingExperiment}.${keyof ExperimentRequest}` | keyof BindingExperiment>, default: "" },
  },
  emits: ["update:experimentRequests", "update:experimentRequest"],
  setup(props) {
    const applyParamAll = async () => {
      const res = (await confirmDialog({ text: "Do you want to set the same for all experiments?" })) as boolean;
      if (!res) return;

      for (const editBindingExperiment of props.bindingExperiments) {
        const editExperimentRequest = editBindingExperiment.PLBDAnnotation;
        const keys = props.type.split(".");

        if (keys.length == 2 && Object.prototype.hasOwnProperty.call(editExperimentRequest, keys[1])) {
          if (keys[1] == "compound_batch" || keys[1] == "protein_batch") {
            const key = keys[1] == "compound_batch" ? "compound" : "protein";
            (editExperimentRequest as any)[key] = props.bindingExperiment.PLBDAnnotation[key];
            //Vue.set(experimentRequest, key, experimentRequest[key]);
          }
          (editExperimentRequest as any)[keys[1]] = props.bindingExperiment.PLBDAnnotation[keys[1] as keyof ExperimentRequest];
        } else if (props.type == "comment") {
          Vue.set(editBindingExperiment, props.type, props.bindingExperiment[props.type as keyof BindingExperiment]);
        } else {
          continue;
        }
      }
    };

    const isConstantValue = computed((): boolean => {
      const keys = props.type.split(".");

      const experimentRequests = props.bindingExperiments.map((x) => x.PLBDAnnotation);
      if (keys.length == 2 && keys[0] == "PLBDAnnotation") {
        const values = experimentRequests.map((x) => x[keys[1] as keyof ExperimentRequest]);
        //values = values.map(x => (x as {id: string})?.id);
        const set = Array.from(new Set(values));
        return set.length == 1 && !(set[0] == null || set[0] == "");
      } else if (props.type == "comment") {
        return false;
      } else {
        return false;
      }
    });

    return { applyParamAll, isConstantValue };
  },
});
</script>
