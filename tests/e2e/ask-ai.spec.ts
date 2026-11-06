import { expect, test, type Page } from '@playwright/test'

// The AI endpoint is always mocked here: no test ever reaches the provider.
async function mockAi(page: Page, note: string | null) {
  await page.route('**/api/ask-ai-status', (route) =>
    route.fulfill({ json: { configured: note !== null } }),
  )
  await page.route('**/api/ask-ai', (route) =>
    route.fulfill({
      json: {
        results: [{ key: 'pokemon:pikachu', note: note ?? '' }],
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
      },
    }),
  )
}

const searchBar = (page: Page) =>
  page.getByRole('searchbox', { name: 'Search' })
const askButton = (page: Page) => page.getByRole('button', { name: 'Ask AI' })

test('without a key on the server, there is no Ask AI button', async ({
  page,
}) => {
  await mockAi(page, null)
  await page.goto('/')
  await searchBar(page).fill('electric mouse')
  await expect(page.getByRole('article').first()).toBeVisible()
  await expect(askButton(page)).toHaveCount(0)
})

test('Ask AI shows the AI results with their note, and typing goes back to the search', async ({
  page,
}) => {
  await mockAi(page, 'An electric mouse, as asked')
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
  await expect(pikachu.getByText('An electric mouse, as asked')).toBeVisible()
  await expect(pikachu.getByText('Exact match')).toHaveCount(0)

  await searchBar(page).fill('the yellow electric mice')
  await expect(page.getByText(/^AI answer/)).toHaveCount(0)
})

test('an AI note holding HTML shows as text, never as markup', async ({
  page,
}) => {
  const note =
    '<script>window.injected = true</script><img src=x onerror="window.injected = true">'
  await mockAi(page, note)
  await page.goto('/')
  await searchBar(page).fill('pikachu')
  await askButton(page).click()

  await expect(page.getByText(note).first()).toBeVisible()
  expect(await page.evaluate("'injected' in window")).toBe(false)
})
