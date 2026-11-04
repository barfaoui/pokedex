import { expect, test, type Page } from '@playwright/test'

async function searchFor(page: Page, query: string) {
  await page.getByRole('searchbox', { name: 'Search' }).fill(query)
}

function card(page: Page, name: string) {
  return page.getByRole('article', { name, exact: true })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('results appear as you type, with what matched', async ({ page }) => {
  await searchFor(page, 'fast electric')
  const electrode = card(page, 'Electrode')
  await expect(electrode).toBeVisible()
  await expect(electrode.getByText('speed')).toBeVisible()
  await expect(electrode.getByText('150')).toBeVisible()
  await expect(electrode.getByText('Electric')).toBeVisible()
})

test('exact matches are announced as such, close matches are not', async ({
  page,
}) => {
  await searchFor(page, 'fast electric')
  await expect(card(page, 'Electrode').getByText('Exact match')).toBeAttached()

  await searchFor(page, 'pikachoo')
  await expect(card(page, 'Pikachu')).toBeVisible()
  await expect(card(page, 'Pikachu').getByText('Exact match')).toHaveCount(0)
})

test('the tabs show their counts and All is selected by default', async ({
  page,
}) => {
  await searchFor(page, 'fast electric')
  await expect(page.getByRole('tab', { name: 'All 9' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByRole('tab', { name: 'Pokémon 9' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Abilities 0' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Moves 0' })).toBeVisible()
})

test('a tab narrows the results to its kind', async ({ page }) => {
  await searchFor(page, 'put my opponent to sleep')
  await page.getByRole('tab', { name: /^Moves/ }).click()

  const panel = page.getByRole('tabpanel')
  await expect(card(page, 'Sleep Powder')).toBeVisible()
  await expect(panel.getByText(/\d+ Pokémons learn it/).first()).toBeVisible()
  await expect(card(page, 'Bulbasaur')).toHaveCount(0)
})

test('arrow keys move between tabs', async ({ page }) => {
  await searchFor(page, 'sun team')
  await page.getByRole('tab', { name: /^All/ }).focus()
  await page.keyboard.press('ArrowRight')

  const pokemonTab = page.getByRole('tab', { name: /^Pokémon/ })
  await expect(pokemonTab).toBeFocused()
  await expect(pokemonTab).toHaveAttribute('aria-selected', 'true')
})

test('an empty tab says so', async ({ page }) => {
  await searchFor(page, 'fast electric')
  await page.getByRole('tab', { name: /^Moves/ }).click()
  await expect(page.getByText('No moves for “fast electric”.')).toBeVisible()
})

test('a move card shows its kind and type, an ability card its Pokémon', async ({
  page,
}) => {
  await searchFor(page, 'thunder')
  const thunder = card(page, 'Thunder')
  await expect(thunder.getByText('move', { exact: true })).toBeVisible()
  await expect(thunder.getByText('Electric', { exact: true })).toBeVisible()

  await searchFor(page, 'sun team')
  const drought = card(page, 'Drought')
  await expect(drought.getByText('ability', { exact: true })).toBeVisible()
  await expect(drought.getByText(/\d+ Pokémons/)).toBeVisible()
})

test('a count of one Pokémon reads in the singular', async ({ page }) => {
  await searchFor(page, 'lovely kiss')
  await expect(
    card(page, 'Lovely Kiss').getByText('1 Pokémon learns it'),
  ).toBeVisible()

  await searchFor(page, 'volt absorb')
  await expect(
    card(page, 'Volt Absorb').getByText('1 Pokémon', { exact: true }),
  ).toBeVisible()
})

test('the kind is only written on the All tab', async ({ page }) => {
  await searchFor(page, 'thunder')
  await page.getByRole('tab', { name: /^Moves/ }).click()
  const thunder = card(page, 'Thunder')
  await expect(thunder.getByText('Electric', { exact: true })).toBeVisible()
  await expect(thunder.getByText('move', { exact: true })).toHaveCount(0)

  await searchFor(page, 'sun team')
  await page.getByRole('tab', { name: /^Abilities/ }).click()
  const drought = card(page, 'Drought')
  await expect(drought).toBeVisible()
  await expect(drought.getByText('ability', { exact: true })).toHaveCount(0)
})

test('the result count is announced', async ({ page }) => {
  await searchFor(page, 'fast electric')
  await expect(page.getByRole('status')).toHaveText('9 results')
  await page.getByRole('tab', { name: /^Moves/ }).click()
  await expect(page.getByRole('status')).toHaveText('0 results')
})

test('the query and the tab are kept in the URL and survive a refresh', async ({
  page,
}) => {
  await searchFor(page, 'rain team')
  await page.getByRole('tab', { name: /^Abilities/ }).click()
  await expect(page).toHaveURL(/\?q=rain\+team&tab=abilities$/)

  await page.reload()
  await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveValue(
    'rain team',
  )
  await expect(page.getByRole('tab', { name: /^Abilities/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})

test('a missing image shows a placeholder and keeps the name and types', async ({
  page,
}) => {
  await page.route('**/official-artwork/**', (route) => route.abort())
  await searchFor(page, 'pikachu')

  const pikachu = card(page, 'Pikachu')
  await expect(
    pikachu.getByRole('img', { name: 'Pikachu (image unavailable)' }),
  ).toBeVisible()
  await expect(pikachu.getByRole('heading', { name: 'Pikachu' })).toBeVisible()
  await expect(pikachu.getByText('Electric')).toBeVisible()
})

test('a pixel-art image seen once comes back without downloading it again', async ({
  page,
}) => {
  await searchFor(page, 'pikachu')
  const image = card(page, 'Pikachu').getByRole('img', {
    name: 'Pikachu',
    exact: true,
  })
  await expect(image).toHaveAttribute('data-ready', 'true')

  await page.route('**/official-artwork/**', (route) => route.abort())
  await searchFor(page, '')
  await searchFor(page, 'pikachu')

  await expect(image).toHaveAttribute('data-ready', 'true')
  await expect(image).toHaveAttribute('src', /^data:image\/png/)
})

test('the heart adds a Pokémon to the Pokédex and remembers it', async ({
  page,
}) => {
  await searchFor(page, 'pikachu')
  await page.getByRole('button', { name: 'Add Pikachu to the Pokédex' }).click()

  const remove = page.getByRole('button', {
    name: 'Remove Pikachu from the Pokédex',
  })
  await expect(remove).toHaveAttribute('aria-pressed', 'true')

  await page.reload()
  await expect(remove).toBeVisible()
  await remove.click()
  await expect(
    page.getByRole('button', { name: 'Add Pikachu to the Pokédex' }),
  ).toHaveAttribute('aria-pressed', 'false')
})

test('only Pokémon cards have a heart', async ({ page }) => {
  await searchFor(page, 'sun team')
  const heart = { name: /Pokédex/ }
  await expect(card(page, 'Vulpix').getByRole('button', heart)).toBeVisible()
  await expect(card(page, 'Drought')).toBeVisible()
  await expect(card(page, 'Drought').getByRole('button', heart)).toHaveCount(0)
  await expect(card(page, 'Solar Beam')).toBeVisible()
  await expect(card(page, 'Solar Beam').getByRole('button', heart)).toHaveCount(
    0,
  )
})
