import { Link } from 'react-router-dom'

function Footer() {
  const columns = [
    ['About', 'How Markethub works', 'Careers'],
    ['Vendors', 'Vendor sign-up', 'Seller resources'],
    ['Support', 'Customer support', 'Returns'],
    ['Categories', 'Fashion', 'Electronics'],
  ]

  return (
    <footer className="footer">
      <div className="storefront-container">
        <div className="footer-grid">
          {columns.map((column) => (
            <div key={column[0]}>
              <h3 className="admin-section-title">{column[0]}</h3>
              {column.slice(1).map((item) => <p className="muted-copy" key={item}>{item}</p>)}
            </div>
          ))}
        </div>
        <p className="muted-copy" style={{ marginTop: 28 }}>© 2026 Markethub. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
