<template>
  <v-container>
    <div>
      <v-alert dense type="info" color="grey lighten-1">It will group exp. wells based on different protein, ligand and protein conc. into binding experiments</v-alert>
      <v-btn small color="primary" class="mx-2" depressed @click="applyMethod">
        <v-icon class="mr-2">mdi-check</v-icon>
        Apply
      </v-btn>
    </div>
  </v-container>
</template>


<script lang="ts">
import { defineComponent,  computed} from "@vue/composition-api";
import { AppData } from "@/models";
import { PropertyBasedGroup } from "./MetaDataWizardFunc";

export default defineComponent({
  name: "MetaPropertyBasedGroup",
  props:{
    modelValue: AppData,
  },
  emits:['update:modelValue'],
  setup(props, {emit}) {
    const appData = computed({
      get: () => props.modelValue,
      set: (value: AppData) => emit("update:modelValue", value)
    })
    return {appData: appData};
  },
  computed:{

  },
  methods:{
      applyMethod(){
          this.appData.bindingExperiments = PropertyBasedGroup(this.appData.experimentWells);
      }

  },
  
});
</script>
