import { useEffect, useState } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";

import "./recent-activity.css";
import api from "../../api/Api";
import ActivityTile from "../activity-tile/activity-tile";

export default function RecentActivity() {
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const fetchRecentDocuments = async () => {
    try {
      const data = await api.documents.get("created");
      setRecentDocuments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const data = await api.activities.getRecent(3);
      console.log("Recent Activities:", data);
      setRecentActivities(data.logs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    fetchRecentDocuments();
    fetchRecentActivities();
  }, []);


  const handleMenuAction = (action, document) => {
    console.log(`${action} action for ${document}`);
  };

  return (
    <Container fluid className="py-5 section-wrapper">
      <Row className="gap-5 justify-content-center">
        {/* Left Section - Recent Activity */}
        <Col lg={6}>
          <div className="mb-4">
            <h3 className="fw-bold text-dark mb-2">Recent Activity</h3>
            <p className="text-muted">Some description text goes here</p>
          </div>
          <div>
                {loadingActivities &&    
             <div className="d-flex justify-content-center align-items-center" style={{ height: '20vh' }}>
                <Spinner animation="border" role="status" variant="primary">
                </Spinner>
              </div>
              }
            {recentActivities.map((activity, index) => (
              <ActivityTile
                key={index}
                icon={<i className="fa-solid fa-file-invoice"></i>}
                title={activity.message}
                timestamp={activity.timestamp}
                showMenu={false}
              />
            ))}
          </div>
        </Col>

        {/* Right Section - Recent Documents */}
        <Col lg={5}>
          <div className="mb-4">
            <h3 className="fw-bold text-dark mb-2">Recent Documents</h3>
            <p className="text-muted">Some description text goes here</p>
          </div>
          <div>
            {loadingDocuments &&    
             <div className="d-flex justify-content-center align-items-center" style={{ height: '20vh' }}>
                <Spinner animation="border" role="status" variant="primary">
                </Spinner>
              </div>
              }
            {recentDocuments.slice(0, 3).map((document, index) => (
              <ActivityTile
                key={index}
                icon={<i className="fa-solid fa-file-invoice"></i>}
                title={document.blob_name}
                timestamp={document.created}
                fileSize={document.size}
                showMenu={true}
                onMenuAction={(action) =>
                  handleMenuAction(action, document.title)
                }
              />
            ))}
          </div>
        </Col>
      </Row>
    </Container>
  );
}
