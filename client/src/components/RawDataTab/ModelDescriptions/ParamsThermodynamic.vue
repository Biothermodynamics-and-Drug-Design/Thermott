<template>
  <div>
    <template v-if="params && !editMode">
      <v-row no-gutters class="spaced-children">
        <span>
          <Param class="font-weight-medium mr-1" parameter="Tm" />
          {{ params.Tm }}°C
        </span>
        <span
          ><Param class="font-weight-medium mr-1" parameter="DH" />
          {{ params.dH }}</span
        >
        <span>
          <Param class="font-weight-medium mr-1" parameter="DCp" />
          {{ params.dCp }}
        </span>
        <span>
          <span class="font-weight-medium"><i>y</i><sub>f</sub></span>
          {{ params.yf }}
        </span>
        <span>
          <span class="font-weight-medium"><i>y</i><sub>fs</sub></span>
          {{ params.yfs }}
        </span>
        <span>
          <span class="font-weight-medium"><i>y</i><sub>u</sub></span>
          {{ params.yu }}
        </span>
        <span>
          <span class="font-weight-medium"><i>y</i><sub>us</sub></span>
          {{ params.yus }}
        </span>
        <v-icon class="mx-2" size="18" @click="editMode = true"
          >mdi-pencil</v-icon
        >
      </v-row>
    </template>
    <template v-if="params && editMode">
      <v-row no-gutters align="center" class="text-subtitle-1">
        <v-text-field
          v-model.number="params.Tm"
          class="shrink mx-1 small_input"
          dense
          height="20"
          hide-details
          @change="paramChange"
        >
          <template #[`prepend-inner`]
            ><Param class="mr-2" parameter="Tm"
          /></template>
          <template #[`append`]>°C</template>
        </v-text-field>
        <v-text-field
          v-model.number="params.dH"
          class="shrink mx-1 small_input"
          dense
          height="20"
          hide-details
          @change="paramChange"
        >
          <template #[`prepend-inner`]
            ><Param class="mr-2" parameter="DH"
          /></template>
        </v-text-field>
        <v-text-field
          v-model.number="params.dCp"
          class="shrink mx-1 small_input"
          dense
          height="20"
          hide-details
          @change="paramChange"
        >
          <template #[`prepend-inner`]
            ><Param class="mr-2" parameter="DCp"
          /></template>
        </v-text-field>
        <v-text-field
          v-model.number="params.yf"
          class="shrink mx-1 small_input"
          dense
          height="20"
          hide-details
          @change="paramChange"
        >
          <template #[`prepend-inner`]
            ><span class="mr-2"><i>y</i><sub>f</sub></span></template
          >
        </v-text-field>
        <v-text-field
          v-model.number="params.yfs"
          class="shrink mx-1 small_input"
          dense
          height="20"
          hide-details
          @change="paramChange"
        >
          <template #[`prepend-inner`]
            ><span class="mr-2"><i>y</i><sub>fs</sub></span></template
          >
        </v-text-field>
        <v-text-field
          v-model.number="params.yu"
          class="shrink mx-1 small_input"
          dense
          height="20"
          hide-details
          @change="paramChange"
        >
          <template #[`prepend-inner`]
            ><span class="mr-2"><i>y</i><sub>u</sub></span></template
          >
        </v-text-field>
        <v-text-field
          v-model.number="params.yus"
          class="shrink mx-1 small_input"
          dense
          height="20"
          hide-details
          @change="paramChange"
        >
          <template #[`prepend-inner`]
            ><span class="mr-2"><i>y</i><sub>us</sub></span></template
          >
        </v-text-field>
        <v-icon @click="editMode = false">mdi-close</v-icon>
      </v-row>
    </template>
  </div>
</template>

<script lang="ts">
import { TmModelParams_Thermodynamic } from "@/models";
import { defineComponent, PropType, ref } from "@vue/composition-api";
import Param from "@/components/Generic/DisplayParamater.vue";

export default defineComponent({
  components: { Param },
  props: { params: Object as PropType<TmModelParams_Thermodynamic> },
  setup(props, { emit }) {
    const editMode = ref(false);
    const paramChange = () => {
      emit("paramChange");
    };
    return { paramChange, editMode };
  },
});
</script>

<style scoped>
.spaced-children > * {
  margin: 0.2em 0.6em;
}

.spaced-children > span > span {
  margin-right: 0.1em;
}

.v-text-field >>> input {
  font-weight: 400;
  text-transform: capitalize;
}

.v-input.small_input {
  max-width: 140px;
}

.v-list-item {
  min-height: 24px;
}
</style>
