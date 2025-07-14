import { Link } from 'react-router-dom';
import Navbar from "../Navbar/Navbar";

export default function LandingPage() {
    return (
        <div className="hero_area">
            <div className="hero_bg_box">
                <img src="/images/hero-bg.png" alt="" />
            </div>

            
            
            <section className="slider_section">
                <div id="customCarousel1" className="carousel slide" data-ride="carousel">
                    <div className="carousel-inner">
                        <div className="carousel-item active">
                            <div className="container">
                                <div className="row">
                                    <div className="col-md-7">
                                        <div className="detail-box">
                                            <h1>We Provide Best Healthcare</h1>
                                            <p>
                                                Explicabo esse amet tempora quibusdam laudantium, laborum eaque
                                                magnam fugiat hic? Esse dicta aliquid error repudiandae earum
                                                suscipit fugiat molestias, veniam, vel architecto veritatis delectus
                                                repellat modi impedit sequi.
                                            </p>
                                            <div className="btn-box">
                                                <Link to="#" className="btn1">
                                                    Read More
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}