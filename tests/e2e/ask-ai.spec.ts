import { expect, test, type Page } from '@playwright/test'

// The AI endpoint is always mocked here: no test ever reaches the provider.
async function mockAi(page: Page, configured: boolean, results: string[]) {
  const calls = { count: 0 }
  await page.route('**/api/ask-ai-status', (route) =>
    route.fulfill({ json: { configured } }),
  )
  await page.route('**/api/ask-ai', (route) => {
    calls.count++
    return route.fulfill({
      json: {
        results,
        usage: {
          latencyMs: 5,
          inputTokens: 1,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
          outputTokens: 1,
          costUsd: 0,
        },
        model: 'mock',
        promptVersion: 'test',
        stopReason: 'end_turn',
        truncated: false,
      },
    })
  })
  return calls
}

const searchBar = (page: Page) =>
  page.getByRole('searchbox', { name: 'Search' })
const askButton = (page: Page) => page.getByRole('button', { name: 'Ask AI' })
const suggestion = (page: Page) =>
  page.getByText('Not what you’re looking for?')

test('without a key on the server, there is no Ask AI button', async ({
  page,
}) => {
  await mockAi(page, false, [])
  await page.goto('/')
  await searchBar(page).fill('electric mouse')
  await expect(page.getByRole('article').first()).toBeVisible()
  await expect(askButton(page)).toHaveCount(0)
})

test('Ask AI shows the AI results as found by AI, and typing goes back to the search', async ({
  page,
}) => {
  await mockAi(page, true, ['pokemon:pikachu'])
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(askButton(page)).toHaveCount(0)
  await searchBar(page).fill('the yellow electric mouse')
  await expect(askButton(page)).toHaveAccessibleDescription(
    /sends your query to an AI provider/,
  )
  await askButton(page).click()

  const pikachu = page.getByRole('article', { name: 'Pikachu', exact: true })
  await expect(page.getByText(/^AI answer/)).toBeVisible()
  await expect(pikachu.getByText('Found by AI')).toBeVisible()
  await expect(pikachu.getByText('Exact match')).toHaveCount(0)

  await searchBar(page).fill('the yellow electric mice')
  await expect(page.getByText(/^AI answer/)).toHaveCount(0)
})

test('markup in place of a key is dropped, never shown or run', async ({
  page,
}) => {
  const markup =
    '<script>window.injected = true</script><img src=x onerror="window.injected = true">'
  await mockAi(page, true, [markup, 'pokemon:pikachu'])
  await page.goto('/')
  await searchBar(page).fill('pikachu')
  await askButton(page).click()

  await expect(
    page.getByRole('article', { name: 'Pikachu', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByText(markup)).toHaveCount(0)
  expect(await page.evaluate("'injected' in window")).toBe(false)
})

test('an unsure search suggests Ask AI, and a click replaces the results with its answer', async ({
  page,
}) => {
  const calls = await mockAi(page, true, ['pokemon:jigglypuff'])
  await page.goto('/')
  await searchBar(page).fill('a cute pink pokemon that sings')
  // The line waits for the search by meaning, which loads its model first.
  await expect(suggestion(page)).toBeVisible({ timeout: 60_000 })
  expect(await page.getByRole('article').count()).toBeGreaterThan(1)
  expect(calls.count).toBe(0)

  await page.getByRole('button', { name: 'Let AI help you' }).click()
  await expect(page.getByText(/^AI answer/)).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(
    page
      .getByRole('article', { name: 'Jigglypuff', exact: true })
      .getByText('Found by AI'),
  ).toBeVisible()
  await expect(suggestion(page)).toHaveCount(0)
  expect(calls.count).toBe(1)
})

test('an empty AI answer shows nothing', async ({ page }) => {
  await mockAi(page, true, [])
  await page.goto('/')
  await searchBar(page).fill('pikachu')
  await expect(page.getByRole('article').first()).toBeVisible()
  await askButton(page).click()

  await expect(
    page.getByText('AI answer: nothing in the Pokédex fits.'),
  ).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(0)
})

test('a confident search does not suggest Ask AI', async ({ page }) => {
  await mockAi(page, true, [])
  await page.goto('/')
  await searchBar(page).fill('pikachu')
  await expect(
    page.getByRole('article', { name: 'Pikachu', exact: true }),
  ).toBeVisible()
  await expect(suggestion(page)).toHaveCount(0)
})
