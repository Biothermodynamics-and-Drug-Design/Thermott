<template>
  <div>
    <template v-if="params && !editMode">
      <v-row no-gutters align="center">
        <span> <Param class="font-weight-bold" parameter="Tm" /> {{ params.Tm }}°C </span>
        <v-icon class="mx-2" size="18" @click="editMode = true">mdi-pencil</v-icon>
      </v-row>
    </template>
    <template v-if="params && editMode">
      <v-row no-gutters align="center">
        <v-text-field v-model.number="params.Tm" class="shrink mx-1 small_input" dense height="20" hide-details @change="paramChange">
          <template #[`prepend-inner`]><Param class="mr-2" parameter="Tm" /></template>
          <template #[`append`]>°C</template>
        </v-text-field>
        <v-icon @click="editMode = false">mdi-close</v-icon>
      </v-row>
    </template>
  </div>
</template>

<script lang="ts">
import { TmModelParams_Derivative } from "@/models";
import { defineComponent, PropType, ref } from "@vue/composition-api";

export default defineComponent({
  props: { params: Object as PropType<TmModelParams_Derivative> },
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
