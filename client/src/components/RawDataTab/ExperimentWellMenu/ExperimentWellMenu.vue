<template>
  <div>
    <v-menu offset-y>
      <template #activator="{ on }">
        <v-icon large v-on="on">mdi-dots-horizontal</v-icon>
      </template>
      <v-list class="py-1" dense>
        <v-list-item v-if="showChangeGainsButton" @click="changeGainDialog = true">
          <v-list-item-title>Change gain</v-list-item-title>
          <v-list-item-icon><v-icon class="ml-2">mdi-lightbulb-on-outline</v-icon></v-list-item-icon>
        </v-list-item>
        <v-divider />

        <v-list-item @click="changeModelDialog = true">
          <v-list-item-title>Change model </v-list-item-title>
          <v-list-item-icon><v-icon class="ml-2">mdi-chart-bell-curve-cumulative</v-icon></v-list-item-icon>
        </v-list-item>
      </v-list>
    </v-menu>

    <ChangeGainDialog :model-value="changeGainDialog" @update:modelValue="changeGainDialog = $event" />
    <ChangeModelDialog :model-value="changeModelDialog" @update:modelValue="changeModelDialog = $event" />
    <!-- <ChangeGainDialog :modelValue="changeGainDialog" @update:modelValue="test2($event)"/> -->
  </div>
</template>

<script lang="ts">
import ChangeGainDialog from "./ChangeGainDialog.vue";
import ChangeModelDialog from "./ChangeModelDialog.vue";
import { defineComponent, ref, computed } from "@vue/composition-api";
import { useAppData } from "@/store";

export default defineComponent({
  name: "ExperimentWellMenu",
  components: {
    ChangeGainDialog,
    ChangeModelDialog,
  },

  setup() {
    const changeGainDialog = ref(false);
    const changeModelDialog = ref(false);

    const appData = useAppData();

    const showChangeGainsButton = computed(() => appData.experimentWells.some((x) => x.fluorescence.length > 1));

    return {
      changeGainDialog,
      changeModelDialog,
      showChangeGainsButton,
    };
  },
});
</script>

<style scoped>
.v-list-item {
  min-height: 28px;
}
</style>
