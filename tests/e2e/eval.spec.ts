import { expect, test, type Page } from '@playwright/test'

const MODEL = 'claude-haiku-5-5'
const LOCAL_ENGINES = [
  'Deterministic (D)',
  'Embeddings (E)',
  'Hybrid (D + E)',
  'Claude Code',
]

async function openWith(page: Page, configured: boolean) {
  await page.route('**/api/ask-ai-status', (route) =>
    route.fulfill({ json: { configured, model: MODEL } }),
  )
  await page.goto('/eval')
}

// The embedding model takes a while to load: these tests only need the LLM.
async function onlyLlm(page: Page) {
  for (const name of LOCAL_ENGINES) {
    await page.getByRole('checkbox', { name, exact: true }).uncheck()
  }
}

test('/eval loads without a key, with live runs off', async ({ page }) => {
  await openWith(page, false)
  await expect(
    page.getByRole('heading', { name: 'Search evaluation' }),
  ).toBeVisible()
  await expect(page.getByRole('radio', { name: 'live run' })).toBeDisabled()
  await expect(page.getByText('off: no AI key on this server')).toBeVisible()
})

test('the LLM and fallback columns show the recorded run, or say there is none', async ({
  page,
}) => {
  await openWith(page, false)
  await onlyLlm(page)
  const recorded = (await page.getByText(/^recorded on /).count()) > 0
  await page.getByRole('button', { name: 'Run', exact: true }).click()

  const summary = page.getByRole('table', {
    name: 'Summary of the cases shown',
  })
  await expect(
    summary.getByRole('columnheader', {
      name: 'LLM (Claude Haiku 5.5)',
    }),
  ).toBeVisible()
  const passed = summary.getByRole('row', { name: /^Passed/ })
  await expect(passed).toContainText(recorded ? / of \d+ / : 'no run yet')
  if (!recorded) {
    await expect(passed).toContainText('needs an LLM run')
  }
})

test('a live LLM run through a mocked endpoint completes', async ({ page }) => {
  await page.route('**/api/ask-ai', (route) =>
    route.fulfill({
      json: {
        results: ['pokemon:pikachu'],
        usage: {
          latencyMs: 3,
          inputTokens: 10,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
          outputTokens: 5,
          costUsd: 0.000001,
        },
        model: MODEL,
        promptVersion: 'test',
        stopReason: 'end_turn',
        truncated: false,
      },
    }),
  )
  await openWith(page, true)
  await onlyLlm(page)
  await page.getByRole('radio', { name: 'live run' }).check()
  await page.getByRole('button', { name: 'Run', exact: true }).click()

  await expect(page.getByText(/^Live done: (\d+) \/ \1 /)).toBeVisible({
    timeout: 60_000,
  })
  const summary = page.getByRole('table', {
    name: 'Summary of the cases shown',
  })
  await expect(summary.getByRole('row', { name: /^Passed/ })).toContainText(
    / of \d+ /,
  )
  await expect(summary.getByRole('row', { name: /^Cut off/ })).toContainText(
    '0',
  )
})
