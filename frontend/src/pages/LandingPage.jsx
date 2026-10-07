import bgImage from "../assets/LandingPage.png";
import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div
      className="landing vh-100 d-flex flex-column justify-content-center align-items-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="text-center text-dark landing-card">
        <h1 className="display-1 fw-bold">FoodNest</h1>

        <p className="fs-4">Give every food item a place, and every ingredient a purpose.
        </p>

        <p className="lead">Track &nbsp;•&nbsp; Manage &nbsp;•&nbsp; Save &nbsp;•&nbsp; Consume</p>

        <div className="mt-4 d-flex justify-content-center gap-3 flex-wrap">
          <Link to="/register" className="btn btn-success btn-lg landing-btn">
            Register
          </Link>
          <Link to="/login" className="btn btn-warning btn-lg landing-btn">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
