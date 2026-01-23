import React from 'react';

import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

const DocumentCard = ({
    doc,
    label,
    isSystem,
    onRename,
    onDelete,
    onReplace,
    onView,
    onNotify,
    isEditing,
    uploading,
    notifying,
    notifySuccess,
    notifyDisabled
}) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(doc?.name || label);

    const handleSaveRename = async () => {
        if (!newName.trim() || newName === doc?.name) {
            setIsRenaming(false);
            return;
        }
        await onRename(doc._id, newName);
        setIsRenaming(false);
    };

    const hasFile = !!doc?.url;

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between group">
            <div className="flex-1 min-w-0 mr-4">
                {isRenaming ? (
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename();
                                if (e.key === 'Escape') setIsRenaming(false);
                            }}
                        />
                        <button onClick={handleSaveRename} className="text-green-600 hover:text-green-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <button onClick={() => setIsRenaming(false)} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 truncate" title={doc?.name || label}>
                            {doc?.name || label}
                        </h4>

                        {/* Edit Name Icon - Only for Flexible docs && hasFile */}
                        {!isSystem && hasFile && isEditing && (
                            <button
                                onClick={() => setIsRenaming(true)}
                                className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Rename"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                        )}
                    </div>
                )}

                {hasFile && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                        {isSystem ? 'System Document' : 'Custom Document'} • {doc?.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
                    </p>
                )}
            </div>

            {!isRenaming && (
                <div className="flex items-center space-x-2">
                    {uploading ? (
                        <div className="flex items-center text-blue-600 px-3 py-1 bg-blue-50 rounded-md">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm">Uploading...</span>
                        </div>
                    ) : (
                        <>
                            {hasFile ? (
                                <>
                                    <button
                                        onClick={() => onView(doc.url)}
                                        className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                    >
                                        View
                                    </button>

                                    {/* Notify Button */}
                                    <button
                                        onClick={() => onNotify(doc)}
                                        disabled={notifyDisabled || notifying || !isEditing}
                                        title={!isEditing ? "Edit order to notify" : (notifySuccess ? "Notification Sent" : "Notify Client")}
                                        className={`p-1.5 rounded-md transition-colors outline-none
                                        ${notifyDisabled || notifying || !isEditing
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : notifySuccess
                                                    ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                            }`}
                                    >
                                        {notifying ? (
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : notifySuccess ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                    </button>

                                    {/* Replace Button */}
                                    {isEditing && onReplace && (
                                        <label className="cursor-pointer px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors relative">
                                            Replace
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={onReplace}
                                            />
                                        </label>
                                    )}

                                    {/* Delete Icon - Only for Flexible docs && hasFile */}
                                    {!isSystem && hasFile && isEditing && (
                                        <button
                                            onClick={() => onDelete(doc._id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            title="Delete"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                </>
                            ) : (
                                // Empty State - Upload Button
                                isEditing && (
                                    <label className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm">
                                        Upload
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={onReplace}
                                        />
                                    </label>
                                )
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default DocumentCard;
