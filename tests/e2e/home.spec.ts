import { expect, test } from '@playwright/test'

const EXAMPLE_QUERIES = [
  'bulba',
  'fast electric',
  'put my opponent to sleep',
  'rain team',
  'green',
]

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('the home page shows Prof. Chen, the search bar and the example queries', async ({
  page,
}) => {
  await expect(
    page.getByRole('heading', { name: /What are you looking for\?/ }),
  ).toBeVisible()

  const searchBar = page.getByRole('searchbox', { name: 'Search' })
  await expect(searchBar).toBeVisible()
  await expect(searchBar).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Clear search' })).toBeHidden()

  for (const query of EXAMPLE_QUERIES) {
    await expect(
      page.getByRole('button', { name: query, exact: true }),
      query,
    ).toBeVisible()
  }
})

test('clicking an example query fills the search bar', async ({ page }) => {
  await page.getByRole('button', { name: 'rain team', exact: true }).click()
  await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveValue(
    'rain team',
  )
  await expect(
    page.getByRole('heading', { name: /What are you looking for\?/ }),
  ).toHaveCount(0)
})

test('a query with no results says so and suggests the example queries', async ({
  page,
}) => {
  await page.getByRole('searchbox', { name: 'Search' }).fill('spaghetti')
  await expect(
    page.getByText('Prof. Chen found nothing for “spaghetti”.'),
  ).toBeVisible()
  for (const query of EXAMPLE_QUERIES) {
    await expect(
      page.getByRole('button', { name: query, exact: true }),
      query,
    ).toBeVisible()
  }
})

test('a query with results does not show the no-results message', async ({
  page,
}) => {
  await page.getByRole('searchbox', { name: 'Search' }).fill('pikachu')
  await expect(page.getByText(/Prof\. Chen found nothing/)).toHaveCount(0)
  await expect(page.getByText(/\d+ results?/)).toBeAttached()
})

test('the clear button empties the search bar and goes back home', async ({
  page,
}) => {
  const searchBar = page.getByRole('searchbox', { name: 'Search' })
  const clearButton = page.getByRole('button', { name: 'Clear search' })
  await expect(clearButton).toHaveCount(0)

  await searchBar.fill('spaghetti')
  await clearButton.click()

  await expect(searchBar).toHaveValue('')
  await expect(searchBar).toBeFocused()
  await expect(clearButton).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: /What are you looking for\?/ }),
  ).toBeVisible()
})

test('Escape clears the search bar and goes back home', async ({ page }) => {
  const searchBar = page.getByRole('searchbox', { name: 'Search' })
  await searchBar.fill('spaghetti')
  await searchBar.press('Escape')
  await expect(searchBar).toHaveValue('')
  await expect(
    page.getByRole('heading', { name: /What are you looking for\?/ }),
  ).toBeVisible()
})
