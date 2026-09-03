import { expect, test } from '@playwright/test'

test('user manages the warehouse catalogue, stock, transfers, and locations', async ({ page }) => {
  const productCode = `E2E${Date.now().toString(36)}`.toUpperCase()
  const description = `Playwright product ${productCode}`
  const warehouseCode = `W${Date.now().toString(36).slice(-6)}`.toUpperCase()

  await page.goto('/login')
  await page.getByLabel('Username').fill('jhb@scad.local')
  await page.getByLabel('Password').fill('Password123!')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('heading', { name: 'Warehouse overview' })).toBeVisible()

  const statGrid = page.locator('[aria-label="Warehouse summary"]')
  await expect(statGrid.getByText('Products', { exact: true })).toBeVisible()
  await expect(statGrid.getByText('Stock positions', { exact: true })).toBeVisible()
  await expect(statGrid.getByText('Units on hand', { exact: true })).toBeVisible()
  await expect(statGrid.getByText('Warehouses', { exact: true })).toBeVisible()
  const warehouseStatValue = statGrid.locator('.stat-card', { hasText: 'Warehouses' }).locator('.stat-value')
  const initialWarehouseCount = Number(await warehouseStatValue.innerText())

  await page.getByRole('link', { name: 'Products' }).click()
  await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible()
  await page.getByRole('link', { name: 'Create product' }).first().click()

  await page.getByLabel('Product code').fill(` ${productCode.toLowerCase()} `)
  await page.getByLabel('Description').fill(description)
  await page.getByRole('button', { name: 'Create product' }).click()

  await expect(page.getByText('Product created successfully.', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: productCode })).toBeVisible()
  await expect(page.getByRole('article').getByText(description)).toBeVisible()

  await page.getByRole('link', { name: 'Back to products' }).click()
  const productRow = page.getByRole('row', { name: new RegExp(productCode) })
  await expect(productRow).toContainText(description)
  await productRow.getByRole('link', { name: 'View details' }).click()

  await expect(page.getByRole('heading', { name: productCode })).toBeVisible()
  await expect(page.getByRole('article').getByText(description)).toBeVisible()

  await page.getByRole('link', { name: 'Receive stock' }).first().click()
  await expect(page.getByRole('heading', { name: 'Receive stock' })).toBeVisible()
  await expect(page.getByLabel('Product')).toHaveValue(productCode)
  await page.getByLabel('Warehouse').selectOption('JHB')
  await page.getByLabel('Quantity').fill('100')
  await page.getByRole('button', { name: 'Receive stock' }).click()

  await expect(page.getByRole('heading', { name: 'Stock received' })).toBeVisible()
  await expect(page.getByText('100 units', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'View inventory' }).click()

  const stockedProductRow = page.getByRole('row', { name: new RegExp(productCode) })
  await expect(stockedProductRow).toContainText('100')
  await page.getByRole('link', { name: 'Transfer stock' }).click()
  await expect(page.getByRole('heading', { name: 'Transfer stock' })).toBeVisible()
  await page.getByLabel('Product').selectOption(productCode)
  await page.getByLabel('Source warehouse').selectOption('JHB')
  await page.getByLabel('Destination warehouse').selectOption('CPT')
  await page.getByLabel('Quantity to transfer').fill('30')
  await page.getByRole('button', { name: 'Transfer stock' }).click()

  await expect(page.getByRole('heading', { name: 'Transfer complete' })).toBeVisible()
  await expect(page.getByText('70 remaining')).toBeVisible()
  await expect(page.getByText('30 on hand')).toBeVisible()
  await page.getByRole('link', { name: 'View inventory' }).click()
  await expect(page.getByRole('row', { name: new RegExp(productCode) })).toContainText('70')

  await page.getByRole('link', { name: 'Receive stock' }).click()
  await expect(page.getByRole('heading', { name: 'Receive stock' })).toBeVisible()
  await page.getByLabel('Product').selectOption(productCode)
  await page.getByLabel('Warehouse').selectOption('JHB')
  await page.getByLabel('Quantity').fill('50')
  await page.getByRole('button', { name: 'Receive stock' }).click()

  await expect(page.getByRole('heading', { name: 'Stock received' })).toBeVisible()
  await expect(page.getByText('50 units were added.')).toBeVisible()
  await expect(page.getByText('120 units')).toBeVisible()
  await page.getByRole('link', { name: 'View inventory' }).click()
  await expect(page.getByRole('row', { name: new RegExp(productCode) })).toContainText('120')

  await page.getByRole('link', { name: 'Warehouses' }).click()
  await expect(page.getByRole('heading', { name: 'Warehouses' })).toBeVisible()
  await page.getByRole('link', { name: 'Create warehouse' }).click()
  await page.getByLabel('Warehouse code').fill(warehouseCode.toLowerCase())
  await page.getByLabel('Warehouse name').fill(`Playwright ${warehouseCode} Warehouse`)
  await page.getByRole('button', { name: 'Create warehouse' }).click()

  await expect(page.getByRole('heading', { name: 'Warehouses' })).toBeVisible()
  await expect(page.getByText(`Warehouse ${warehouseCode} was created successfully.`)).toBeVisible()
  await expect(page.getByRole('heading', { name: `Playwright ${warehouseCode} Warehouse` })).toBeVisible()

  await page.getByRole('link', { name: 'Dashboard' }).click()
  await expect(page.getByRole('heading', { name: 'Warehouse overview' })).toBeVisible()
  await expect(warehouseStatValue).toHaveText(String(initialWarehouseCount + 1))
  await expect(page.getByRole('heading', { name: 'Current stock' })).toBeVisible()
  await expect(page.getByRole('row', { name: new RegExp(productCode) })).toContainText('120')
  await expect(page.getByRole('link', { name: 'New transfer' })).toBeVisible()
})
