import { Outlet } from 'react-router-dom'
import Footer from '../../components/storefront/Footer'
import Header from '../../components/storefront/Header'

function StorefrontLayout() {
  return (
    <div className="storefront-shell">
      <Header />
      <main className="storefront-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default StorefrontLayout
