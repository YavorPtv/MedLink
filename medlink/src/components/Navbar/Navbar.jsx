import { Link } from 'react-router-dom';

export default function Navbar(){
    return (
        <nav>
            <div>
                <Link to="/" >MedLink</Link>
            </div>
            <ul>
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/call">Video Call</Link></li>
                <li><Link to="/notes">Notes</Link></li>
                <li><Link to="/profile">Profile</Link></li>
            </ul>
        </nav>
    )
}