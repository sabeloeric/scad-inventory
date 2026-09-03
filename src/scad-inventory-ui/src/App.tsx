import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { NewProductPage } from './pages/NewProductPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { ProductsPage } from './pages/ProductsPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/new" element={<NewProductPage />} />
          <Route path="/products/:code" element={<ProductDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  )
}

export default App
