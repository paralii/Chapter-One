"use client"

import { useEffect, useState } from "react"
import userAxios from "../../../api/userAxios"
import { Link } from "react-router-dom"
import dayjs from "dayjs"
import Navbar from "../../../components/common/Navbar"
import Footer from "../../../components/common/Footer"

const UserOrders = () => {
  const [orders, setOrders] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await userAxios.get("/orders")
      setOrders(res.data.orders)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order.orderID?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items?.some((item) => item.product_id?.title?.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.order_date) - new Date(a.order_date)
      if (sortBy === "oldest") return new Date(a.order_date) - new Date(b.order_date)
      if (sortBy === "amount-high") return b.netAmount - a.netAmount
      if (sortBy === "amount-low") return a.netAmount - b.netAmount
      return 0
    })

  const uniqueStatuses = [...new Set(orders.map((order) => order.status))]

  return (
    <>
      <Navbar />
      <div className="w-full max-w-full bg-[#fff8e5] p-4 sm:p-8 shadow-lg mx-auto flex flex-col min-h-screen">
        <div className="flex flex-row justify-between items-center mb-6 gap-4">
  <h2 className="text-2xl font-bold text-gray-800">Your Orders</h2>
  <Link
    to="/profile"
    className="text-sm text-gray-700 hover:text-yellow-600 transition-colors"
  >
    ← Back to Profile
  </Link>
</div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full mb-4">
          {/* Search Input */}
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by Order ID, Status, or Product Name..."
            className="w-full sm:max-w-md px-4 py-3 border bg-white border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4a261] text-sm sm:text-base"
          />

          {/* Filter + Sort (hidden on small devices) */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Example Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border bg-white border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4a261] text-sm"
            >
              <option value="all">All</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {/* Example Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border bg-white border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4a261] text-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount-high">Amount (High → Low)</option>
              <option value="amount-low">Amount (Low → High)</option>
            </select>
          </div>
        </div>


        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
            <span className="ml-3 text-gray-600">Loading your orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <p className="text-gray-500 text-lg mb-2">
              {searchQuery || statusFilter !== "all" ? "No orders match your search" : "No orders found"}
            </p>
            <p className="text-gray-400 text-sm">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Start shopping to see your orders here"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <Link to={`/orders/${order._id}`} className="block p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <div>
                      <p className="text-lg font-semibold text-gray-900 mb-1">Order #{order.orderID}</p>
                      <p className="text-sm text-gray-500">{dayjs(order.order_date).format("DD MMM YYYY, hh:mm A")}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                          order.status === "Cancelled"
                            ? "bg-red-100 text-red-600"
                            : order.status === "Delivered"
                              ? "bg-green-100 text-green-600"
                              : order.status === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : order.status === "Shipped"
                                  ? "bg-blue-100 text-blue-600"
                                  : order.status === "OutForDelivery"
                                    ? "bg-purple-100 text-purple-600"
                                    : order.status === "Processing"
                                      ? "bg-orange-100 text-orange-600"
                                      : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {order.status}
                      </span>
                      {(order.paymentStatus === "Failed" || order.paymentStatus === "Pending") &&
                        order.paymentMethod === "ONLINE" && (
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-600">
                            Payment {order.paymentStatus}
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Payment</p>
                      <p className="font-medium">{order.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Items</p>
                      <p className="font-medium">
                        {order.items.length} item{order.items.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Total</p>
                      <p className="font-medium">₹{order.total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Net Amount</p>
                      <p className="font-semibold text-green-700">₹{order.netAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="font-medium text-gray-800 text-sm">Order Items:</p>
                    {order.items.slice(0, 2).map((item) => (
                      <div key={item._id} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg">
                        {item.product_id ? (
                          <>
                            <img
                              src={item.product_id.product_imgs?.[0] || "/fallback.jpg"}
                              alt={item.product_id.title}
                              className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{item.product_id.title}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                                <span>Qty: {item.quantity}</span>
                                <span>₹{item.price}</span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    item.status === "Pending"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : item.status === "Cancelled"
                                        ? "bg-red-100 text-red-600"
                                        : "bg-green-100 text-green-600"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-red-600 p-2">
                            <p className="font-medium">Product Unavailable</p>
                            <p className="text-xs">This product has been removed</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        +{order.items.length - 2} more item{order.items.length - 2 > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}

export default UserOrders
