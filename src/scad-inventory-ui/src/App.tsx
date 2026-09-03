import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import { AppLayout } from './components/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { InventoryPage } from './pages/InventoryPage'
import { LoginPage } from './pages/LoginPage'
import { NewProductPage } from './pages/NewProductPage'
import { NewStockPage } from './pages/NewStockPage'
import { NewTransferPage } from './pages/NewTransferPage'
import { NewWarehousePage } from './pages/NewWarehousePage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { ProductsPage } from './pages/ProductsPage'
import { WarehousesPage } from './pages/WarehousesPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/new" element={<NewProductPage />} />
          <Route path="/products/:code" element={<ProductDetailPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/inventory/new" element={<NewStockPage />} />
          <Route path="/transfers/new" element={<NewTransferPage />} />
          <Route path="/warehouses" element={<WarehousesPage />} />
          <Route path="/warehouses/new" element={<NewWarehousePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
