import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const AnalyticsPage = () => {
  const [data, setData] = useState({});
  const token = localStorage.getItem("token");

  //  Pie Chart data
  const chartData = [
    { name: "Open", value: data.open || 0 },
    { name: "In progress", value: data.inProgress || 0 },
    { name: "Resolved", value: data.resolved || 0 },
  ];

  const severityData = [
    { name: "P1", value: data.p1 || 0 },
    { name: "P2", value: data.p2 || 0 },
    { name: "P3", value: data.p3 || 0 },
    { name: "P4", value: data.p4 || 0 },
  ];

  const fetchAnalytics = async () => {
    const res = await fetch("http://localhost:5000/api/incidents/analytics", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();
    setData(result);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">

      <h2 className="text-xl font-bold">📊 Analytics Dashboard</h2>

      {/* 🔹 Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <div className="bg-white p-4 rounded shadow text-center">
          <p>Total</p>
          <h2 className="text-xl font-bold">{data.total || 0}</h2>
        </div>

        <div className="bg-white p-4 rounded shadow text-center">
          <p>Open</p>
          <h2 className="text-xl font-bold text-red-600">
            {data.open || 0}
          </h2>
        </div>

        <div className="bg-white p-4 rounded shadow text-center">
          <p>Resolved</p>
          <h2 className="text-xl font-bold text-green-600">
            {data.resolved || 0}
          </h2>
        </div>

        <div className="bg-white p-4 rounded shadow text-center">
          <p>P1</p>
          <h2 className="text-xl font-bold text-yellow-600">
            {data.p1 || 0}
          </h2>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-lg font-semibold mb-4">
            Incident Status Distribution
          </h3>

          <PieChart width={300} height={300}>
            <Pie
              data={chartData}
              dataKey="value"
              outerRadius={100}
              label
            >
              {chartData.map((entry, index) => (
                <Cell key={index} />
              ))}
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-lg font-semibold mb-4">
            Severity Distribution
          </h3>

          <BarChart width={350} height={300} data={severityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </div>

      </div>

    </div>
  );
};

export default AnalyticsPage;