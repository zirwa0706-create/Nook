import RightPanel from '../feed/RightPanel'
import './PageWrapper.css'

export default function PageWrapper({ children }) {
  return (
    <div className="page-wrapper">
      <div className="page-main">
        {children}
      </div>
      <div className="page-right">
        <RightPanel />
      </div>
    </div>
  )
}
