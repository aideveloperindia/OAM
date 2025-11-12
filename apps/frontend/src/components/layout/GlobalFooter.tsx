import { Link } from 'react-router-dom'
const COMBINED_LOGO = '/assets/college-logo.png'

export const GlobalFooter = () => {
  return (
    <footer
      id="collegeattend-footer"
      className="border-t border-slate-200 bg-white"
    >
      <div className="mx-auto flex w-full flex-col gap-4 px-4 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-8">
        <div className="flex items-center gap-3">
          <img
            src={COMBINED_LOGO}
            alt="Sree Chaitanya Institute of Technological Sciences crest"
            className="h-10 w-10 rounded"
          />
          <span className="font-medium text-slate-800">
            Serving Sree Chaitanya Institute of Technological Sciences
          </span>
        </div>
        <nav className="flex items-center gap-4 text-slate-500">
          <Link className="hover:text-primary transition-colors" to="/#about">
            About
          </Link>
          <Link
            className="hover:text-primary transition-colors"
            to="/#features"
          >
            Features
          </Link>
          <Link
            className="hover:text-primary transition-colors"
            to="/privacy"
          >
            Privacy
          </Link>
          <Link className="hover:text-primary transition-colors" to="/help">
            Instructions
          </Link>
        </nav>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Link
            to="/quote-standard"
            className="rounded-full border border-primary px-4 py-2 text-center text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Quotation — Standard
          </Link>
          <Link
            to="/quote-advanced"
            className="rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Quotation — Advanced
          </Link>
        </div>
      </div>
    </footer>
  )
}

