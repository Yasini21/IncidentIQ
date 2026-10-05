import CreateIncident from "../components/CreateIncident";
import { useNavigate } from "react-router-dom";

function CreatePage() {
  const navigate = useNavigate();

  return <CreateIncident onCreated={() => navigate("/")} />;
}

export default CreatePage;