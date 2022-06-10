const webpack = require('webpack');


const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;


const CompressionPlugin = require('compression-webpack-plugin');

const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin');


const WorkerLoader = require('worker-loader');

module.exports = {
  chainWebpack: config => {
    config.module
    .rule('worker-loader')
    .test('/\.worker\.js$/')
    .use('worker-loader')
    .loader('worker-loader')
    .end()
  },
  lintOnSave: false,
  "transpileDependencies": [
    "vuetify"
  ],
  devServer: {


    proxy: {
      "/api": {
        target: "http://localhost:5000"
      },
      "/documentation": {
        target: "http://localhost:8000",
        pathRewrite: {
          "^/documentation": ""
        }
      },
      "/plbd": {
        target: "https://plbd.ibt.lt/db-trunk/",
        pathRewrite: {
          "^/plbd": ""
        }
      },
      // "/plbd_mock": {
      //   target: "http://localhost:3001",
      //   pathRewrite: {"^/plbd_mock" : ""}
      // }
    }

  },
  configureWebpack: {
    plugins:
      //[new BundleAnalyzerPlugin(), new CompressionPlugin(),],
      //[new CompressionPlugin(),],
      [
        new webpack.DefinePlugin({
          VERSION: JSON.stringify(require("./package.json").version),
          BUILDTIME: JSON.stringify(new Date().toISOString().slice(0, 10).split("-").join("") + new Date().getHours() + new Date().getMinutes()),
        }),
        
      ],
    externals: {
      moment: 'moment',
    },
  }
}