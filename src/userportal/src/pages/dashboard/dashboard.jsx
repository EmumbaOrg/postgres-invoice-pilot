import ChatInterface from '../../components/chat-interface/chat-interface';
import RecentActivity from '../../components/recent-activity/recent-activity';


const Dashboard = () => {
  return (
  <div className="container-fluid p-0">
      <div className='gradient-bg'>
      <ChatInterface/>
      <RecentActivity/>
      </div>
      </div>
  );
};

export default Dashboard;