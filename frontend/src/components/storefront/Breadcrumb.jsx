import { Link } from 'react-router-dom'

function Breadcrumb({ items = [] }) {
  return (
    <div className="breadcrumb">
      <Link to="/">Home</Link>
      {items.map((item) => (
        <span key={item.label}>
          / {item.to ? <Link to={item.to}>{item.label}</Link> : item.label}
        </span>
      ))}
    </div>
  )
}

export default Breadcrumb
