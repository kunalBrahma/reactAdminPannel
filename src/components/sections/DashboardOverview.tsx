import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { DollarSign, ShoppingCart, Users, Package } from "lucide-react";

const DashboardOverview = () => {
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    customers: 0
  });
  const [salesData, setSalesData] = useState<{ date: string; orders: number; revenue: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ id: any; type: string; title: string; description: string; time: string; customer: string; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch orders using the same endpoint as the History table
        const response = await fetch("http://localhost:5000/api/orders");
        
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        
        const data = await response.json();
        const orders = data.orders;
        
        // Calculate stats from orders
        const stats = {
          totalOrders: orders.length,
          totalRevenue: orders.reduce((sum: number, order: { total: any; }) => sum + parseFloat(order.total || 0), 0),
          pendingOrders: orders.filter((order: { status: string; }) => order.status === "Pending").length,
          completedOrders: orders.filter((order: { status: string; }) => order.status === "Completed").length,
          cancelledOrders: orders.filter((order: { status: string; }) => order.status === "Cancelled").length,
          customers: new Set(orders.map((order: { guest_email: any; }) => order.guest_email)).size
        };
        
        // Group orders by date for chart data
        const ordersByDate = orders.reduce((acc: { [x: string]: { count: number; revenue: number; }; }, order: { created_at: string | number | Date; total: any; }) => {
          const date = new Date(order.created_at).toLocaleDateString();
          if (!acc[date]) {
            acc[date] = { count: 0, revenue: 0 };
          }
          acc[date].count += 1;
          acc[date].revenue += parseFloat(order.total || 0);
          return acc;
        }, {});
        
        // Convert to array for chart
        const chartData = Object.keys(ordersByDate).map(date => ({
          date,
          orders: ordersByDate[date].count,
          revenue: ordersByDate[date].revenue
        }));
        
        // Sort by date
        chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Get recent activities from latest orders
        const sortedOrders = [...orders].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const recent = sortedOrders.slice(0, 3).map(order => ({
          id: order.order_number,
          type: "order",
          title: "New order received",
          description: `Order #${order.order_number} - ${new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(parseFloat(order.total))}`,
          time: getTimeAgo(new Date(order.created_at)),
          customer: `${order.first_name} ${order.last_name}`
        }));
        
        setOrderStats(stats);
        setSalesData(chartData);
        setRecentActivity(recent);
        setLoading(false);
      } catch (err) {
        setError((err as Error).message || "Failed to fetch dashboard data");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to calculate time ago
  const getTimeAgo = (date: number | Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return `${interval} years ago`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return `${interval} months ago`;
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return `${interval} days ago`;
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return `${interval} hours ago`;
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) return `${interval} minutes ago`;
    
    return "just now";
  };

  const statusData = [
    { name: "Completed", value: orderStats.completedOrders, color: "#10b981" },  // green
    { name: "Pending", value: orderStats.pendingOrders, color: "#f59e0b" },      // amber
    { name: "Cancelled", value: orderStats.cancelledOrders, color: "#ef4444" }   // red
  ];

  if (loading) {
    return <div className="text-center py-10">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }

  // Random percentage change values for display purposes
  const getRandomChange = () => {
    return (Math.random() * 25).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.totalOrders}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="text-green-500 mr-1">+{getRandomChange()}%</span>
              from last month
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
              }).format(orderStats.totalRevenue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="text-green-500 mr-1">+{getRandomChange()}%</span>
              from last month
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.customers}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="text-green-500 mr-1">+{getRandomChange()}%</span>
              from last month
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Daily booking and revenue for the current period</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={salesData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="orders"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#82ca9d" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
  <CardHeader>
    <CardTitle>Booking Status Distribution</CardTitle>
    <CardDescription>Overview of order fulfillment status</CardDescription>
  </CardHeader>
  <CardContent style={{ height: "20rem", position: "relative" }}>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={statusData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius="70%"
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {statusData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </CardContent>
</Card>

      </div>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your buisness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center">
                  <div className="mr-4 rounded-full bg-green-100 p-2">
                    <ShoppingCart className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">{activity.time}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">No recent activity</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;