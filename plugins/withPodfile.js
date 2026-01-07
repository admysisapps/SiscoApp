const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withPodfile(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );

      let contents = fs.readFileSync(podfilePath, "utf-8");

      if (!contents.includes("use_modular_headers!")) {
        const platformRegex = /platform :ios.*/;

        if (platformRegex.test(contents)) {
          contents = contents.replace(platformRegex, (match) => {
            return `${match}\nuse_modular_headers!`;
          });

          fs.writeFileSync(podfilePath, contents);
        }
      }

      return config;
    },
  ]);
};
