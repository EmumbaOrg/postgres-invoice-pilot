import ChatInterface from '../../components/chat-interface/chat-interface';
import RecentActivity from "../../components/recent-activity/recent-activity"

const Dashboard = () => {
  return (
    <div className="container-fluid p-0">
      <div className='gradient-bg'>
      <ChatInterface/>
      <RecentActivity/>
      </div>
      </div>
    // <div className="table-responsive">
    //   <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
    //     <h1 className="h2">Dashboard</h1>
    //   </div>
    //     <CopilotChat/>
    // </div>
  );
};

export default Dashboard;