"use client"

import { useEffect, useState } from "react"
import { WishlistItem } from "../../../components/User/ProductCard"
import { getWishlist, removeFromWishlist, moveToCart } from "../../../api/user/wishlistAPI"
import Navbar from "../../../components/common/Navbar"
import Footer from "../../../components/common/Footer"
import { useDispatch } from "react-redux"
import { showAlert } from "../../../redux/alertSlice"

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const dispatch = useDispatch()

  useEffect(() => {
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const response = await getWishlist()
      const wishlistItems = response.data.wishlist?.products || []
      const validItems = wishlistItems.filter((item) => item.product_id && item.product_id._id)
      setWishlist(validItems)
    } catch (error) {
      console.error("Error fetching wishlist:", error)
      setError("Failed to load wishlist. Please try again.")
      dispatch(showAlert({ message: "Failed to load wishlist.", type: "error" }))
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (productId) => {
    try {
      const response = await moveToCart(productId)
      setWishlist(wishlist.filter((item) => item.product_id._id !== productId))
      dispatch(showAlert({ message: "Product moved to cart!", type: "success" }))
    } catch (error) {
      console.error("Error moving to cart:", error)
      const message = error.response?.data?.message || "Failed to move product to cart."
      dispatch(showAlert({ message, type: "error" }))
    }
  }

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId)
      setWishlist(wishlist.filter((item) => item.product_id._id !== productId))
      dispatch(showAlert({ message: "Product removed from wishlist!", type: "success" }))
    } catch (error) {
      console.error("Error removing from wishlist:", error)
      const message = error.response?.data?.message || "Failed to remove product from wishlist."
      dispatch(showAlert({ message, type: "error" }))
    }
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-[#fff]">
        <Navbar />
        <div className="bg-[#fff8e5] flex-grow">
          <div className="max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#3c2712] text-center mb-6">
              My Wishlist
            </h2>

            {loading ? (
              <p className="text-lg text-gray-700 text-center">Loading wishlist...</p>
            ) : error ? (
              <p className="text-lg text-red-500 text-center">{error}</p>
            ) : wishlist.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {wishlist.map((item) => (
                  <WishlistItem
                    key={item.product_id._id}
                    item={item}
                    onAddToCart={handleAddToCart}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            ) : (
              <p className="text-lg text-gray-700 text-center">Your wishlist is empty.</p>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}

export default WishlistPage
