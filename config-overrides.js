// https://juejin.cn/post/6844903669293400072
module.exports = function override(config, env) {
  //do stuff with the webpack config...
  if (env === "production") {
    config.output.publicPath = "./";
  }
  return config;
};
