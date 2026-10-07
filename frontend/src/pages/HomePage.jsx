import { motion } from 'framer-motion'
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingCart,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'

function HomePage() {
  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'About', to: '/about' },
    { label: 'Flash sale', to: '/flash-sale' },
  ]

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <motion.header
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-3 text-slate-950"
            aria-label="Markethub home"
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-600 text-lg font-black text-white shadow-sm">
              M
            </span>
            <span className="text-2xl font-black tracking-normal">Markethub</span>
          </Link>

          <motion.form
            whileFocusWithin={{ scale: 1.01 }}
            className="hidden min-w-0 flex-1 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-inner md:flex"
          >
            <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search products, brands, and vendors"
              className="min-w-0 flex-1 bg-transparent px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
              aria-label="Search products"
            />
            <button
              type="submit"
              className="rounded-md bg-slate-950 px-5 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Search
            </button>
          </motion.form>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Link
              to="/signin"
              className="rounded-md px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Sign up
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="relative grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              className="relative grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              aria-label="Cart"
              title="Cart"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-xs font-black text-white">
                0
              </span>
            </button>
            <button
              className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              aria-label="Profile"
              title="Profile"
            >
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-950 text-white">
          <nav className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="flex shrink-0 items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold transition hover:bg-emerald-500"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
              Browse categories
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </motion.button>

            <div className="flex items-center gap-1 pl-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="whitespace-nowrap rounded-md px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        <div className="border-t border-slate-100 px-4 py-3 md:hidden">
          <form className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search Markethub"
              className="min-w-0 flex-1 bg-transparent px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
              aria-label="Search products"
            />
          </form>
        </div>
      </motion.header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.section
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.4, ease: 'easeOut' }}
          className="flex min-h-[360px] items-center rounded-lg border border-slate-200 bg-white px-6 py-10 shadow-sm"
        >
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-black uppercase tracking-normal text-emerald-700">
              Multi-vendor marketplace
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl">
              Shop trusted vendors from one smart marketplace.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              Discover products, compare vendors, and check out across stores in one cart.
            </p>
          </div>
        </motion.section>
      </main>
    </div>
  )
}

export default HomePage
