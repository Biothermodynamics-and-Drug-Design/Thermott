<template>
  <v-app>
    <confirm-dialog />
    <v-container class="grid-container">
      <div class="grid">
        <div class="logo-title">
          <img src="/otter_round.png" style="max-height: 6em; width: auto" />
          <div
            class="
              pt-2
              pl-4
              text-h3 text-center
              justify-center
              indigo--text
              text--darken-4
            "
          >
            Thermott
          </div>
        </div>
        <div class="summary text-body-1 black--text">
          Web application for analysis of thermal shift assay (TSA)/differential
          scanning fluorimetry (DSF) data
        </div>
        <div class="buttons">
          <v-btn
            class="button-analysis"
            to="/RawData"
            x-large
            depressed
            color="success"
          >
            Start analysis
            <v-icon class="pl-3" v-text="'mdi-chart-bell-curve-cumulative'" />
          </v-btn>

          <v-btn
            class="button-tutorial"
            v-if="!demo.state"
            depressed
            color="secondary"
            @click="initDemo"
          >
            Quick Start tutorial
            <v-icon class="pl-3" v-text="'mdi-help-box'" />
          </v-btn>

          <v-btn
            class="button-documentation"
            target="_blank"
            href="/documentation/"
            depressed
            color="primary"
          >
            Documentation
            <v-icon class="pl-3" v-text="'mdi-book-open-variant'" />
          </v-btn>
        </div>
        <div class="descriptions">
          <div class="description-title text-h6">Technique applicable for</div>

          <v-card outlined height="100%">
            <p class="text-h6 text-left">Protein-ligand binding experiments</p>
            <p>
              For determining ligand binding strength to protein (<span
                class="font-italic"
                >K</span
              ><sub>b</sub> or <span class="font-italic">K</span><sub>d</sub>).
              The experiment is done by adding different ratios of ligand to
              protein.
            </p>
          </v-card>

          <v-card outlined height="100%">
            <p class="text-h6 text-left">Protein stability experiments</p>
            <p>
              For determining how different conditions influence protein
              stability (salts, metal ions, pH etc). Useful when you want to
              determine optimal protein crystalization or storage conditions.
            </p>
          </v-card>
        </div>
        <div class="cite">
          <v-card outlined height="100%">
            <v-card-title class="py-1 px-3">
              <v-icon class="mr-2" color="black">mdi-notebook</v-icon>
              <span>How to cite</span>
            </v-card-title>
            <div class="py-1 px-3">
              <span>
                <a
                  href="https://doi.org/10.1016/j.drudis.2022.05.008"
                  target="_blank"
                  style="text-decoration: none; color: inherit"
                >
                  M. Gedgaudas, D. Baronas, E. Kazlauskas, V. Petrauskas, D.
                  Matulis, Thermott: A comprehensive online tool for
                  protein–ligand binding constant determination, Drug Discovery
                  Today, 2022
                  <v-icon> mdi-link </v-icon>
                </a>
              </span>
            </div>
          </v-card>
        </div>
      </div>
    </v-container>
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from "@vue/composition-api";
import { confirmDialog } from "@/components/Generic/confirmdialog";
import { startDemo, demo } from "@/components/Generic/Demo/Demo";
import { Delete_AppData } from "@/utils/localStorage";
import ConfirmDialog from "@/components/Generic/ConfirmDialog.vue";

export default defineComponent({
  components: { ConfirmDialog },
  setup() {
    const initDemo = async () => {
      const res = await confirmDialog({
        text: "Do you want to start demo? This will clear existing data.",
      });
      if (!res) return;
      Delete_AppData();
      startDemo();
    };

    return { demo, initDemo };
  },
});
</script>

<style scoped>
.grid-container {
  display: grid;
  place-items: center;
  height: 100%;
}
.grid {
  display: grid;
  place-items: center;
  max-width: 50em;
  gap: 1em;
  grid-template-areas:
    "logo-title"
    "summary"
    "buttons"
    "descriptions"
    "cite";
}

@media only screen and (min-width: 600px) {
  .grid {
    height: 100%;
    max-height: 60em;
  }
}

.logo-title {
  grid-area: logo-title;
  display: flex;
  align-items: center;
  text-align: center;
}

.summary {
  grid-area: summary;
  text-align: center;
}

@media only screen and (min-width: 600px) {
  .buttons {
    grid-area: buttons;
    display: grid;
    grid-template-columns: auto;
    gap: 0.5em;
    grid-template-areas:
      "analysis analysis"
      "tutorial documentation";
  }
}

@media only screen and (max-width: 600px) {
  .buttons {
    grid-area: buttons;
    display: grid;
    grid-template-columns: auto;
    gap: 0.5em;
    grid-template-areas:
      "analysis"
      "tutorial"
      "documentation";
  }
}

.button-analysis {
  grid-area: analysis;
}
.button-tutorial {
  grid-area: tutorial;
}
.button-documentation {
  grid-area: documentation;
}

@media only screen and (min-width: 600px) {
  .descriptions {
    grid-area: descriptions;
    display: grid;
    gap: 1em;
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "description-title description-title"
      "description-1 description-2";
  }
}

@media only screen and (max-width: 600px) {
  .descriptions {
    grid-area: descriptions;
    display: grid;
    gap: 1em;
    grid-template-areas:
      "description-title"
      "description-1"
      "description-2";
  }
}

.descriptions > *:nth-child(n + 1) {
  padding: 0.5em;
}

.description-title {
  grid-area: description-title;
  display: grid;
  place-items: center;
}

.description-1 {
  grid-area: description-1;
}

.description-2 {
  grid-area: description-2;
}

.cite {
  grid-area: cite;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>



