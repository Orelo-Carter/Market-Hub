import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AdminDashboard from './pages/admin/AdminDashboard'
import SignIn from './pages/auth/SignIn'
import SignUp from './pages/auth/SignUp'
import SetPassword from './pages/auth/SetPassword'
import VendorDashboard from './pages/vendor/VendorDashboard'
import StorefrontLayout from './pages/storefront/StorefrontLayout'
import StorefrontHome from './pages/storefront/Home'
import ListingPage from './pages/storefront/ListingPage'
import ProductDetail from './pages/storefront/ProductDetail'
import VendorStorefront from './pages/storefront/VendorStorefront'
import Cart from './pages/storefront/Cart'
import Checkout from './pages/storefront/Checkout'
import CheckoutVerify from './pages/storefront/CheckoutVerify'
import OrderHistory from './pages/storefront/OrderHistory'
import './App.css'

function PlaceholderPage({ title }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fb] px-4">
      <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-black uppercase tracking-normal text-emerald-700">
          Markethub
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-950">
          {title}
        </h1>
      </section>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<StorefrontHome />} />
          <Route path="/category/:slug" element={<ListingPage mode="category" />} />
          <Route path="/search" element={<ListingPage mode="search" />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/store/:slug" element={<VendorStorefront />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/verify" element={<CheckoutVerify />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/account" element={<PlaceholderPage title="Account settings" />} />
        </Route>
        <Route path="/about" element={<PlaceholderPage title="About" />} />
        <Route path="/flash-sale" element={<PlaceholderPage title="Flash sale" />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/vendor/*" element={<VendorDashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
