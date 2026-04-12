import { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import './App.css'
import Navbar from './components/navbar'
import About from './About';
import Home from './Home';
import FamilyDetails from './pages/FamilyDetails';
import AddFamily from './pages/family/AddFamily';
import MemberDetails from './pages/MemberDetails';
import AddMember from './pages/memberdetails/AddMember';
import ExistingFamilymem from './pages/memberdetails/ExistingFamilymem';
import ViewMembers from './pages/memberdetails/ViewMembers';
import Marriage from './pages/Marriage';
import AddMarriage from './pages/marriage/AddMarriage';
import ViewMarriage from './pages/marriage/ViewMarriage';
import SignIn from './pages/SignIn';
import SearchFamily from './pages/family/SearchFamily';
import SearchedFam from './pages/family/SearchedFam';
import Baptism from './pages/baptism';
import DeathRecords from './pages/DeathRecords'; // 🔺 Add this
import Subscription from './pages/Subscription';
import SearchBap from "./pages/baptism/SearchBap";
import NewBaptism from "./pages/baptism/NewBaptism";
import AddDeathRecord from './pages/death/AddDeathRecord'; // 🔺 Add this
import ViewDeathRecords from './pages/death/ViewDeathRecords'; // 🔺 Add this
import EditMember from './pages/memberdetails/EditMember';


// Back button — shown at the top of page content (not in navbar)
function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const hiddenPaths = ['/', '/SignIn', '/About'];
  if (hiddenPaths.includes(location.pathname)) return null;
  return (
    <div style={{ textAlign: 'left', padding: '0 20px 8px' }}>
      <button className="page-back-btn" onClick={() => navigate(-1)} title="Go Back">
        ← Back
      </button>
    </div>
  );
}

function App() {
  const navigate = useNavigate()

  const isTokenValid = (token) => {
    if (!token) return false;
    try {
      const decoded = jwtDecode(token);
      if (!decoded?.exp) return false;
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp > now;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!isTokenValid(token)) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      navigate('/SignIn');
    }
  }, [navigate])

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (input, init = {}) => {
      const token = localStorage.getItem('token');
      const headers = new Headers(init.headers || {});

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const response = await originalFetch(input, {
        ...init,
        headers
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        if (window.location.pathname !== '/SignIn') {
          navigate('/SignIn');
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [navigate]);

  return (
    <>
      <Navbar />

      <div style={{ paddingTop: '120px' }}>
        <BackButton />
        <Routes>
          <Route path="/SignIn" element={<SignIn />} />
          <Route path="/" element={<Home />} />
          <Route path="/About" element={<About />} />
          <Route path="/FamilyDetails" element={<FamilyDetails />} />
          <Route path="/FamilyDetails/:familyId" element={<FamilyDetails />} />
          <Route path="/AddFamily" element={<AddFamily />} />
          <Route path="/MemberDetails" element={<MemberDetails />} />
          <Route path="/MemberDetails/:memberId" element={<MemberDetails />} />
          <Route path="/AddMember" element={<AddMember />} />
          <Route path="/ExistingFamilymem" element={<ExistingFamilymem />} />
          <Route path="/ViewMembers" element={<ViewMembers />} />
          <Route path="/EditMember" element={<EditMember />} />
          <Route path="/EditMember/:memberId" element={<EditMember />} />
          <Route path="/Marriage" element={<Marriage />} />
          <Route path="/Marriage/:marriageId" element={<Marriage />} />
          <Route path="/AddMarriage" element={<AddMarriage />} />
          <Route path="/ViewMarriage" element={<ViewMarriage />} />
          <Route path="/ViewMarriage/:marriageId" element={<ViewMarriage />} />

          <Route path="/SearchFamily" element={<SearchFamily />} />
          <Route path="/family/:family_number" element={<FamilyDetails />} />
          <Route path="/baptism" element={<Baptism />} />
          <Route path="/death-records" element={<DeathRecords />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/SearchBap" element={<SearchBap />} />
          <Route path="/NewBaptism" element={<NewBaptism />} />
          <Route path="/AddDeathRecord" element={<AddDeathRecord />} />
          <Route path="/ViewDeathRecords" element={<ViewDeathRecords />} />
          <Route path="/SearchedFam" element={<SearchedFam />} />
        </Routes>
      </div>

    </>
  );
}

export default App
