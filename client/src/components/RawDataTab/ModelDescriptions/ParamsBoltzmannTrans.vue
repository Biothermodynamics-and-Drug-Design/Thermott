<template>
  <span>
    <template v-if="params && !editMode">
      <v-row no-gutters>
        <span class="font-weight-bold"> <i>T</i><sub>m</sub>: {{ params.Tm }}°C | </span>
        <span>k: {{ params.k }}|</span>
        <span> y<sub>f</sub>: {{ params.yf }}| </span>
        <span> y<sub>fs</sub>: {{ params.yfs }}| </span>
        <span> y<sub>u</sub>: {{ params.yu }}| </span>
        <span> y<sub>us</sub>: {{ params.yus }} </span>
        <v-icon class="mx-2" small @click="editMode = true">mdi-pencil</v-icon>
      </v-row>
    </template>
    <template v-if="params && editMode">
      <v-row no-gutters class="pt-3">
        <v-text-field
          v-model.number="params.Tm"
          label="Tm"
          class="shrink mx-1 small_input"
          dense
          height="20"
          hide-details
          @change="paramChange"
        ></v-text-field>
        <v-text-field
          v-model.number="params.k"
          label="k"
          class="shrink mx-1 small_input"
          dense
          height="20"
          hide-details
          @change="paramChange"
        ></v-text-field>
        <v-text-field
          v-model.number="params.yf"
          label="yf"
          class="shrink mx-1 small_input"
          dense
          height="20"
          hide-details
          @change="paramChange"
        ></v-text-field>
        <v-text-field
          v-model.number="params.yfs"
          label="yfs"
          class="shrink mx-1 small_input"
          dense
          height="20"
          hide-details
          @change="paramChange"
        ></v-text-field>
        <v-text-field
          v-model.number="params.yu"
          label="yu"
          class="shrink mx-1 small_input"
          dense
          height="20"
          hide-details
          @change="paramChange"
        ></v-text-field>
        <v-text-field
          v-model.number="params.yus"
          label="yus"
          class="shrink mx-1 small_input"
          dense
          height="20"
          hide-details
          @change="paramChange"
        ></v-text-field>
        <v-icon small class="pb-3" @click="editMode = false">mdi-close</v-icon>
      </v-row>
    </template>
  </span>
</template>

<script lang="ts">
import { TmModelParams_BoltzmannTrans } from "@/models";
import { defineComponent, PropType, ref } from "@vue/composition-api";

export default defineComponent({
  props: { params: Object as PropType<TmModelParams_BoltzmannTrans> },
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
.v-text-field >>> input {
  font-size: 0.9em;
  font-weight: 400;
  text-transform: capitalize;
}
.v-input.small_input {
  width: 9%;
}

.v-list-item {
  min-height: 24px;
}
</style>
