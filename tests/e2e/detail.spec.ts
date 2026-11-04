import { expect, test, type Page } from '@playwright/test'

async function searchFor(page: Page, query: string) {
  await page.getByRole('searchbox', { name: 'Search' }).fill(query)
}

function openCard(page: Page, name: string) {
  return page.getByRole('button', { name: `Open ${name}`, exact: true })
}

function detail(page: Page, name: string) {
  return page.getByRole('dialog', { name, exact: true })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('clicking a Pokémon card opens its detail', async ({ page }) => {
  await searchFor(page, 'pikachoo')
  await openCard(page, 'Pikachu').click()

  const pikachu = detail(page, 'Pikachu')
  await expect(pikachu).toBeVisible()
  await expect(pikachu.getByText('Mouse Pokémon')).toBeVisible()
  await expect(pikachu.getByText('#25')).toBeVisible()
  await expect(pikachu.getByText('Matched on:')).toBeVisible()
  await expect(pikachu.getByText('name “pikachoo” (close match)')).toBeVisible()
})

test('Enter on a card opens its detail', async ({ page }) => {
  await searchFor(page, 'pikachu')
  await openCard(page, 'Pikachu').focus()
  await page.keyboard.press('Enter')
  await expect(detail(page, 'Pikachu')).toBeVisible()
})

test('the Pokémon detail shows stats, abilities, size, description and moves', async ({
  page,
}) => {
  await searchFor(page, 'pikachu')
  await openCard(page, 'Pikachu').click()
  const pikachu = detail(page, 'Pikachu')

  const stats = pikachu.getByRole('list', { name: 'Stats' })
  await expect(stats.getByRole('listitem')).toHaveCount(6)
  await expect(stats.getByText('90')).toBeVisible()
  await expect(pikachu.getByText('Lightning Rod')).toBeVisible()
  await expect(pikachu.getByText('Static')).toBeVisible()
  await expect(pikachu.getByText('0.4 m', { exact: true })).toBeVisible()
  await expect(pikachu.getByText('6 kg', { exact: true })).toBeVisible()
  await expect(pikachu.getByText(/When several of these/)).toBeVisible()

  const moves = pikachu.getByRole('list', { name: 'Moves' })
  await expect(moves.getByRole('listitem')).toHaveCount(8)
  await pikachu.getByRole('button', { name: 'Show all 30 moves' }).click()
  await expect(moves.getByRole('listitem')).toHaveCount(30)
})

test('the evolution shows the previous, current and next forms', async ({
  page,
}) => {
  await searchFor(page, 'ivysaur')
  await openCard(page, 'Ivysaur').click()
  const evolution = detail(page, 'Ivysaur').getByRole('list', {
    name: 'Evolution',
  })
  await expect(evolution.getByRole('listitem')).toHaveText([
    'Bulbasaur',
    'Ivysaur',
    'Venusaur',
  ])
})

test('an evolution leaves out what is not next to it', async ({ page }) => {
  await searchFor(page, 'vaporeon')
  await openCard(page, 'Vaporeon').click()
  const evolution = detail(page, 'Vaporeon').getByRole('list', {
    name: 'Evolution',
  })
  await expect(evolution.getByRole('listitem')).toHaveText([
    'Eevee',
    'Vaporeon',
  ])
})

test("Eevee's evolution is shown as a branch", async ({ page }) => {
  await searchFor(page, 'eevee')
  await openCard(page, 'Eevee').click()
  const evolution = detail(page, 'Eevee').getByRole('list', {
    name: 'Evolution',
  })
  const branch = evolution.getByRole('list', { name: 'Evolves into one of' })
  await expect(branch.getByRole('listitem')).toHaveText([
    'Vaporeon',
    'Jolteon',
    'Flareon',
  ])
})

test('a Pokémon in the evolution stacks on top, and Back returns', async ({
  page,
}) => {
  await searchFor(page, 'pikachu')
  await openCard(page, 'Pikachu').click()
  await expect(page.getByRole('button', { name: 'Back' })).toHaveCount(0)

  await detail(page, 'Pikachu').getByRole('button', { name: 'Raichu' }).click()
  await expect(detail(page, 'Raichu')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(1)

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(detail(page, 'Pikachu')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Back' })).toHaveCount(0)
})

test('a move detail shows its effect and the Pokémons that learn it', async ({
  page,
}) => {
  await searchFor(page, 'put my opponent to sleep')
  await page.getByRole('tab', { name: /^Moves/ }).click()
  await openCard(page, 'Sleep Powder').click()

  const sleepPowder = detail(page, 'Sleep Powder')
  await expect(
    sleepPowder.getByText('Puts the target to sleep.', { exact: true }),
  ).toBeVisible()
  const learners = sleepPowder.getByRole('list', {
    name: 'Pokémons that learn it',
  })
  await expect(learners.getByRole('listitem')).toHaveCount(14)
})

test('an ability detail shows the Pokémons that have it', async ({ page }) => {
  await searchFor(page, 'sun team')
  await page.getByRole('tab', { name: /^Abilities/ }).click()
  await openCard(page, 'Drought').click()

  const holders = detail(page, 'Drought').getByRole('list', {
    name: 'Pokémons that have it',
  })
  await expect(holders.getByRole('listitem')).toHaveText([
    'Vulpix',
    'Ninetales',
  ])
})

for (const [how, close] of [
  ['✕', (page: Page) => page.getByRole('button', { name: 'Close' }).click()],
  ['Escape', (page: Page) => page.keyboard.press('Escape')],
  ['a click outside', (page: Page) => page.mouse.click(5, 5)],
] as const) {
  test(`${how} closes the detail and focus goes back to the card`, async ({
    page,
  }) => {
    await searchFor(page, 'pikachu')
    const card = openCard(page, 'Pikachu')
    await card.click()
    await expect(detail(page, 'Pikachu')).toBeVisible()

    await close(page)

    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(card).toBeFocused()
  })
}
