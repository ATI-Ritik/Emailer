import crypto from "crypto-js";
import dotenv from "dotenv";
import querystring from "querystring"; // Import querystring module
import { XMLParser } from "fast-xml-parser";

dotenv.config();

// Step 3: Configure Environment Variables
const senderEmail = process.env.SENDER_EMAIL;
const receiverEmail = process.env.RECEIVER_EMAIL;
const accessKey = process.env.ACCESS_KEY;
const secretKey = process.env.SECRECT_KEY;
const regionName = process.env.REGION_NAME;

if (!senderEmail || !receiverEmail || !accessKey || !secretKey || !regionName) {
  console.error(
    "Error: Missing environment variables. Ensure SENDER_EMAIL, RECEIVER_EMAIL, ACCESS_KEY, SECRECT_KEY, and REGION_NAME are set."
  );
  process.exit(1);
}

const sesEndpoint = `email.${regionName}.amazonaws.com`;
const awsService = "ses";
const awsHttpMethod = "POST";
const awsAction = "SendEmail";
const awsRequestUri = "/"; // For SES API, it's usually root path
const awsContentType = "application/x-www-form-urlencoded"; // Updated Content-Type
const awsAccept = "application/xml"; // Updated Accept header

// Step 4: Construct the SES API Request Payload (x-www-form-urlencoded)
const requestPayload = {
  Action: awsAction,
  "Destination.ToAddresses.member.1": receiverEmail, // Adjusted for x-www-form-urlencoded format
  "Message.Body.Text.Charset": "UTF-8",
  "Message.Body.Text.Data":
    "This is a test email sent using SES API and Javascript fetch without AWS SDK! ENV VARS are in use.",
  "Message.Subject.Charset": "UTF-8",
  "Message.Subject.Data": "Test Email from SES API (No AWS SDK)",
  Source: senderEmail,
};

const requestBody = querystring.stringify(requestPayload); // URL-encode the payload

// Step 5:  AWS Signature Version 4 Signing Logic

function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = crypto.HmacSHA256(dateStamp, "AWS4" + key);
  const kRegion = crypto.HmacSHA256(regionName, kDate);
  const kService = crypto.HmacSHA256(serviceName, kRegion);
  const kSigning = crypto.HmacSHA256("aws4_request", kService);
  return kSigning;
}

function generateAuthorizationHeader(
  accessKey,
  secretKey,
  regionName,
  serviceName,
  requestBody,
  awsHttpMethod,
  awsRequestUri,
  awsHeaders
) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const dateStamp = amzDate.substring(0, 8);

  const canonicalUri = awsRequestUri;
  const canonicalQueryString = ""; // Query string is empty for POST in this example
  const canonicalHeaders = [
    ["content-type", awsContentType],
    ["host", sesEndpoint],
    ["x-amz-date", amzDate],
  ]
    .map(([key, value]) => `${key}:${value}\n`)
    .join("");
  const signedHeaders = "content-type;host;x-amz-date";

  const payloadHash = crypto.SHA256(requestBody).toString(crypto.enc.Hex); // Hash the URL-encoded body

  const canonicalRequest = [
    awsHttpMethod,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = [
    dateStamp,
    regionName,
    serviceName,
    "aws4_request",
  ].join("/");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    crypto.SHA256(canonicalRequest).toString(crypto.enc.Hex),
  ].join("\n");

  const signingKey = getSignatureKey(
    secretKey,
    dateStamp,
    regionName,
    serviceName
  );
  const signature = crypto
    .HmacSHA256(stringToSign, signingKey)
    .toString(crypto.enc.Hex);

  const authorizationHeader = [
    `AWS4-HMAC-SHA256`, // Algorithm first
    `Credential=${accessKey}/${credentialScope}`, // Then Credential
    `SignedHeaders=${signedHeaders}`, // Signed Headers
    `Signature=${signature}`, // Finally Signature
  ].join(", ");

  // --- Detailed Logging of Signature Components ---
  console.log("\n--- Signature Generation Detailed Logging ---");
  console.log("amzDate:", amzDate);
  console.log("dateStamp:", dateStamp);
  console.log("canonicalUri:", canonicalUri);
  console.log("canonicalQueryString:", canonicalQueryString);
  console.log("canonicalHeaders:\n", canonicalHeaders);
  console.log("signedHeaders:", signedHeaders);
  console.log("payloadHash:", payloadHash);
  console.log("canonicalRequest:\n", canonicalRequest);
  console.log("credentialScope:", credentialScope);
  console.log("stringToSign:\n", stringToSign);
  console.log(
    "signingKey (first 20 chars):",
    signingKey.toString().substring(0, 20) + "..."
  ); // Log only the beginning for security
  console.log("signature:", signature);
  console.log("Authorization Header:", authorizationHeader);
  console.log("--- End Signature Logging ---\n");

  return authorizationHeader;
}

// Step 6: Prepare Headers for Fetch Request
const headers = {
  "Content-Type": awsContentType, // Updated to application/x-www-form-urlencoded
  Accept: awsAccept, // Updated to application/xml
  "X-Amz-Date":
    new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
  Authorization: generateAuthorizationHeader(
    accessKey,
    secretKey,
    regionName,
    awsService,
    requestBody,
    awsHttpMethod,
    awsRequestUri,
    null
  ),
};

// Step 7: Make the Fetch API Call
const apiUrl = `https://${sesEndpoint}${awsRequestUri}`;

async function sendSesEmail() {
  // Added logging for debugging
  console.log("Region Name:", regionName);
  console.log("SES Endpoint:", sesEndpoint);
  console.log("API URL:", apiUrl);
  console.log("Request Headers:", headers);
  console.log("Request Body:", requestBody);

  try {
    const response = await fetch(apiUrl, {
      method: awsHttpMethod,
      headers: headers,
      body: requestBody, // Now sending URL-encoded body
    });

    if (!response.ok) {
      const errorResponse = await response.text(); // Expecting XML error, so using text()
      console.error("SES API Error:", response.status, response.statusText);
      console.error("Error Details (XML):", errorResponse); // Log XML error
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text(); // Expecting XML success response
    const parser = new XMLParser();
    let jObj = parser.parse(data);
    console.log("Response (JSON):", jObj); // Log JSON response
    console.log("Email sent successfully!");
    console.log("Response (XML):", data); // Log XML response
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

// Step 8: Execute the function to send email
sendSesEmail();
