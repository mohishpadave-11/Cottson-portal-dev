import { useState, useEffect } from 'react';
import collectionService from '../services/collectionService';
import productService from '../services/productService';
import { useToast } from '../contexts/ToastContext';
import Loader from '../components/Loader';
import ConfirmationModal from '../components/ConfirmationModal';
import StatusBadge from '../components/ui/StatusBadge/StatusBadge';

const Products = () => {
    const toast = useToast();
    const [view, setView] = useState('collections'); // 'collections' or 'products'
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [collections, setCollections] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditingProduct, setIsEditingProduct] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState(null);

    // Modal states
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [collectionForm, setCollectionForm] = useState({ name: '', description: '' });
    const [productForm, setProductForm] = useState({
        name: '',
        basePrice: '',
        category: 'Apparel',
        sku: '',
        description: '',
        status: 'active'
    });

    // Confirmation Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchCollections();
    }, []);

    useEffect(() => {
        if (selectedCollection) {
            fetchProducts(selectedCollection._id);
        }
    }, [selectedCollection]);

    const fetchCollections = async () => {
        try {
            setLoading(true);
            const data = await collectionService.getAll();
            setCollections(data || []);
        } catch (error) {
            toast.error('Error', 'Failed to fetch collections');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async (collectionId) => {
        try {
            setLoading(true);
            const data = await productService.getAll({ collectionId });
            setProducts(data || []);
        } catch (error) {
            toast.error('Error', 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCollection = async (e) => {
        e.preventDefault();
        try {
            await collectionService.create(collectionForm);
            toast.success('Success', 'Collection created successfully');
            setShowCollectionModal(false);
            setCollectionForm({ name: '', description: '' });
            fetchCollections();
        } catch (error) {
            toast.error('Error', error.response?.data?.message || 'Failed to create collection');
        }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        try {
            if (isEditingProduct) {
                await productService.update(selectedProductId, productForm);
                toast.success('Success', 'Product updated successfully');
            } else {
                await productService.create({
                    ...productForm,
                    collectionId: selectedCollection._id
                });
                toast.success('Success', 'Product created successfully');
            }
            setShowProductModal(false);
            resetProductForm();
            fetchProducts(selectedCollection._id);
        } catch (error) {
            toast.error('Error', error.response?.data?.message || 'Failed to save product');
        }
    };

    const resetProductForm = () => {
        setProductForm({ name: '', basePrice: '', category: 'Apparel', sku: '', description: '', status: 'active' });
        setIsEditingProduct(false);
        setSelectedProductId(null);
    };

    const handleEditProduct = (product) => {
        setProductForm({
            name: product.name,
            basePrice: product.basePrice,
            category: product.category,
            sku: product.sku || '',
            description: product.description || '',
            status: product.status || 'active'
        });
        setSelectedProductId(product._id);
        setIsEditingProduct(true);
        setShowProductModal(true);
    };

    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;

        try {
            setIsDeleting(true);
            await productService.delete(productToDelete._id);
            toast.success('Success', 'Product deleted successfully');
            fetchProducts(selectedCollection._id);
            setDeleteModalOpen(false);
            setProductToDelete(null);
        } catch (error) {
            toast.error('Error', 'Failed to delete product');
        } finally {
            setIsDeleting(false);
        }
    };

    const openCreateProductModal = () => {
        resetProductForm();
        setShowProductModal(true);
    };

    const handleBackToCollections = () => {
        setView('collections');
        setSelectedCollection(null);
        setProducts([]);
    };

    const handleViewCollection = (collection) => {
        setSelectedCollection(collection);
        setView('products');
    };



    if (loading && !selectedCollection && view === 'collections') {
        return <Loader fullScreen text="Loading collections..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    {view === 'products' && (
                        <button
                            onClick={handleBackToCollections}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {view === 'collections' ? 'Product Collections' : selectedCollection?.name}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {view === 'collections'
                                ? 'Manage your product catalog and collections'
                                : `Manage products in ${selectedCollection?.name}`}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => view === 'collections' ? setShowCollectionModal(true) : openCreateProductModal()}
                    className="btn-primary text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>{view === 'collections' ? 'New Collection' : 'New Product'}</span>
                </button>
            </div>

            {view === 'collections' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {collections.map(collection => (
                        <div
                            key={collection._id}
                            onClick={() => handleViewCollection(collection)}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {collection.status || 'Active'}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                {collection.name}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                {collection.description || 'No description'}
                            </p>
                            <div className="flex items-center text-sm text-gray-500">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                {collection.productCount || 0} Products
                            </div>
                        </div>
                    ))}

                    {collections.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-dashed border-2 border-gray-300">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <p className="text-gray-500 font-medium">No collections found. Create your first collection to get started.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {products.map(product => (
                                    <tr key={product._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{product.name}</div>
                                            <div className="text-xs text-gray-500">{product.description?.substring(0, 50)}...</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-600">{product.sku || '-'}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{product.basePrice}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={product.status || 'active'} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-3">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }}
                                                    className="text-blue-600 hover:text-blue-900 font-medium text-sm flex items-center space-x-1"
                                                    title="Edit Product"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(product); }}
                                                    className="text-red-600 hover:text-red-900 font-medium text-sm flex items-center space-x-1"
                                                    title="Delete Product"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                            No products found in this collection.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Collection Modal */}
            {showCollectionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">New Collection</h2>
                            <button onClick={() => setShowCollectionModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateCollection} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={collectionForm.name}
                                    onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={collectionForm.description}
                                    onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                />
                            </div>
                            <button type="submit" className="w-full btn-primary text-white py-2 rounded-lg">Create Collection</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Product Modal */}
            {showProductModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">{isEditingProduct ? 'Edit Product' : 'New Product'}</h2>
                            <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSaveProduct} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={productForm.name}
                                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                    <input
                                        type="number"
                                        required
                                        value={productForm.basePrice}
                                        onChange={(e) => setProductForm({ ...productForm, basePrice: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={productForm.category}
                                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Apparel">Apparel</option>
                                        <option value="Accessories">Accessories</option>
                                        <option value="Home Textiles">Home Textiles</option>
                                        <option value="Corporate Gifts">Corporate Gifts</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={productForm.status}
                                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                                <input
                                    type="text"
                                    value={productForm.sku}
                                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={productForm.description}
                                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                />
                            </div>
                            <button type="submit" className="w-full btn-primary text-white py-2 rounded-lg">
                                {isEditingProduct ? 'Update Product' : 'Create Product'}
                            </button>
                        </form>
                    </div>
                </div >
            )}

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Product"
                message={`Are you sure you want to delete ${productToDelete?.name}? This action cannot be undone.`}
                confirmText="Delete Product"
                isLoading={isDeleting}
                variant="danger"
            />
        </div>
    );
};

export default Products;
