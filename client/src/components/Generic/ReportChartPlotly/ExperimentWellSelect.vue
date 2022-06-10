<template>
  <v-card tile elevation="1">
    <v-card-title class="pa-1 pl-3 text-body-1 font-weight-medium" style="border-bottom: 1px solid #d5d5d5; background-color: #f7f7f7">
      Raw data experiment wells
    </v-card-title>
    <v-card-text class="pa-0" style="max-height: 40vh; overflow-y: scroll">
      <v-list class="py-0">
        <v-list-item-group v-model="_selectedExperimentWells" multiple>
          <template v-for="(item, index) in experimentWells">
            <v-list-item :key="index" dense :value="item">
              <template #[`default`]="{ active }">
                <v-list-item-icon class="mx-0">
                  <v-icon v-if="active" color="blue darken-2" dense>mdi-checkbox-marked</v-icon>
                  <v-icon v-else dense>mdi-checkbox-blank-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-title>{{ experimentWellLabel(item) }}</v-list-item-title>
              </template>
            </v-list-item>
            <v-divider :key="index + 'a'" />
          </template>
        </v-list-item-group>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { ExperimentWell } from "@/models";
import { computed, defineComponent, PropType } from "@vue/composition-api";

export default defineComponent({
  props: { selectedExperimentWells: Array as PropType<ExperimentWell[]>, experimentWells: Array as PropType<ExperimentWell[]> },
  emits: ["update-selectedexperimentwells"],
  setup(props, { emit }) {
    const _selectedExperimentWells = computed({
      get() {
        return props.selectedExperimentWells;
      },
      set(v: ExperimentWell[]) {
        emit("update-selectedexperimentwells", v);
      },
    });

    const experimentWellLabel = (experimentWell: ExperimentWell) => {
      const d = {
        id: experimentWell.id,
        conc: (experimentWell.ligand_conc * 10 ** 6).toPrecision(3),
        Tm: experimentWell.tm_model_params.Tm.toPrecision(3),
      };
      return `#${d.id} (${d.conc}μM, ${d.Tm}`;
    };

    return { _selectedExperimentWells, experimentWellLabel };
  },
});
</script>
