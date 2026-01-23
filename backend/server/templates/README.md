# Cottson Email Templates

Professional email templates for Cottson Clothing with branded design elements.

## Design Specifications

Based on the provided design guidelines:
- **Logo**: Centered at the top of every email
- **Separator Line**: Navy Blue (#113858) horizontal line below the logo
- **Footer**: Professional signature with Yash Mishra's details and company information
- **Branding**: Consistent Cottson Clothing branding throughout

## Template Structure

All emails follow this structure:
1. **Header**: Centered Cottson logo with navy blue separator
2. **Content**: Main email body (customizable per template)
3. **Footer**: Yash Mishra's signature and company details

## Available Templates

### 1. Document Notification
Notifies clients when a new document is uploaded to their order.

```javascript
import EmailTemplates from './templates/emailTemplate.js';

const html = EmailTemplates.documentNotification(
  'John Doe',           // clientName
  'Proforma Invoice',   // docType
  'CC-001',            // orderNumber
  'https://portal.cottson.com/docs/123' // docUrl (optional)
);
```

### 2. Order Status Update
Sends updates when order status changes.

```javascript
const html = EmailTemplates.orderStatusUpdate(
  'John Doe',           // clientName
  'CC-001',            // orderNumber
  'In Production',     // status
  'Your order has entered the production phase.' // message (optional)
);
```

### 3. Welcome Email
Sent to new clients when their account is created.

```javascript
const html = EmailTemplates.welcome(
  'John Doe',           // clientName
  'https://portal.cottson.com/client/login' // loginUrl (optional)
);
```

### 4. Password Reset
Sends password reset link to users.

```javascript
const html = EmailTemplates.passwordReset(
  'John Doe',           // userName
  'https://portal.cottson.com/reset-password/token123' // resetUrl
);
```

### 5. Generic Notification
Flexible template for custom notifications.

```javascript
const html = EmailTemplates.notification(
  'John Doe',           // userName
  'Important Update',   // title
  '<p>Your custom message here...</p>', // message (HTML allowed)
  'https://portal.cottson.com/action', // actionUrl (optional)
  'Take Action'         // actionText (optional)
);
```

## Using with EmailService

The `EmailService` has been updated to use these templates:

```javascript
import EmailService from './services/EmailService.js';

// Send document notification
await EmailService.sendDocumentNotification(
  'client@example.com',
  'John Doe',
  'Proforma Invoice',
  'CC-001',
  'https://portal.cottson.com/docs/123'
);

// Send order status update
await EmailService.sendOrderStatusUpdate(
  'client@example.com',
  'John Doe',
  'CC-001',
  'In Production',
  'Your order has entered the production phase.'
);

// Send welcome email
await EmailService.sendWelcomeEmail(
  'client@example.com',
  'John Doe',
  'https://portal.cottson.com/client/login'
);

// Send password reset
await EmailService.sendPasswordResetEmail(
  'user@example.com',
  'John Doe',
  'https://portal.cottson.com/reset-password/token123'
);

// Send generic notification
await EmailService.sendNotification(
  'user@example.com',
  'John Doe',
  'Important Update',
  '<p>Your custom message here...</p>',
  'https://portal.cottson.com/action',
  'View Details'
);
```

## Footer Information

The footer includes:
- **Yash Mishra** - Director
- **Phone**: +91 9892297764
- **Cottson Clothing Logo**
- **Registered Office**: No. 721, Centura Square IT Park, Road No. 27, Wagle Estate, Thane (West) - 400604, Maharashtra, India
- **Website**: www.cottson.com
- **Phone**: 022 - 4662 7501
- **GSTIN**: 27GUFPM3357H1ZB

## Customization

To create custom email templates, use the `generateEmailTemplate` function:

```javascript
import { generateEmailTemplate } from './templates/emailTemplate.js';

const customContent = `
  <h2 style="color: #113858;">Your Custom Title</h2>
  <p>Your custom content here...</p>
`;

const html = generateEmailTemplate(customContent, 'Email Subject');
```

## Brand Colors

- **Navy Blue**: #113858 (Primary brand color)
- Used for: Separator lines, headings, CTA buttons

## Testing

To preview an email template, see the `email-preview.html` file in this directory.
