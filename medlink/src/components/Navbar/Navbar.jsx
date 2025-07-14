import { Link } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg custom_nav-container">
            <a className="navbar-brand" href="/">
                <span>Orthoc</span>
            </a>

            <button
                className="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent"
                aria-expanded="false"
                aria-label="Toggle navigation"
            >
                <span></span>
            </button>

            <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav">
                    <li className="nav-item active">
                        <Link className="nav-link" to="/">
                            Home
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/call">
                            Start Consultation
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/records">
                            Your records
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/profile">
                            Profile
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/login">
                            Login
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/register">
                            Register
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to="/logout">
                            Logout
                        </Link>
                    </li>
                    <form className="form-inline">
                        <button className="btn my-2 my-sm-0 nav_search-btn" type="submit">
                            <i className="fa fa-search" aria-hidden="true"></i>
                        </button>
                    </form>
                </ul>
            </div>
        </nav>
        // <nav>
        //     <div>
        //         <Link to="/" >MedLink</Link>
        //     </div>
        //     <ul>
        //         <li><Link to="/dashboard">Dashboard</Link></li>
        //         <li><Link to="/call">Video Call</Link></li>
        //         <li><Link to="/notes">Notes</Link></li>
        //         <li><Link to="/profile">Profile</Link></li>
        //     </ul>
        // </nav>
    )
}