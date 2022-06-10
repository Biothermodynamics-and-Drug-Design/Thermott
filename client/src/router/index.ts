import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import MainPage from "@/components/Main/MainPage.vue";
import MetaTab from "../components/MetaTab/MetaTab.vue";
import BindingTab from "../components/BindingTab/BindingTab.vue";
import ExperimentBuilder from "../components/MetaTab/ExperimentBuilder.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    alias: "/Start",
    name: "Start",
    component: () => import(/* webpackChunkName: "home" */ "../components/HomeTab/HomeTab.vue"),
  },
  {
    path: "/ParameterPrediction",
    name: "Parameter prediction",
    component: () => import(/* webpackChunkName: "home" */ "../components/Generic/ParameterPrediction.vue"),
  },
  {
    path: "/Database",
    name: "Database",
    component: () => import(/* webpackChunkName: "database" */ "../components/DatabaseTab/DatabaseTab.vue"),
  },
  {
    path: "/DevSettings",
    name: "Developer Settings",
    component: () => import(/* webpackChunkName: "database" */ "../components/PreferencesDialog/DevelopmentSettings.vue"),
  },
  {
    path: "/",
    name: "App",
    component: MainPage,
    redirect: "/RawData",
    children: [
      // {
      //   path: "Home",
      //   name: "Start",
      //   component: () => import(/* webpackChunkName: "home" */ '../components/HomeTab/HomeTab.vue')
      // },
      {
        path: "RawData",
        name: "Raw data",
        component: () => import(/* webpackChunkName: "analysis" */ "../components/RawDataTab/RawDataTab.vue"),
        //component: RawDataTab,
      },
      {
        path: "MetaData",
        name: "Metadata",
        //component: () => import(/* webpackChunkName: "analysis" */ "../components/MetaTab/MetaTab.vue"),
        component: MetaTab,
        redirect: "/MetaData/ExperimentWellsEditor",
        children: [
          {
            path: "ExperimentWellsEditor",
            name: "Experiment Wells Editor",
            component: () => import(/* webpackChunkName: "analysis" */ "../components/MetaTab/ExperimentWellsEditorCE.vue"),
            //component: ExperimentWellsEditor,
          },
          {
            path: "BindingExperimentBuilder",
            name: "Binding Experiment Builder",
            //component: () => import(/* webpackChunkName: "analysis" */ "../components/MetaTab/ExperimentBuilder.vue"),
            component: ExperimentBuilder,
          },
          {
            path: "MetaWizard",
            name: "MetaWizard",
            component: () => import(/* webpackChunkName: "metadata" */ "../components/MetaTab/MetaDataWizard.vue"),
          },
          // {
          //   path: "MetaImport",
          //   name: "MetaImport",
          //   component: () => import(/* webpackChunkName: "metadata" */ "../components/MetaTab/MetaImport.vue"),
          // },
          // {
          //   path: "ExperimentBuilderBasic",
          //   name: "Experiment Builder Basic",
          //   component: () => import(/* webpackChunkName: "metadata" */ "../components/MetaTab/ExperimentBuilderBasic.vue"),
          // },
        ],
      },
      {
        path: "Binding",
        name: "Binding",
        //component: () => import(/* webpackChunkName: "analysis" */ "../components/BindingTab/BindingTab.vue"),
        component: BindingTab,
      },
      // {
      //   path: "Preferences",
      //   name: "Preferences",
      //   component: () => import(/* webpackChunkName: "analysis" */ "../components/PreferencesTab/PreferencesTab.vue"),
      // },
    ],
  },
  {
    path: "*",
    name: "Page not found",
    component: () => import(/* webpackChunkName: "PageNotFound" */ "../components/Generic/PageNotFound.vue"),
  },
];

const router = new VueRouter({
  mode: "history",
  //base: process.env.BASE_URL,
  routes,
});

// router.beforeEach((to, from, next) => {
//   document.title = "TSA:"+to.name
//   next()
// })

export default router;
