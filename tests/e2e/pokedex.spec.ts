import { expect, test, type Page } from '@playwright/test'

async function searchFor(page: Page, query: string) {
  await page.getByRole('searchbox', { name: 'Search' }).fill(query)
}

function pokedexButton(page: Page) {
  return page.getByRole('banner').getByRole('button', { name: /^Pokédex/ })
}

function album(page: Page) {
  return page.getByRole('dialog', { name: 'My Pokédex' })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('an empty Pokédex says how to add a Pokémon and shows empty pockets', async ({
  page,
}) => {
  await expect(pokedexButton(page)).toHaveAccessibleName('Pokédex, 0 Pokémons')
  await pokedexButton(page).click()

  await expect(album(page).getByText(/Tap the ♡ on a Pokémon/)).toBeVisible()
  await expect(album(page).getByText('Empty pocket')).toHaveCount(6)
})

test('a heart on a result card adds the Pokémon to the album', async ({
  page,
}) => {
  await searchFor(page, 'pikachu')
  await page.getByRole('button', { name: 'Add Pikachu to the Pokédex' }).click()
  await expect(pokedexButton(page)).toHaveAccessibleName('Pokédex, 1 Pokémon')

  await pokedexButton(page).click()
  const pikachu = album(page).getByRole('article', { name: 'Pikachu' })
  await expect(pikachu).toBeVisible()
  await expect(pikachu.getByText('Spd 90 · Atk 55')).toBeVisible()
  await expect(album(page).getByText('Empty pocket')).toHaveCount(5)
  await expect(album(page).getByText(/Tap the ♡/)).toHaveCount(0)
})

test('the heart on the detail card adds the Pokémon too', async ({ page }) => {
  await searchFor(page, 'raichu')
  await page.getByRole('button', { name: 'Open Raichu', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Raichu' })
    .getByRole('button', { name: 'Add Raichu to the Pokédex' })
    .click()
  await page.keyboard.press('Escape')

  await pokedexButton(page).click()
  await expect(
    album(page).getByRole('article', { name: 'Raichu' }),
  ).toBeVisible()
})

test('removing a Pokémon in the album takes it out everywhere', async ({
  page,
}) => {
  await searchFor(page, 'pikachu')
  await page.getByRole('button', { name: 'Add Pikachu to the Pokédex' }).click()
  await pokedexButton(page).click()

  await album(page)
    .getByRole('button', { name: 'Remove Pikachu from the Pokédex' })
    .click()
  await expect(
    album(page).getByRole('article', { name: 'Pikachu' }),
  ).toHaveCount(0)
  await expect(album(page).getByText('Empty pocket')).toHaveCount(6)

  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('button', { name: 'Add Pikachu to the Pokédex' }),
  ).toBeVisible()
})

test('the album survives a refresh, in the order Pokémon were added', async ({
  page,
}) => {
  await searchFor(page, 'electric')
  await page.getByRole('button', { name: 'Add Raichu to the Pokédex' }).click()
  await page.getByRole('button', { name: 'Add Pikachu to the Pokédex' }).click()

  await page.reload()
  await pokedexButton(page).click()
  await expect(album(page).getByRole('article')).toHaveText([
    /Raichu/,
    /Pikachu/,
  ])
})
