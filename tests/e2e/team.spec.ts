import { expect, test, type Page } from '@playwright/test'

const ELECTRIC = [
  'Electrode',
  'Jolteon',
  'Raichu',
  'Electabuzz',
  'Voltorb',
  'Zapdos',
  'Pikachu',
]

async function searchFor(page: Page, query: string) {
  await page.getByRole('searchbox', { name: 'Search' }).fill(query)
}

async function startTeam(page: Page) {
  await searchFor(page, 'electric')
  await page.getByRole('tab', { name: /^Pokémon/ }).click()
  await page.getByRole('button', { name: 'Create a team', exact: true }).click()
}

function tick(page: Page, name: string) {
  return page.getByRole('checkbox', { name: `Select ${name}`, exact: true })
}

function myTeam(page: Page, count: number) {
  return page.getByRole('button', {
    name: `My team (${count} / 6)`,
    exact: true,
  })
}

function teamWindow(page: Page) {
  return page.getByRole('dialog', { name: 'My team' })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test.describe('on desktop', () => {
  test('Create a team turns the cards into tick boxes, each tick joins the team', async ({
    page,
  }) => {
    await startTeam(page)
    await expect(myTeam(page, 0)).toBeVisible()

    for (const name of ELECTRIC.slice(0, 3)) {
      await tick(page, name).click()
    }
    await expect(myTeam(page, 3)).toBeVisible()
    await expect(tick(page, 'Raichu')).toHaveAttribute('aria-checked', 'true')
  })

  test('the team window shows six slots, and a Pokémon can be removed', async ({
    page,
  }) => {
    await startTeam(page)
    for (const name of ELECTRIC.slice(0, 3)) {
      await tick(page, name).click()
    }
    await myTeam(page, 3).click()

    const team = teamWindow(page)
    await expect(team.getByRole('listitem')).toHaveCount(6)
    await expect(team.getByRole('article', { name: 'Jolteon' })).toBeVisible()
    await expect(team.getByText('Empty slot')).toHaveCount(3)
    await expect(team.getByText('3 / 6')).toBeVisible()

    await team
      .getByRole('button', { name: 'Remove Jolteon from the team' })
      .click()
    await expect(team.getByRole('article', { name: 'Jolteon' })).toHaveCount(0)
    await expect(team.getByText('Empty slot')).toHaveCount(4)
  })

  test('six is the limit, and a full team is a dream team', async ({
    page,
  }) => {
    await startTeam(page)
    for (const name of ELECTRIC) {
      await tick(page, name).click()
    }
    await expect(myTeam(page, 6)).toBeVisible()
    await expect(tick(page, 'Pikachu')).toHaveAttribute('aria-checked', 'false')

    await myTeam(page, 6).click()
    await expect(
      teamWindow(page).getByText('Oh, what a dream team!'),
    ).toBeVisible()
    await expect(teamWindow(page).getByText('Empty slot')).toHaveCount(0)
  })

  test('the team is saved: it survives a refresh and stays in the header', async ({
    page,
  }) => {
    await startTeam(page)
    await tick(page, 'Raichu').click()
    await tick(page, 'Pikachu').click()

    await page.reload()
    await expect(myTeam(page, 2)).toBeVisible()
    await myTeam(page, 2).click()
    await expect(teamWindow(page).getByRole('article')).toHaveText([
      /Raichu/,
      /Pikachu/,
    ])
  })

  test('an empty team says how to add Pokémon', async ({ page }) => {
    await startTeam(page)
    await myTeam(page, 0).click()
    await expect(
      teamWindow(page).getByText(/Tick Pokémon on the Pokémon tab/),
    ).toBeVisible()
    await expect(teamWindow(page).getByText('Empty slot')).toHaveCount(6)
  })

  test('off the Pokémon tab, Create a team is greyed out', async ({ page }) => {
    await searchFor(page, 'electric')
    await page.getByRole('tab', { name: /^Moves/ }).click()
    await expect(
      page.getByRole('button', { name: 'Create a team', exact: true }),
    ).toHaveAttribute('aria-disabled', 'true')
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('a floating Create a team shows on the Pokémon tab only', async ({
    page,
  }) => {
    await searchFor(page, 'electric')
    await page.getByRole('tab', { name: /^Pokémon/ }).click()
    const create = page.getByRole('button', {
      name: 'Create a team',
      exact: true,
    })
    await expect(create).toBeVisible()

    await page.getByRole('tab', { name: /^Moves/ }).click()
    await expect(create).toHaveCount(0)
  })
})
