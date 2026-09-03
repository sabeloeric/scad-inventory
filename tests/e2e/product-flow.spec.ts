import { expect, test } from '@playwright/test'

test('user logs in, creates a product, and opens its detail view', async ({ page }) => {
  const productCode = `E2E${Date.now().toString(36)}`.toUpperCase()
  const description = `Playwright product ${productCode}`

  await page.goto('/login')
  await page.getByLabel('Username').fill('jhb@scad.local')
  await page.getByLabel('Password').fill('Password123!')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible()
  await page.getByRole('link', { name: 'Create product' }).first().click()

  await page.getByLabel('Product code').fill(` ${productCode.toLowerCase()} `)
  await page.getByLabel('Description').fill(description)
  await page.getByRole('button', { name: 'Create product' }).click()

  await expect(page.getByText('Product created successfully.', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: productCode })).toBeVisible()
  await expect(page.getByText(description)).toBeVisible()

  await page.getByRole('link', { name: 'Back to products' }).click()
  const productRow = page.getByRole('row', { name: new RegExp(productCode) })
  await expect(productRow).toContainText(description)
  await productRow.getByRole('link', { name: 'View details' }).click()

  await expect(page.getByRole('heading', { name: productCode })).toBeVisible()
  await expect(page.getByText(description)).toBeVisible()
})
