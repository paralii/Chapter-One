import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBooksByCategory } from "../../../api/admin/categoryAPI";
import Navbar from "../../../components/common/Navbar";
import BookCard from "../../../components/User/ProductCard";

const CategoryPage = () => {
    const { category } = useParams();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooks = async () => {
            setLoading(true);
            const data = await getBooksByCategory(category);
            if (data) setBooks(data);
            setLoading(false);
        };

        fetchBooks();
    }, [category]);

    return (
        <div className="bg-[#fff8e5] min-h-screen w-full">
            <Navbar />
            <div className="max-w-6xl mx-auto py-6">
                <h2 className="text-3xl font-bold text-center my-6 text-[#3c2712]">
                    {category} Books
                </h2>

                {loading ? (
                    <p className="text-center text-gray-600">Loading...</p>
                ) : books.length > 0 ? (
                    <div className="grid grid-cols-4 gap-6 md:grid-cols-2 sm:grid-cols-1 px-5">
                        {books.map((book) => (
                            <BookCard key={book._id} book={book} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500">No books available in this category.</p>
                )}
            </div>
        </div>
    );
};

export default CategoryPage;
