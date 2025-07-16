# Facebook WhatsApp Webhook Setup Guide

## 1. Start Your Backend Server

First, make sure your backend is running:

```bash
cd /Users/sunny/crm-mvp/apps/backend
npm run dev
```

The server should start on `http://localhost:3001`

## 2. Create Public Tunnel with ngrok

Since Facebook needs to reach your webhook, you need a public URL.

### Install ngrok (if not installed):
```bash
# macOS with Homebrew
brew install ngrok

# Or download from https://ngrok.com/download
```

### Start ngrok tunnel:
```bash
# In a new terminal window
ngrok http 3001
```

This will output something like:
```
Session Status                online
Account                       your-account
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:3001
```

## 3. Configure Facebook Webhook

In the Facebook Developer Console (your screenshot):

### **Callback URL:**
```
https://abc123.ngrok.io/api/whatsapp/webhook
```
(Replace `abc123.ngrok.io` with your actual ngrok URL)

### **Verify Token:**
```
crm-webhook-verify-token-2024
```

### **Subscribe to Fields:**
Make sure to select:
- ✅ `messages` - For incoming messages
- ✅ `message_deliveries` - For delivery status
- ✅ `message_reads` - For read receipts

## 4. Test Webhook Verification

Click "Verify and save" in Facebook console. If successful, you should see:
- ✅ Webhook verified
- Your backend logs should show: "Facebook WhatsApp webhook verified successfully"

## 5. Get Your WhatsApp Credentials

After webhook setup, you need:

### **Access Token:**
1. Go to WhatsApp > API Setup in Facebook console
2. Copy the "Temporary access token" 
3. For production, generate a permanent token

### **Phone Number ID:**
1. In WhatsApp > API Setup
2. Find "From" phone number
3. Copy the Phone Number ID (long number)

### **App Secret:**
1. Go to App Settings > Basic
2. Copy "App Secret" (click Show)

## 6. Update Environment Variables

Update your `.env` file:

```bash
# Replace with actual values from Facebook console
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxx...
WHATSAPP_PHONE_NUMBER_ID=1234567890123456
WHATSAPP_WEBHOOK_VERIFY_TOKEN=crm-webhook-verify-token-2024
WHATSAPP_APP_SECRET=your-app-secret-here
```

## 7. Test the Integration

Run the test script:
```bash
node test-facebook-whatsapp.js
```

## 8. Send Test Message

Once everything is configured, test by:

1. **Add Test Phone Number:**
   - In Facebook console: WhatsApp > API Setup
   - Click "Manage phone number list"
   - Add your WhatsApp number

2. **Send Template Message:**
   ```bash
   curl -X POST "https://graph.facebook.com/v21.0/YOUR_PHONE_NUMBER_ID/messages" \
   -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
   -H "Content-Type: application/json" \
   -d '{
     "messaging_product": "whatsapp",
     "to": "YOUR_WHATSAPP_NUMBER",
     "type": "template",
     "template": {
       "name": "hello_world",
       "language": {"code": "en_US"}
     }
   }'
   ```

3. **Reply to Message:**
   - Reply to the WhatsApp message from your phone
   - Check your backend logs for incoming webhook

## Troubleshooting

### Webhook Verification Fails:
- Check ngrok URL is correct
- Ensure backend server is running
- Verify token matches exactly
- Check backend logs for errors

### Message Sending Fails:
- Verify access token is valid
- Check phone number is in test recipients
- Ensure template "hello_world" exists

### No Webhook Received:
- Check webhook subscription fields
- Verify ngrok tunnel is active
- Check backend server logs
- Test with ngrok web interface (http://127.0.0.1:4040)

## Production Deployment

For production:
1. Deploy backend to cloud service (AWS, GCP, Azure, etc.)
2. Use HTTPS domain instead of ngrok
3. Generate permanent access token
4. Set up proper SSL certificates