import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
// import { data } from "./data/resource";
import { storage } from "./storage/resource";

const backend = defineBackend({
  auth,
  // data,
  storage,
});

const { cfnUserPool } = backend.auth.resources.cfnResources;

// Allow login with both username and email
cfnUserPool.usernameAttributes = [];
cfnUserPool.aliasAttributes = ["email"];
