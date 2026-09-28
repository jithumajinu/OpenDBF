// import { BrowserRouter as Router, Routes, Route } from "react-router";
import { HashRouter as Router, Routes, Route } from "react-router";
import Ecommerce from "@pages/Dashboard/Ecommerce";
import Stocks from "@pages/Dashboard/Stocks";
import Crm from "@pages/Dashboard/Crm";
import Marketing from "@pages/Dashboard/Marketing";
import Analytics from "@pages/Dashboard/Analytics";
import SignIn from "@pages/AuthPages/SignIn";
import SignUp from "@pages/AuthPages/SignUp";

import UserProfiles from "@pages/UserProfiles";
import Carousel from "@pages/UiElements/Carousel";

import Videos from "@pages/UiElements/Videos";
import Images from "@pages/UiElements/Images";
import Alerts from "@pages/UiElements/Alerts";
import Badges from "@pages/UiElements/Badges";
import Pagination from "@pages/UiElements/Pagination";
import Avatars from "@pages/UiElements/Avatars";
import Buttons from "@pages/UiElements/Buttons";
import ButtonsGroup from "@pages/UiElements/ButtonsGroup";
import Notifications from "@pages/UiElements/Notifications";
import LineChart from "@pages/Charts/LineChart";
import BarChart from "@pages/Charts/BarChart";
import PieChart from "@pages/Charts/PieChart";
import Invoices from "@pages/Invoices";

import FileManager from "@pages/FileManager";
import Calendar from "@pages/Calendar";

import PricingTables from "@pages/PricingTables";
import Faqs from "@pages/Faqs";
import Chats from "@pages/Chat/Chats";

import Blank from "@pages/Blank";

import BreadCrumb from "@pages/UiElements/BreadCrumb";
import Cards from "@pages/UiElements/Cards";
import Dropdowns from "@pages/UiElements/Dropdowns";
import Links from "@pages/UiElements/Links";
import Lists from "@pages/UiElements/Lists";
import Popovers from "@pages/UiElements/Popovers";
import Progressbar from "@pages/UiElements/Progressbar";
import Ribbons from "@pages/UiElements/Ribbons";
import Spinners from "@pages/UiElements/Spinners";
import Tabs from "@pages/UiElements/Tabs";
import Tooltips from "@pages/UiElements/Tooltips";
import Modals from "@pages/UiElements/Modals";
import ResetPassword from "@pages/AuthPages/ResetPassword";
import TwoStepVerification from "@pages/AuthPages/TwoStepVerification";
import AppLayout from "./layout/AppLayout";
import AlternativeLayout from "./layout/AlternativeLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Saas from "@pages/Dashboard/Saas";
import Logistics from "@pages/Dashboard/Logistics";
import TextGeneratorPage from "@pages/Ai/TextGenerator";
import ImageGeneratorPage from "@pages/Ai/ImageGenerator";
// import CodeGeneratorPage from "@pages/Ai/CodeGenerator";
import VideoGeneratorPage from "@pages/Ai/VideoGenerator";
import ProductList from "@pages/Ecommerce/ProductList";
import AddProduct from "@pages/Ecommerce/AddProduct";
import Billing from "@pages/Ecommerce/Billing";
import SingleInvoice from "@pages/Ecommerce/SingleInvoice";
import CreateInvoice from "@pages/Ecommerce/CreateInvoice";
import Transactions from "@pages/Ecommerce/Transactions";
import SingleTransaction from "@pages/Ecommerce/SingleTransaction";


import PrivateRoute from "./components/auth/PrivateRoute";

import Home from "@pages/Dashboard/Home";




// Case Manager
import MatterCaseManager from "@pages/CaseManager/MatterCaseManager";
import MatterListPage from "@pages/CaseManager/MatterList/MatterListPage";





export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index path="/" element={<Home />} />
            <Route index path="/vd" element={<Home />} />
            <Route index path="/vd/dashboard" element={<Home />} />

            {/* matters */}
            <Route path="/vd/matter" element={<MatterListPage />} />
            <Route path="/vd/matter/new" element={<MatterCaseManager />} />
            <Route path="/vd/matter/:matterKey" element={<MatterCaseManager />} />
            
          </Route>

        </Routes>
      </Router>
    </>
  );
}
