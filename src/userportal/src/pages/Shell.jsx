// src/Shell.js
import  { useEffect,useState } from 'react';
import {  Route, Routes, NavLink, useLocation } from 'react-router-dom';

import { Dashboard } from './dashboard';
import { DocumentList } from './documents';

import { DeliverableCreate, DeliverableEdit } from './deliverables';
import { InvoiceList, InvoiceCreate, InvoiceEdit } from './invoices';
import { InvoiceLineItemCreate, InvoiceLineItemEdit } from './invoiceLineItems';
import { MilestoneCreate, MilestoneEdit } from './milestones';
import { SOWList,  SOWEdit } from './sows';
import { VendorList, VendorEdit, VendorCreate, VendorView } from './vendors';
import CopilotChat from '../components/CopilotChat';
import SideDrawer from '../components/side-drawer/side-drawer';

const Shell = ({onLogout}) => {
  const [showDrawer, setShowDrawer] = useState(false);
  const location = useLocation();

  //const userName = "John Doe"; // Replace with actual user name
  //const userAvatar = "user-avatar.svg"; // Replace with actual avatar URL

  // useEffect(() => {
  //   const handleResize = () => {
  //     const sidebarMenu = document.getElementById('sidebarMenu');
  //     if (!sidebarMenu.classList.contains('offcanvas')) { //window.innerWidth >= 768) {
  //       sidebarMenu.classList.remove('collapse');
  //       sidebarMenu.classList.remove('show');
  //     }
  //   };

  //   window.addEventListener('resize', handleResize);
  //   handleResize(); // Call once to set initial state

  //   return () => {
  //     window.removeEventListener('resize', handleResize);
  //   };
  // }, []);

  useEffect(() => {
    const navLinks = document.querySelectorAll('#sidebarMenu .nav-link');
    const hideSidebar = () => {
      const sidebarMenu = document.getElementById('sidebarMenu');
      sidebarMenu.classList.remove('show');
    };
    navLinks.forEach(link => {
      link.addEventListener('click', hideSidebar);
    });
    return () => {
      navLinks.forEach(link => {
        link.removeEventListener('click', hideSidebar);
      });
    };
  }, []);

  const onAskAI = () =>{
    setShowDrawer(true);
  }
  const handleCloseAIdrawer = () =>{
    setShowDrawer(false);
  }
 
  return (
    <>
       <header className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top shadow-sm">
      <div className="container-fluid px-3">
        {/* Logo and Brand */}
        <a className="navbar-brand d-flex align-items-center me-4" href="#">
          <img src="/logo.png" alt="Woodgrove Bank" className="me-2" style={{ height: "32px", width: "auto" }} />
          <span className="fw-semibold text-dark fs-5">Woodgrove Bank</span>
        </a>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto">
            <li className="nav-item me-4">
            <NavLink
  className={
    `nav-link d-flex align-items-center gap-2 px-2 py-2 position-relative ${
      (location.pathname === '/' || location.pathname.startsWith('/chats'))
        ? 'text-primary active-nav fw-bold'
        : 'text-secondary'
    }`
  }
  to="/"
>
                <i className="fas fa-home"></i>
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item me-4">
              <NavLink
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-2 px-2 py-2  position-relative ${
                    isActive ? "text-primary active-nav fw-bold" : "text-secondary"
                  }`
                }
                to="/vendors"
              >
                <i className="fas fa-briefcase"></i>
                <span>Vendors</span>
              </NavLink>
            </li>
            <li className="nav-item me-4">
              <NavLink
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-2 px-2 py-2  position-relative ${
                    isActive ? "text-primary active-nav fw-bold" : "text-secondary"
                  }`
                }
                to="/sows"
              >
                <i className="fas fa-file-contract"></i>
                <span>SOWs</span>
              </NavLink>
            </li>
            <li className="nav-item me-4">
              <NavLink
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-2 px-2 py-2  position-relative ${
                    isActive ? "text-primary active-nav fw-bold" : "text-secondary"
                  }`
                }
                to="/invoices"
              >
                <i className="fas fa-file-invoice"></i>
                <span>Invoices</span>
              </NavLink>
            </li>
        
          </ul>

          {/* Right side - Sign out */}
          <div className="navbar-nav">
          <a
                className="nav-link d-flex align-items-center gap-2 p-2 text-primary fw-bold bordered-button"
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onAskAI()
                }}
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <span>Ask AI</span>
              </a>
            <a
              className="nav-link text-primary fw-bold px-3 py-2 transition-all"
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onLogout()
              }}
            >
              Sign out
            </a>
          </div>
        </div>
      </div>
    </header>
      <div className="container-fluid">
        <div className="row">
          {/* <div className="col-md-3 col-lg-2 p-0"> */}
            {/* <div className={`sidebar offcanvas-md offcanvas-start `} id="sidebarMenu" aria-labelledby="sidebarMenuLabel"> */}
              {/* <div className="offcanvas-header">
              </div> */}
              {/* <div className="offcanvas-body d-md-flex flex-column p-0 pt-lg-3 overflow-y-auto">
                <ul className="nav flex-column">
                  <li className="nav-item">
                    <NavLink className="nav-link d-flex align-items-center gap-2" to="/" end>
                      <i className="fas fa-home"></i> Dashboard
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link d-flex align-items-center gap-2" to="/vendors">
                      <i className="fas fa-briefcase"></i> Vendors
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link d-flex align-items-center gap-2" to="/sows">
                      <i className="fas fa-file-contract"></i> SOWs
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link d-flex align-items-center gap-2" to="/invoices">
                      <i className="fas fa-file-invoice"></i> Invoices
                    </NavLink>
                  </li>
                </ul>
                <hr />
                <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-body-secondary text-uppercase">
                  Tools
                </h6>
                <ul className="nav flex-column">
                  <li className="nav-item">
                    <NavLink className="nav-link d-flex align-items-center gap-2" to="/documents">
                      <i className="fas fa-file-alt"></i> Documents
                    </NavLink>
                  </li>
                </ul>

              </div> */}
         
            {/* </div> */}
          {/* </div> */}
          <main className="col-lg-12">
            <Routes>
              <Route exact path="/" element={<Dashboard />} />
              <Route exact path="/chats" element={<CopilotChat/>}/>
              <Route path="/documents" element={<DocumentList />} />
              
              <Route path="/deliverables/create/:milestoneId" element={<DeliverableCreate />} />
              <Route path="/deliverables/:id" element={<DeliverableEdit />} />
              
              <Route path="/invoices" element={<InvoiceList />} />
              <Route path="/invoices/create" element={<InvoiceCreate />} />
              <Route path="/invoices/create/:vendorId" element={<InvoiceCreate />} />
              <Route path="/invoices/:id" element={<InvoiceEdit />} />

              <Route path="/invoice-line-items/create/:invoiceId" element={<InvoiceLineItemCreate />} />
              <Route path="/invoice-line-items/:id" element={<InvoiceLineItemEdit />} />

              <Route path="/milestones/create/:sowId" element={<MilestoneCreate />} />
              <Route path="/milestones/:id" element={<MilestoneEdit />} />
             
              <Route path="/sows" element={<SOWList />} />
              {/* <Route path="/sows/create" element={<SOWCreate />} /> */}
              {/* <Route path="/sows/create/:vendorId" element={<SOWCreate />} /> */}
              <Route path="/sows/:id" element={<SOWEdit />} />

              <Route path="/vendors" element={<VendorList />} />
              <Route path="/vendors/create" element={<VendorCreate />} />
              <Route path="/vendors/:id" element={<VendorEdit />} />
              <Route path="/vendors/view/:id" element={<VendorView />} />
            </Routes>
          </main>
        </div>
      </div>
      {showDrawer &&
      <SideDrawer handleCloseAIdrawer={handleCloseAIdrawer} showDrawer={showDrawer}/>
      }
    </>
  );
}

export default Shell;