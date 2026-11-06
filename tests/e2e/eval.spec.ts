import { expect, test } from '@playwright/test'

test('/eval loads without a key: it says whether an LLM run was recorded, and live runs are off', async ({
  page,
}) => {
  await page.route('**/api/ask-ai-status', (route) =>
    route.fulfill({ json: { configured: false } }),
  )
  await page.goto('/eval')
  await expect(
    page.getByRole('heading', { name: 'Search evaluation' }),
  ).toBeVisible()
  await expect(
    page.getByText(/^(Recorded run: |No recorded LLM run yet)/),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Run LLM live' }),
  ).toBeDisabled()
  await expect(page.getByText('Live runs are off')).toBeVisible()
})

test('a live LLM run through a mocked endpoint completes and downloads as a snapshot', async ({
  page,
}) => {
  await page.route('**/api/ask-ai-status', (route) =>
    route.fulfill({ json: { configured: true } }),
  )
  await page.route('**/api/ask-ai', (route) =>
    route.fulfill({
      json: {
        results: [],
        usage: {
          latencyMs: 3,
          inputTokens: 10,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
          outputTokens: 5,
          costUsd: 0.000001,
        },
        model: 'mock',
        promptVersion: 'test',
      },
    }),
  )
  await page.goto('/eval')
  await page.getByRole('button', { name: 'Run LLM live' }).click()
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.getByText(/^Done: /)).toBeVisible({ timeout: 60_000 })

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download as snapshot' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('llm-snapshot.json')
})
