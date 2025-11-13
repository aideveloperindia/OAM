import { Router } from 'express'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import YAML from 'yaml'
import { logger } from '../config/logger'

const SPEC_PATH = resolve(__dirname, '../../../../docs/openapi.yaml')

let openApiSpec: unknown = null

try {
  const fileContents = readFileSync(SPEC_PATH, 'utf-8')
  openApiSpec = YAML.parse(fileContents)
} catch (error) {
  logger.error({ error, SPEC_PATH }, 'Failed to load OpenAPI specification')
  openApiSpec = {
    error: 'OpenAPI specification unavailable',
    message: error instanceof Error ? error.message : 'Unknown error'
  }
}

export const openApiRouter = Router()

openApiRouter.get('/openapi.json', (_req, res) => {
  res.status(200).json(openApiSpec)
})

