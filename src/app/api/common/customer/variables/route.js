import { NextResponse } from 'next/server';

// Mock customer database - In production, this would come from your actual database
const customerDatabase = {
  "+17084769340": {
    "username": "stephenm@telnyx.com",
    "id": "11245-dghgs4-sdgnew4t-dsgd1",
    "name": "Hannibal Lecter",
    "customer_id": "999123",
    "passphrase": "1234",
    "address": "Chicago, Oak Street 66",
    "phone": "+17084769340",
    "email": "farberbeans@gmail.com",
    "age": 45,
    "dob": "1971-10-06",
    "nick": "BB"
  },
  "+18139955751": {
    "username": "demo@telnyx.com",
    "id": "22345-xyz123-abc456-def789",
    "name": "Dr. Bratschi",
    "customer_id": "888456",
    "passphrase": "5678",
    "address": "New York, Broadway 123",
    "phone": "+18139955751",
    "email": "hannibal@gmail.com",
    "age": 52,
    "dob": "1969-05-15",
    "nick": "Keanu"
  },
  "+15551234567": {
    "username": "test@telnyx.com",
    "id": "33456-test789-sample123-demo456",
    "name": "Jane Smith",
    "customer_id": "777789",
    "passphrase": "9999",
    "address": "Los Angeles, Sunset Blvd 456",
    "phone": "+15551234567",
    "email": "janesmith@gmail.com",
    "age": 34,
    "dob": "1989-12-25",
    "nick": "Jane"
  }
};

export async function POST(request) {
  try {
    console.log('=== TELNYX CUSTOMER VARIABLES WEBHOOK RECEIVED ===');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);

    // Parse the incoming webhook payload
    const webhookData = await request.json();
    console.log('=== RAW WEBHOOK DATA ===');
    console.log(JSON.stringify(webhookData, null, 2));

    // Extract the phone number from the webhook payload
    // Try both possible data structures
    const phoneNumber =
      webhookData?.data?.payload?.telnyx_end_user_target ||
      webhookData?.webhook_payload?.data?.payload?.telnyx_end_user_target;

    if (!phoneNumber) {
      console.error('No telnyx_end_user_target found in webhook payload');
      return NextResponse.json(
        {
          error: 'telnyx_end_user_target not found in webhook payload',
          received_payload: webhookData
        },
        { status: 400 }
      );
    }

    console.log('Extracted phone number:', phoneNumber);

    // Look up customer information by phone number
    const customerInfo = customerDatabase[phoneNumber];

    if (!customerInfo) {
      console.log('No customer found for phone number:', phoneNumber);
      // Return a default/unknown customer object
      return NextResponse.json({
        "username": "unknown@telnyx.com",
        "id": "unknown-id",
        "name": "Unknown Customer",
        "customer_id": "000000",
        "passphrase": "0000",
        "address": "Unknown Address",
        "phone": phoneNumber,
        "email": "unknown@example.com",
        "age": 0,
        "dob": "1900-01-01",
        "nick": "Unknown"
      });
    }

    console.log('=== FOUND CUSTOMER INFO ===');
    console.log(JSON.stringify(customerInfo, null, 2));

    // Return the customer information directly
    console.log('=== RETURNING CUSTOMER DATA ===');
    return NextResponse.json(customerInfo);

  } catch (error) {
    console.error('Error processing customer variables webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process customer variables webhook',
        details: error.message
      },
      { status: 500 }
    );
  }
}