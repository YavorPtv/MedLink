# 🏗️ MedLink Architecture

## 🌐 Overview

MedLink is a modern telehealth web application that allows:
- Real-time video consultations between doctors and patients
- Live AI transcription of medical conversations
- Uploading and annotating medical images
- Secure profile and dashboard management

---

## ⚙️ Tech Stack

| Layer          | Tech                                  |
|----------------|--------------------------------------|
| Frontend       | React.js, HTML, CSS                  |
| Styling        | Tailwind CSS (optional), Vanilla CSS |
| Routing        | React Router                         |
| Video Calls    | WebRTC / AWS Chime SDK               |
| Transcription  | AWS Transcribe / Amazon Transcribe Medical |
| Image Storage  | AWS S3                               |
| Backend APIs   | AWS Lambda + API Gateway             |
| Auth           | AWS Cognito                          |
| Database       | AWS DynamoDB or RDS                  |
| Deployment     | AWS Amplify / S3 + CloudFront        |

---

## 🏛️ Architecture Diagram

```
                +------------------+
                |   User Browser   |
                |  (React.js App)  |
                +------------------+
                          |
               +---------------------+
               |   React Router &    |
               |   Component Pages   |
               +---------------------+
                          |
                  API Calls (HTTPS)
                          |
                +-------------------+
                |  AWS API Gateway  |
                +-------------------+
                          |
                +-------------------+
                |    AWS Lambda     |
                | (Serverless APIs) |
                +-------------------+
                          |
        +-----------------+-------------------+
        |                                     |
+------------------+               +---------------------+
|     DynamoDB     |               |         S3          |
| (users, notes,   |               |  (medical images,   |
|  transcripts)    |               |     documents)      |
+------------------+               +---------------------+
                          |
                +-------------------+
                |  AWS Transcribe   |
                | (medical speech   |
                |    to text)       |
                +-------------------+
                          |
                +-------------------+
                |   AWS Cognito     |
                |  (Authentication) |
                +-------------------+
                          |
                +-------------------+
                | AWS CloudFront    |
                | (HTTPS CDN + SSL) |
                +-------------------+
```
---

## 🗂️ Frontend Structure

- `/components`
  - `/LandingPage`
  - `/LoginPage`
  - `/RegisterPage`
  - `/Dashboard`
  - `/VideoCallRoom`
  - `/ImageAnnotation`
  - `/Transcripts`
  - `/Profile`
- `/App.jsx` - routes all pages
- `/index.js` - entry point

---

## 🔗 Data Flow Example (Video Call + Transcription)

1. User clicks **Start Call** -> opens `VideoCallRoom`.
2. `getUserMedia` captures video/audio.
3. Stream sent to peer (via WebRTC / Chime).
4. Audio also sent to AWS Transcribe for live transcription.
5. Transcript returned to frontend and displayed in real time.

---

## 🔐 Security

- All user data secured with AWS Cognito JWT tokens.
- Medical images stored in private S3 buckets.
- HTTPS enforced via CloudFront.

---

## 🚀 Deployment

- **Frontend**: Deployed via AWS Amplify or S3 + CloudFront.
- **API**: Deployed as serverless via Lambda + API Gateway.
- **Domain**: Custom domain with Route53.

---

## 📈 Scalability

- Stateless Lambda functions scale on demand.
- S3 & CloudFront handle static file delivery at scale.
- DynamoDB/RDS automatically scales reads/writes.

---