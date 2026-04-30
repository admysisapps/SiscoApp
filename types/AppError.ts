export type AppError =
  | { type: "user_not_found" }
  | { type: "no_projects" }
  | { type: "projects_inactive" }
  | { type: "server_error"; retryable: boolean };
