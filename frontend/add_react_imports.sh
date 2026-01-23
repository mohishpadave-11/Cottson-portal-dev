#!/bin/bash

# List of files to fix
files=(
"src/components/Error.jsx"
"src/components/Layout.jsx"
"src/components/OrderDocumentManager.jsx"
"src/components/DocumentCard.jsx"
"src/components/Footer.jsx"
"src/components/PaymentModal.jsx"
"src/components/ClientLayout.jsx"
"src/components/Toast.jsx"
"src/components/ConfirmationModal.jsx"
"src/components/ErrorMessage.jsx"
"src/components/ClientModal.jsx"
"src/components/Loader.jsx"
"src/components/ProtectedRoute.jsx"
"src/components/Pagination.jsx"
"src/components/CompanyModal.jsx"
"src/components/KanbanBoard.jsx"
"src/pages/Onboarding.jsx"
"src/pages/OrderTimeline.jsx"
"src/pages/AdminComplaints.jsx"
"src/pages/Companies.jsx"
"src/pages/AdminDetails.jsx"
"src/pages/Notifications.jsx"
"src/pages/ClientOrders.jsx"
"src/pages/ClientDetails.jsx"
"src/pages/ResetPassword.jsx"
"src/pages/Admins.jsx"
"src/pages/FolderDetails.jsx"
"src/pages/Products.jsx"
"src/pages/ClientLogin.jsx"
"src/pages/ClientComplaints.jsx"
"src/pages/Clients.jsx"
"src/pages/ForgotPassword.jsx"
"src/pages/Orders.jsx"
"src/pages/Folders.jsx"
"src/pages/Login.jsx"
"src/pages/ClientOrderDetails.jsx"
"src/pages/ClientOrderTimeline.jsx"
"src/pages/ClientNotifications.jsx"
"src/pages/AdminProfile.jsx"
"src/pages/Settings.jsx"
"src/pages/Logout.jsx"
"src/pages/CompanyDetails.jsx"
"src/pages/Home.jsx"
"src/pages/OrderDetails.jsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Check if file already has "import React" at the start
    if ! grep -q "^import React" "$file"; then
      # Check if file has any import statements
      if grep -q "^import " "$file"; then
        # Add "import React from 'react';" before the first import
        sed -i '' '1s/^/import React from '\''react'\'';\n/' "$file"
        echo "✓ Added React import to: $file"
      else
        # No imports, add at the very beginning
        sed -i '' '1s/^/import React from '\''react'\'';\n\n/' "$file"
        echo "✓ Added React import to: $file (no existing imports)"
      fi
    else
      echo "- Skipped (already has React import): $file"
    fi
  else
    echo "✗ File not found: $file"
  fi
done

echo ""
echo "Done! React imports added to all necessary files."
