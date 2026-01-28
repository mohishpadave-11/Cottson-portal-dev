import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { endpoints } from '../config/api';

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const [results, setResults] = useState({ orders: [], clients: [], products: [], companies: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query) return;
            setLoading(true);
            try {
                const response = await endpoints.search.query(query);
                setResults(response.data.data);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    if (loading) {
        return <div className="p-8 text-center">Loading search results...</div>;
    }

    // Helper to check if any results exist
    const hasResults = Object.values(results).some(arr => arr.length > 0);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">
                Search Results for "{query}"
            </h1>

            {!hasResults && (
                <div className="text-gray-500">No results found matching your query.</div>
            )}

            {/* Orders Section */}
            {results.orders.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Orders</h2>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-sm">
                                <tr>
                                    <th className="px-6 py-3">Order #</th>
                                    <th className="px-6 py-3">Client</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {results.orders.map(order => (
                                    <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{order.orderNumber}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {order.clientId?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(order.orderDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${order.timeline === 'Order Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {order.timeline || order.orderStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link to={`/orders/${order._id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Clients Section */}
            {results.clients.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Clients</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.clients.map(client => (
                            <div key={client._id} className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                                <h3 className="font-bold text-lg text-gray-900">{client.name}</h3>
                                <p className="text-gray-500 text-sm">{client.email}</p>
                                <Link to={`/clients/${client._id}`} className="mt-3 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium">
                                    View Profile
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Companies Section */}
            {results.companies.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Companies</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.companies.map(company => (
                            <div key={company._id} className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                                <h3 className="font-bold text-lg text-gray-900">{company.companyName}</h3>
                                <p className="text-gray-500 text-sm">{company.tradeName}</p>
                                <Link to={`/companies/${company._id}`} className="mt-3 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium">
                                    View Details
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Products Section */}
            {results.products.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Products</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {results.products.map(product => (
                            <div key={product._id} className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow flex items-center space-x-4">
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">{product.name}</h3>
                                    <p className="text-sm text-gray-500">{product.category}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default SearchResults;
