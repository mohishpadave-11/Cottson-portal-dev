import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import api from '../config/api';
import { useToast } from '../contexts/ToastContext';
import DocumentCard from './DocumentCard';

const FIXED_DOCUMENTS = [
    { key: 'quotation', label: 'Quotation' },
    { key: 'proformaInvoice', label: 'Proforma Invoice' },
    { key: 'manufacturingSheet', label: 'Manufacturing Sheet' },
    { key: 'invoice', label: 'Invoice' }
];

const OrderDocumentManager = ({
    orderId,
    documents = [],
    onUpdate,
    isEditing,
    // New props for staging
    stagedDocuments = [],
    onStageFile,
    onUnstageFile
}) => {
    const toast = useToast();
    const [uploading, setUploading] = useState({});
    const [notifying, setNotifying] = useState({});
    const [notifySuccess, setNotifySuccess] = useState({});
    const [notifyDisabled, setNotifyDisabled] = useState({});

    const isNew = orderId === 'new';

    const handleFileSelect = async (e, docType, slotId = null) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation for file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Invalid File Type', 'Please upload only .pdf, .jpeg, .jpg, or .png files.');
            e.target.value = ''; // Reset input
            return;
        }

        // Reset input
        e.target.value = '';

        if (isNew) {
            if (onStageFile) {
                onStageFile(docType, file);
            }
            return;
        }

        const loadingKey = slotId || docType;
        setUploading(prev => ({ ...prev, [loadingKey]: true }));

        try {
            // 1. Get Presigned URL
            const signResponse = await api.post(`/api/orders/${orderId}/upload-url`, {
                fileName: file.name,
                fileType: file.type,
                docType
            });

            const { uploadUrl, publicUrl, key } = signResponse.data;

            // 2. Upload to R2 directly
            await axios.put(uploadUrl, file, {
                headers: {
                    'Content-Type': file.type
                }
            });

            // 3. Sync with Backend
            await api.put(`/api/orders/${orderId}/documents`, {
                docType,
                newUrl: publicUrl,
                newKey: key,
                fileName: file.name,
                fileType: file.type
            });

            toast.success('Success', 'Document uploaded successfully');
            if (onUpdate) onUpdate();

        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload Failed', error.response?.data?.message || 'Failed to upload document');
        } finally {
            setUploading(prev => ({ ...prev, [loadingKey]: false }));
        }
    };

    const handleRename = async (docId, newName) => {
        if (isNew) return; // Rename not supported for staged docs yet (simplification)

        try {
            await api.patch(`/api/orders/${orderId}/documents/${docId}/rename`, { name: newName });
            toast.success('Success', 'Document renamed');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Rename error:', error);
            toast.error('Error', error.response?.data?.message || 'Failed to rename');
        }
    };

    const handleDelete = async (docId) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;

        if (isNew) {
            if (onUnstageFile) {
                onUnstageFile(docId); // docId here will be the tempId for staged docs
            }
            return;
        }

        try {
            await api.delete(`/api/orders/${orderId}/documents/${docId}`);
            toast.success('Success', 'Document deleted');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Error', error.response?.data?.message || 'Failed to delete');
        }
    };

    const handleNotify = async (doc) => {
        if (isNew) return; // Cannot notify for staged docs

        // ... (rest of handleNotify logic remains same)
        const key = doc.isSystem ? doc.originalName : doc._id;

        setNotifying(prev => ({ ...prev, [key]: true }));
        setNotifyDisabled(prev => ({ ...prev, [key]: true }));

        try {
            await api.post(`/api/orders/${orderId}/documents/notify`, {
                docType: doc.isSystem ? doc.originalName : 'other',
                docUrl: doc.url
            });

            toast.success('Notification Sent', 'Client notified via Email and In-App');
            setNotifySuccess(prev => ({ ...prev, [key]: true }));

            setTimeout(() => setNotifySuccess(prev => ({ ...prev, [key]: false })), 60000);
            setTimeout(() => setNotifyDisabled(prev => ({ ...prev, [key]: false })), 30000);

        } catch (error) {
            console.error('Notify error:', error);
            toast.error('Notification Failed', error.response?.data?.message || 'Failed to notify client');
            setNotifyDisabled(prev => ({ ...prev, [key]: false }));
        } finally {
            setNotifying(prev => ({ ...prev, [key]: false }));
        }
    };

    const openDocument = (url) => {
        if (!url) return;
        window.open(url, '_blank');
    };

    // Helper: Find existing doc for fixed slot
    const getFixedDoc = (key) => {
        if (isNew) {
            // Find in stagedDocuments
            const staged = stagedDocuments.find(d => d.docType === key);
            if (staged) {
                return {
                    _id: staged.tempId, // Use tempId as _id
                    originalName: key,
                    name: FIXED_DOCUMENTS.find(f => f.key === key)?.label || key, // Display Label
                    url: staged.previewUrl,
                    isSystem: true,
                    isStaged: true
                };
            }
            return undefined;
        }
        return documents.find(d => d.originalName === key);
    };

    // Helper: Get flexible docs
    const getFlexibleDocs = () => {
        if (isNew) {
            const staged = stagedDocuments.filter(d => d.docType === 'other');
            return staged.map(d => ({
                _id: d.tempId,
                name: d.file.name, // Use filename for other docs
                url: d.previewUrl,
                isSystem: false,
                isStaged: true
            }));
        }
        return documents.filter(d => !d.isSystem);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Documents
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fixed Slots */}
                {FIXED_DOCUMENTS.map((slot) => {
                    const doc = getFixedDoc(slot.key);
                    const loadingKey = slot.key;

                    return (
                        <DocumentCard
                            key={slot.key}
                            doc={doc} // Can be undefined if not uploaded yet
                            label={slot.label}
                            isSystem={true}
                            onReplace={(e) => handleFileSelect(e, slot.key)}
                            onView={openDocument}
                            onNotify={handleNotify}
                            isEditing={isEditing}
                            uploading={uploading[loadingKey]}
                            notifying={notifying[loadingKey]}
                            notifySuccess={notifySuccess[loadingKey]}
                            notifyDisabled={notifyDisabled[loadingKey]}
                        // Rename/Delete disabled for system docs via Card logic
                        />
                    );
                })}

                {/* Flexible Docs */}
                {getFlexibleDocs().map((doc, index) => {
                    const loadingKey = doc._id; // Use ID for tracking loading states of existing docs?
                    // Actually upload happens before creation for new ones. 
                    // But for rename/notify we use ID.

                    return (
                        <DocumentCard
                            key={doc._id}
                            doc={doc}
                            label={doc.name} // Fallback handled in component
                            isSystem={false}
                            onRename={handleRename}
                            onDelete={handleDelete}
                            onNotify={handleNotify}
                            onView={openDocument}
                            // Replace logic for flexible docs? 
                            // Requirements: "Fixed Docs: ... (only replaced)". "Flexible Docs: Can be renamed ... and deleted".
                            // Usually "Other" docs are just added/deleted. Replacing "Other 1" is ambiguous if we have multiple.
                            // But let's allow replacing if we want. For now, just Delete/Add new is safer for "Other".
                            // Wait, DocumentCard has "Replace" button. 
                            // If I don't pass `onReplace` to Flexible docs, it won't show the button?
                            // My DocumentCard code:
                            // {isEditing && ( <label ... Replace ... /> )}
                            // It assumes onReplace is passed if isEditing is true.
                            // I should conditionally show Replace in DocumentCard or just pass undefined?
                            // Let's pass undefined and update DocumentCard to check for it?
                            // Or better: Let's NOT support Replace for flexible docs for simplicity (Delete + Add calls).
                            // BUT DocumentCard implementation renders Replace button unconditionally if `isEditing`.
                            // I will assume Replace is not supported for Flexible docs for now or just treat it as new upload?
                            // Actually, replacing a flexible doc via upload is tricky because backend `uploadFile` flow
                            // creates NEW doc if `docType` is 'other'. It doesn't replace by ID.
                            // So we should HIDE Replace for flexible docs.
                            // I will update DocumentCard if needed, or just let it fail?
                            // I'll update DocumentCard to check `onReplace`.

                            isEditing={isEditing}
                            uploading={false} // Loading state for existing docs not tracked really for upload
                            notifying={notifying[doc._id]}
                            notifySuccess={notifySuccess[doc._id]}
                            notifyDisabled={notifyDisabled[doc._id]}
                        />
                    );
                })}

                {/* Add New Flexible Doc Button */}
                {isEditing && getFlexibleDocs().length < 2 && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 flex items-center justify-center h-full min-h-[100px]">
                        <label className="cursor-pointer flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 transition-colors w-full h-full">
                            {uploading['other-new'] ? (
                                <div className="flex items-center text-blue-600">
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-sm font-medium">Uploading...</span>
                                </div>
                            ) : (
                                <>
                                    <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-sm font-medium">Add Other Document</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => handleFileSelect(e, 'other', 'other-new')}
                                    />
                                </>
                            )}
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderDocumentManager;
