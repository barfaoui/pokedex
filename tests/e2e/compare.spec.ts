import { expect, test, type Page } from '@playwright/test'

async function searchFor(page: Page, query: string) {
  await page.getByRole('searchbox', { name: 'Search' }).fill(query)
}

function tick(page: Page, name: string) {
  return page.getByRole('checkbox', { name: `Select ${name}`, exact: true })
}

function compareButton(page: Page) {
  return page.getByRole('button', { name: 'Compare 2', exact: true })
}

function compareSelected(page: Page, count: number) {
  return page.getByRole('button', { name: `Compare 2 (${count})`, exact: true })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test.describe('on desktop', () => {
  test('Compare 2 turns the hearts into tick boxes, Cancel turns them back', async ({
    page,
  }) => {
    await searchFor(page, 'fast electric')
    await page.getByRole('tab', { name: /^Pokémon/ }).click()
    await compareButton(page).click()

    await expect(tick(page, 'Electrode')).toHaveAttribute(
      'aria-checked',
      'false',
    )
    await expect(
      page.getByRole('button', { name: 'Add Electrode to the Pokédex' }),
    ).toHaveCount(0)

    await page.getByRole('button', { name: 'Cancel selection' }).click()
    await expect(tick(page, 'Electrode')).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Add Electrode to the Pokédex' }),
    ).toBeVisible()
  })

  test('Compare is enabled at two, and a third tick replaces the oldest', async ({
    page,
  }) => {
    await searchFor(page, 'fast electric')
    await page.getByRole('tab', { name: /^Pokémon/ }).click()
    await compareButton(page).click()
    await expect(compareSelected(page, 0)).toBeDisabled()

    await tick(page, 'Electrode').click()
    await expect(compareSelected(page, 1)).toBeDisabled()

    await tick(page, 'Jolteon').click()
    await expect(compareSelected(page, 2)).toBeEnabled()

    await tick(page, 'Raichu').click()
    await expect(compareSelected(page, 2)).toBeEnabled()
    await expect(tick(page, 'Electrode')).toHaveAttribute(
      'aria-checked',
      'false',
    )
    await expect(tick(page, 'Raichu')).toHaveAttribute('aria-checked', 'true')
  })

  test('the compare window shows both Pokémon, who is higher and what they share', async ({
    page,
  }) => {
    await searchFor(page, 'fast electric')
    await page.getByRole('tab', { name: /^Pokémon/ }).click()
    await compareButton(page).click()
    await tick(page, 'Electrode').click()
    await tick(page, 'Jolteon').click()
    await compareSelected(page, 2).click()

    const window = page.getByRole('dialog', { name: 'Compare' })
    await expect(
      window.getByRole('heading', { name: 'Electrode' }),
    ).toBeVisible()
    await expect(window.getByRole('heading', { name: 'Jolteon' })).toBeVisible()

    const speed = window.getByRole('listitem').filter({ hasText: 'speed' })
    await expect(speed).toContainText('▲ 150')
    await expect(speed).toContainText('130 ▼')
    await expect(speed.getByText('higher')).toBeAttached()
    await expect(window.getByText('Shared: Electric type')).toBeVisible()
  })

  test('off the Pokémon tab, Compare 2 is greyed out and does nothing', async ({
    page,
  }) => {
    await searchFor(page, 'fast electric')
    await page.getByRole('tab', { name: /^Moves/ }).click()

    await expect(compareButton(page)).toHaveAttribute('aria-disabled', 'true')
    // Playwright waits for aria-disabled buttons to become enabled; the point is that clicking does nothing
    await compareButton(page).click({ force: true })
    await page.getByRole('tab', { name: /^Pokémon/ }).click()
    await expect(tick(page, 'Electrode')).toHaveCount(0)
  })

  test('✕ gives focus back to Compare 2', async ({ page }) => {
    await searchFor(page, 'fast electric')
    await page.getByRole('tab', { name: /^Pokémon/ }).click()
    await compareButton(page).click()
    await page.getByRole('button', { name: 'Cancel selection' }).click()
    await expect(compareButton(page)).toBeFocused()

    await page.getByRole('tab', { name: /^Moves/ }).click()
    await page.getByRole('tab', { name: /^Pokémon/ }).click()
    await expect(page.getByRole('tab', { name: /^Pokémon/ })).toBeFocused()
  })

  test('Escape in the search bar clears it but keeps the selection', async ({
    page,
  }) => {
    await searchFor(page, 'fast electric')
    await page.getByRole('tab', { name: /^Pokémon/ }).click()
    await compareButton(page).click()
    await tick(page, 'Electrode').click()

    await page.getByRole('searchbox', { name: 'Search' }).press('Escape')
    await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveValue(
      '',
    )
    await expect(compareSelected(page, 1)).toBeVisible()
  })

  test('Escape leaves selection mode', async ({ page }) => {
    await searchFor(page, 'fast electric')
    await page.getByRole('tab', { name: /^Pokémon/ }).click()
    await compareButton(page).click()
    await tick(page, 'Electrode').click()

    await page.keyboard.press('Escape')
    await expect(tick(page, 'Electrode')).toHaveCount(0)
    await expect(compareSelected(page, 1)).toHaveCount(0)
    await expect(compareButton(page)).toBeVisible()
  })
})

test('the selection stays in the header when going back to the home page', async ({
  page,
}) => {
  await searchFor(page, 'fast electric')
  await page.getByRole('tab', { name: /^Pokémon/ }).click()
  await compareButton(page).click()
  await tick(page, 'Electrode').click()

  await page.getByRole('button', { name: 'Clear search' }).click()
  const selection = page
    .getByRole('banner')
    .getByRole('region', { name: 'Selection' })
  await expect(
    selection.getByRole('button', { name: 'Compare 2 (1)' }),
  ).toBeVisible()

  await searchFor(page, 'jolteon')
  await page.getByRole('tab', { name: /^Pokémon/ }).click()
  await tick(page, 'Jolteon').click()
  await selection.getByRole('button', { name: 'Compare 2 (2)' }).click()
  await expect(page.getByRole('dialog', { name: 'Compare' })).toBeVisible()
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('a floating Compare 2 button shows on the Pokémon tab, not in the header', async ({
    page,
  }) => {
    await searchFor(page, 'fast electric')
    await page.getByRole('tab', { name: /^Pokémon/ }).click()
    await expect(compareButton(page)).toBeVisible()
    await expect(
      page.getByRole('banner').getByRole('button', { name: 'Compare 2' }),
    ).toHaveCount(0)

    await page.getByRole('tab', { name: /^Moves/ }).click()
    await expect(compareButton(page)).toHaveCount(0)
  })

  test('the floating selection stays when going back to the home page, and ✕ cancels it', async ({
    page,
  }) => {
    await searchFor(page, 'fast electric')
    await page.getByRole('tab', { name: /^Pokémon/ }).click()
    await compareButton(page).click()
    await tick(page, 'Electrode').click()

    await page.getByRole('button', { name: 'Clear search' }).click()
    await expect(compareSelected(page, 1)).toBeVisible()

    await page.getByRole('button', { name: 'Cancel selection' }).click()
    await expect(compareSelected(page, 1)).toHaveCount(0)
  })
})
