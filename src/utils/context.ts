// Originally pulled from https://github.com/JasonEtco/actions-toolkit/blob/main/src/context.ts
import { existsSync } from "../deps.ts";
import { readJsonSync } from "./json.ts";
import {WebhookPayload} from './ctx_interfaces.ts'
import { warning } from "./action.ts";

export class Context {
  /**
   * Webhook payload object that triggered the workflow
   */
  payload: WebhookPayload

  eventName: string
  sha: string
  ref: string
  workflow: string
  action: string
  actor: string
  job: string
  runNumber: number
  runId: number
  apiUrl: string
  serverUrl: string
  graphqlUrl: string

  /**
   * Hydrate the context from the environment
   */
  constructor() {
    this.payload = {}
    const event_path = Deno.env.get("GITHUB_EVENT_PATH");
    if (event_path !== undefined) {
      if (existsSync(event_path)) {
        this.payload = readJsonSync(event_path);
      } else {
        warning(`GITHUB_EVENT_PATH ${event_path} does not exist`)
      }
    }
    this.eventName = Deno.env.get("GITHUB_EVENT_NAME") as string
    this.sha = Deno.env.get("GITHUB_SHA") as string
    this.ref = Deno.env.get("GITHUB_REF") as string
    this.workflow = Deno.env.get("GITHUB_WORKFLOW") as string
    this.action = Deno.env.get("GITHUB_ACTION") as string
    this.actor = Deno.env.get("GITHUB_ACTOR") as string
    this.job = Deno.env.get("GITHUB_JOB") as string
    this.runNumber = parseInt(Deno.env.get("GITHUB_RUN_NUMBER") as string, 10)
    this.runId = parseInt(Deno.env.get("GITHUB_RUN_ID") as string, 10)
    this.apiUrl = Deno.env.get("GITHUB_API_URL") ?? "https://api.github.com"
    this.serverUrl = Deno.env.get("GITHUB_SERVER_URL") ?? "https://github.com"
    this.graphqlUrl =
      Deno.env.get("GITHUB_GRAPHQL_URL") ?? "https://api.github.com/graphql"
  }

  get issue(): {owner: string; repo: string; number: number} {
    const payload = this.payload

    return {
      ...this.repo,
      number: (payload.issue || payload.pull_request || payload).number
    }
  }

  get repo(): {owner: string; repo: string} {
    const repository = Deno.env.get("GITHUB_REPOSITORY");
    if (repository !== undefined) {
      const [owner, repo] = repository.split('/')
      return {owner, repo}
    }

    if (this.payload.repository) {
      return {
        owner: this.payload.repository.owner.login,
        repo: this.payload.repository.name
      }
    }

    throw new Error(
      "context.repo requires a GITHUB_REPOSITORY environment variable like 'owner/repo'"
    )
  }
}

export const context = new Context();
