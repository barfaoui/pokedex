import { expect, test, type Page } from '@playwright/test'

const MODEL_LOAD = { timeout: 30_000 }

async function searchFor(page: Page, query: string) {
  await page.getByRole('searchbox', { name: 'Search' }).fill(query)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

// One journey, so the model loads once instead of once per case
test('search by meaning, from the first load to an unrelated query', async ({
  page,
}) => {
  test.setTimeout(60_000)
  const waiting = page.getByText('Prof. Chen is digging through his lab files…')

  await test.step('a confident deterministic search never waits for the lab files', async () => {
    await searchFor(page, 'put my opponent to sleep')
    await expect(card(page, 'Sleep Powder')).toBeVisible()
    await expect(waiting).toHaveCount(0)
  })

  await test.step('an unusual phrasing waits for the lab files, then finds the sleep moves', async () => {
    await searchFor(page, 'make the enemy doze off')
    await expect(waiting).toBeVisible()
    await expect(waiting).toHaveCount(0, MODEL_LOAD)
    for (const move of ['Sleep Powder', 'Sing', 'Hypnosis']) {
      await expect(card(page, move), move).toBeVisible()
    }
  })

  // Deterministic search only finds the ability Healer, by name
  await test.step('meaning finds what deterministic search cannot', async () => {
    await searchFor(page, 'heal the user')
    await expect(card(page, 'Recover')).toBeVisible()
    await expect(card(page, 'Soft-Boiled')).toBeVisible()
  })

  await test.step('"spaghetti" still finds nothing', async () => {
    await searchFor(page, 'spaghetti')
    await expect(
      page.getByText('Prof. Chen found nothing for “spaghetti”.'),
    ).toBeVisible()
  })
})

test('if the model cannot load, a note says so and deterministic search still works', async ({
  page,
  context,
}) => {
  await context.route('**/models/**', (route) => route.abort())
  await searchFor(page, 'make the enemy doze off')
  await expect(page.getByRole('note')).toContainText(
    'search by meaning is off',
    MODEL_LOAD,
  )

  await searchFor(page, 'pikachu')
  await expect(card(page, 'Pikachu')).toBeVisible()
})

function card(page: Page, name: string) {
  return page.getByRole('article', { name, exact: true })
}
