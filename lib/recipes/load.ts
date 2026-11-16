// lib/recipes/load.ts — content/recipes/*.json 을 읽는다. 서버 전용.
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { Recipe } from "./types"

let cache: Recipe[] | null = null

export function loadRecipes(dir = join(process.cwd(), "content", "recipes")): Recipe[] {
  if (cache) return cache
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
  cache = files.map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as Recipe)
  return cache
}
