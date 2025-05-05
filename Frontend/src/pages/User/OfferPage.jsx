import React, { useEffect, useState } from "react";
import Navbar from "../../../components/common/Navbar";
import Footer from "../../../components/common/Footer";
import { getProducts } from "../../../api/user/productAPI";
import { getProductOffers, getCategoryOffers } from "../../../api/admin/offerAPI";

const OfferPage = () => {
  const [products, setProducts] = useState([]);
  const [productOffers, setProductOffers] = useState([]);
  const [categoryOffers, setCategoryOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOffersAndProducts = async () => {
      try {
        setLoading(true);

        const [productRes, categoryRes, productData] = await Promise.all([
          getProductOffers(),
          getCategoryOffers(),
          getProducts(),
        ]);

        setProductOffers(productRes.data || []);
        setCategoryOffers(categoryRes.data || []);

        // Apply the highest offer (product > category)
        const updatedProducts = productData.data.products.map((product) => {
          const productOffer = productOffers.find((offer) => offer.product_id === product._id);
          const categoryOffer = categoryOffers.find((offer) => offer.category_id === product.category_id);

          let discount = 0;
          if (productOffer) discount = productOffer.discount_percentage;
          else if (categoryOffer) discount = categoryOffer.discount_percentage;

          const discountedPrice = product.price - (product.price * discount) / 100;

          return { ...product, discount, discountedPrice };
        });

        setProducts(updatedProducts);
      } catch (err) {
        setError("Error fetching offers or products");
      } finally {
        setLoading(false);
      }
    };

    fetchOffersAndProducts();
  }, []);

  const getImageUrl = (url) =>
    url?.startsWith("http") ? url : `${import.meta.env.VITE_BACKEND_URL}${url}`;

  return (
    <div className="bg-[#fff8e5] min-h-screen w-full">
      <header className="bg-[#fff8e5] py-5 px-[118px] md:px-5">
        <Navbar />
      </header>

      <div className="text-center text-3xl font-bold uppercase my-10 pb-5 border-b">
        Special Offers
      </div>

      {loading && <div className="text-center my-5">Loading offers...</div>}
      {error && <div className="text-center text-red-500 my-5">{error}</div>}

      <div className="grid grid-cols-4 gap-8 max-w-[1205px] mx-auto mb-8 md:grid-cols-2 sm:grid-cols-1 px-5">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product._id} className="bg-white rounded-2xl p-5 shadow-md text-center">
              <img
                src={getImageUrl(product.product_imgs?.[0])}
                alt={product.title}
                className="w-full h-[272px] rounded-xl object-cover mb-4"
              />
              <div className="font-Roboto text-base font-semibold my-2">{product.title}</div>
              <div className="font-Roboto text-sm text-gray-500 mb-2">
                {product.description?.substring(0, 100) + "..."}
              </div>
              {product.discount > 0 && (
                <div className="text-red-600 font-bold">
                  {product.discount}% OFF
                </div>
              )}
              <div className="font-Roboto text-base font-semibold mb-2">
                ₹<span className={product.discount > 0 ? "line-through text-gray-500" : ""}>
                  {product.price}
                </span>{" "}
                {product.discount > 0 && <span className="text-green-600">₹{product.discountedPrice}</span>}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center">No active offers available.</p>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default OfferPage;
