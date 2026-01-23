import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import orderService from '../services/orderService';
import Loader from '../components/Loader';
// import { dummyOrders } from '../data/dummyData';

const FolderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const companyName = location.state?.companyName || 'Company';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // orders, documents, or details (when order selected)

  useEffect(() => {
    fetchCompanyOrders();
  }, [id]);

  const fetchCompanyOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await orderService.getAll();
      const companyOrders = (allOrders || []).filter(order => order.companyId?._id === id || order.companyId === id);
      setOrders(companyOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentCount = (order) => {
    if (!order.documents) return 0;
    return Object.values(order.documents).filter(doc => doc).length;
  };

  const handleOrderClick = async (order) => {
    try {
      // Fetch full order details with all populated fields
      const fullOrderData = await orderService.getById(order._id);
      setSelectedOrder(fullOrderData);
      setActiveTab('details');
    } catch (error) {
      console.error('Error fetching order details:', error);
      // Fallback to using the order data we already have
      setSelectedOrder(order);
      setActiveTab('details');
    }
  };

  const handleBackToFolders = () => {
    setSelectedOrder(null);
    setActiveTab('orders');
  };

  const getDocumentsList = (order) => {
    if (!order.documents || !Array.isArray(order.documents)) return [];

    const FIXED_LABELS = {
      'quotation': 'Quotation',
      'proformaInvoice': 'Proforma Invoice',
      'manufacturingSheet': 'Manufacturing Sheet',
      'invoice': 'Invoice',
      'purchaseOrder': 'Purchase Order',
      'deliveryChallan': 'Delivery Challan',
      'qualityCertificate': 'Quality Certificate',
      'packingList': 'Packing List',
      'shippingDocument': 'Shipping Document',
      'otherDocument': 'Other Document'
    };

    return order.documents.map(doc => ({
      type: doc.isSystem ? (FIXED_LABELS[doc.originalName] || doc.originalName) : (doc.name || doc.fileName || 'Document'),
      url: doc.url || doc.newUrl // Handle potential URL field variations
    })).filter(doc => doc.url); // Ensure only valid docs with URLs are returned
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader size="large" text="Loading folder contents..." />
      </div>
    );
  }

  // If an order is selected, show tabbed view
  if (selectedOrder) {
    const documents = getDocumentsList(selectedOrder);

    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToFolders}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order #{selectedOrder.orderNumber}</h1>
            <p className="text-sm text-gray-500 mt-1">{companyName}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Order Details</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'documents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Documents ({documents.length})</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'details' ? (
              /* Order Details Tab */
              <div className="space-y-6">
                {/* Order Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Order Number</p>
                      <p className="text-base font-medium text-gray-900">{selectedOrder.orderNumber}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Order Date</p>
                      <p className="text-base font-medium text-gray-900">
                        {new Date(selectedOrder.orderDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Expected Delivery</p>
                      <p className="text-base font-medium text-gray-900">
                        {selectedOrder.expectedDelivery ? new Date(selectedOrder.expectedDelivery).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${selectedOrder.paymentStatus === 'Payment Completed' ? 'bg-green-100 text-green-800' :
                        selectedOrder.paymentStatus === 'Advance Payment' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Product Name</span>
                      <span className="text-base font-medium text-gray-900">
                        {selectedOrder.productId?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Quantity</span>
                      <span className="text-base font-medium text-gray-900">{selectedOrder.quantity}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Price per Unit</span>
                      <span className="text-base font-medium text-gray-900">
                        ₹{selectedOrder.price?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Price (After Discount)</span>
                      <span className="text-base font-medium text-gray-900">
                        ₹{selectedOrder.priceAfterDiscount?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">GST Amount (5%)</span>
                      <span className="text-base font-medium text-gray-900">
                        ₹{((selectedOrder.priceWithGst - selectedOrder.priceAfterDiscount) || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className="text-base font-semibold text-gray-900">Total Amount (With GST)</span>
                      <span className="text-lg font-bold text-blue-600">
                        ₹{selectedOrder.priceWithGst?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                    {selectedOrder.amountPaid && selectedOrder.amountPaid > 0 && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Amount Paid</span>
                          <span className="text-base font-medium text-gray-900">
                            ₹{selectedOrder.amountPaid.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Remaining Balance</span>
                          <span className="text-base font-medium text-orange-600">
                            ₹{(selectedOrder.priceWithGst - selectedOrder.amountPaid).toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                {selectedOrder.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Documents Tab */
              <div className="space-y-4">
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg font-medium text-gray-900">No documents found</p>
                    <p className="text-sm text-gray-500 mt-1">This order doesn't have any documents attached</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((doc, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{doc.type}</p>
                              <p className="text-xs text-gray-500 mt-1">PDF Document</p>
                            </div>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/folders')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-16 h-14 flex items-center justify-center">
                <img
                  src="/mac.png"
                  alt="Folder"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{companyName}</h1>
                <p className="text-sm text-gray-500 mt-1">{orders.length} orders found</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Orders and Documents */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Orders ({orders.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'documents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>All Documents</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'orders' ? (
            /* Orders List */
            orders.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-lg font-medium text-gray-900">No orders found</p>
                <p className="text-sm text-gray-500 mt-1">This company doesn't have any orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    onClick={() => handleOrderClick(order)}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-blue-50 transition-colors cursor-pointer border border-gray-200 hover:border-blue-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>{order.productId?.name || 'N/A'}</span>
                            <span>•</span>
                            <span>Qty: {order.quantity}</span>
                            <span>•</span>
                            <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">₹{order.priceWithGst.toLocaleString()}</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${order.paymentStatus === 'Payment Completed' ? 'bg-green-100 text-green-800' :
                            order.paymentStatus === 'Advance Payment' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* All Documents List */
            (() => {
              const ordersWithDocs = orders.filter(order => getDocumentsList(order).length > 0);

              if (ordersWithDocs.length === 0) {
                return (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg font-medium text-gray-900">No documents found</p>
                    <p className="text-sm text-gray-500 mt-1">No orders with documents available</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {ordersWithDocs.map((order) => {
                    const docs = getDocumentsList(order);
                    return (
                      <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                          Order #{order.orderNumber} - Documents
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {docs.map((doc, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1">
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{doc.type}</p>
                                    <p className="text-xs text-gray-500 mt-1">PDF Document</p>
                                  </div>
                                </div>
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-3 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderDetails;
