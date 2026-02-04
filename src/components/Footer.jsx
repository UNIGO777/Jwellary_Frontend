import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-[#2b2118] px-4 py-16 text-[#f5f5f0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-screen-2xl">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <h2 className="text-lg font-bold uppercase tracking-widest">EWITH</h2>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/70">
              Handcrafted jewellery designed for the modern soul. Born from a passion for detail and a love for the unique.
            </p>
            <div className="mt-6">
              <div className="flex gap-4">
                <a href="#" className="text-sm hover:text-white">Instagram</a>
                <a href="#" className="text-sm hover:text-white">Facebook</a>
                <a href="#" className="text-sm hover:text-white">Pinterest</a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">Shop</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link to="/products" className="hover:text-white hover:underline">Shop All</Link></li>
              <li><Link to="/products?sort=newest" className="hover:text-white hover:underline">New Arrivals</Link></li>
              <li><Link to="/bestsellers" className="hover:text-white hover:underline">Bestsellers</Link></li>
              <li><Link to="/products?sort=sale" className="hover:text-white hover:underline">Sale</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">Collections</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link to="/products?category=Rings" className="hover:text-white hover:underline">Rings</Link></li>
              <li><Link to="/products?category=Necklaces" className="hover:text-white hover:underline">Necklaces</Link></li>
              <li><Link to="/products?category=Earrings" className="hover:text-white hover:underline">Earrings</Link></li>
              <li><Link to="/products?category=Bracelets" className="hover:text-white hover:underline">Bracelets</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">Help</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link to="/shipping" className="hover:text-white hover:underline">Shipping & Returns</Link></li>
              <li><Link to="/faq" className="hover:text-white hover:underline">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-white hover:underline">Contact Us</Link></li>
              <li><Link to="/care" className="hover:text-white hover:underline">Jewellery Care</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/40 md:flex-row md:items-center">
          <div>&copy; 2024 Ewith Jewellery. All rights reserved.</div>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
