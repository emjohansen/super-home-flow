
import { Navigate } from 'react-router-dom';

const Index = () => {
  // Redirect to chores page instead of login page
  return <Navigate to="/chores" />;
};

export default Index;
