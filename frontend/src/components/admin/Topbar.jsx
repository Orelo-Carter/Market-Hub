function Topbar({
  title,
  kicker = 'Approval controls and marketplace governance',
  userName = 'Super Admin',
  userRole = 'Platform owner',
  initials = 'SA',
}) {
  return (
    <header className="admin-topbar">
      <div className="admin-title-block">
        <h1 className="admin-page-title">{title}</h1>
        <p className="admin-page-kicker">{kicker}</p>
      </div>

      <div className="admin-avatar" aria-label="Signed in admin">
        <div className="admin-avatar-copy">
          <span className="admin-avatar-name">{userName}</span>
          <span className="admin-avatar-role">{userRole}</span>
        </div>
        <span className="admin-avatar-initials">{initials}</span>
      </div>
    </header>
  )
}

export default Topbar
