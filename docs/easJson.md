"cli": { "version": ">= 16.13.3", "appVersionSource": "remote" }, "build": { "development": {
"developmentClient": true, "distribution": "internal", "env": { "APP_VARIANT": "development" },
"cache": { "disabled": false, "paths": ["node_modules", "android/.gradle", "ios/Pods"] } },
"preview": { "distribution": "internal", "env": { "APP_VARIANT": "preview" }, "cache": { "disabled":
false, "paths": ["node_modules", "android/.gradle", "ios/Pods"] } }, "production": {
"autoIncrement": true, "env": { "APP_VARIANT": "production" }, "cache": { "disabled": false,
"paths": ["node_modules", "android/.gradle", "ios/Pods"] } } }, "submit": { "production": {} } }
